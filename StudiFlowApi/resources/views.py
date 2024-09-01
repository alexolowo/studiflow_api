from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Resource
from .serializers import ResourceSerializer
import cloudinary.uploader
import cloudinary
import os
import psycopg2
from psycopg2.extras import execute_values
from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader, TextLoader
import tempfile
import requests
from pypdf.errors import EmptyFileError
import logging

logger = logging.getLogger(__name__)

cloudinary.config( 
    cloud_name = os.environ['CLOUDINARY_CLOUD_NAME'], 
    api_key = os.environ['CLOUDINARY_API_KEY'], 
    api_secret = os.environ['CLOUDINARY_API_SECRET'],
    secure=True
)

class ResourceUploadView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ResourceSerializer

    def post(self, request, *args, **kwargs):
        user = request.user
        course_id = request.data.get('course_id')
        files = request.FILES.getlist('files')

        if not course_id or not files:
            return Response({"error": "Course ID and files are required"}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_resources = []
        for file in files:
            existing_resource = Resource.objects.filter(
                user=user,
                course_id=course_id,
                resource_name=file.name
            ).first()

            if existing_resource:
                return Response(
                    {"error": f"A file named '{file.name}' already exists for this course."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            upload_result = cloudinary.uploader.upload(file, resource_type="auto")
            
            resource_data = {
                'resource_name': file.name,
                'resource_type': file.content_type,
                'resource_link': upload_result['secure_url'],
                'resource_content': '',  # We'll update this after processing
                'user': user.id,
                'course_id': course_id
            }
            serializer = self.get_serializer(data=resource_data)
            serializer.is_valid(raise_exception=True)
            resource = serializer.save()
            
            try:
                self.process_file(resource, upload_result['secure_url'])
                uploaded_resources.append(serializer.data)
            except Exception as e:
                logger.error(f"Error processing file {file.name}: {str(e)}")
                resource.delete()  
                return Response({"error": f"Error processing file {file.name}: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"response": "Files processed and stored successfully"}, status=status.HTTP_201_CREATED)

    def process_file(self, resource, secure_url):
        download_url = secure_url.replace('/upload/', '/upload/fl_attachment/')
        
        logger.info(f"Downloading file from: {download_url}")

        response = requests.get(download_url)
        
        if response.status_code != 200:
            raise Exception(f"Failed to download file from Cloudinary. Status code: {response.status_code}")

        logger.info(f"Downloaded file size: {len(response.content)} bytes")

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resource.resource_name)[1]) as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name

        try:
            if resource.resource_type == 'application/pdf':
                try:
                    loader = PyPDFLoader(temp_file_path)
                    documents = loader.load()
                except EmptyFileError:
                    logger.error(f"Empty PDF file: {resource.resource_name}")
                    raise Exception("The PDF file is empty or corrupted")
            else:
                loader = TextLoader(temp_file_path)
                documents = loader.load()

            if not documents:
                raise Exception("No content could be extracted from the file")

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=300,
                chunk_overlap=100,
                length_function=len,
                add_start_index=True,
            )
            chunks = text_splitter.split_documents(documents)

            self.save_embeddings(chunks, resource)

            resource.resource_content = ' '.join([chunk.page_content for chunk in chunks])
            resource.save()

        finally:
            os.unlink(temp_file_path)

    def save_embeddings(self, chunks, resource):
        embeddings = OpenAIEmbeddings()
        DATABASE_URL = os.environ['DATABASE_URL']
        
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                data = []
                for chunk in chunks:
                    embedding = embeddings.embed_query(chunk.page_content)
                    data.append((resource.user.id, resource.course_id, chunk.page_content, embedding, resource.resource_name))
                
                # TODO: update this to take id instead of username
                execute_values(cur, 
                               "INSERT INTO embeddings (user_id, course_id, content, embedding, source_file) VALUES %s",
                               data)
                
                conn.commit()

class ResourceList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ResourceSerializer
    
    def get(self, request, course_id):
        user = request.user
        resources = Resource.objects.filter(user=user, course_id=course_id)
        serializer = ResourceSerializer(resources, many=True)
        return Response(serializer.data)
    

class ResourceDelete(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def delete_embeddings(self, course_id, user_id, source_file):
        DATABASE_URL = os.environ['DATABASE_URL']
        
        try:
            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM embeddings
                        WHERE course_id = %s
                        AND user_id = %s
                        AND source_file = %s
                    """, (course_id, user_id, source_file))
                    
                    deleted_count = cur.rowcount
                    conn.commit()
            
            return deleted_count
        except Exception as e:
            logger.error(f"Error deleting embeddings: {str(e)}")
            raise

    def post(self, request):
        user = request.user
        resource_ids = request.data.get('ids', [])
        
        deleted_resources = []
        errors = []

        for resource_id in resource_ids:
            try:
                resource = Resource.objects.get(id=resource_id, user=user)
                
                # Extract public_id from the Cloudinary URL
                public_id = resource.resource_link.split('/')[-1].split('.')[0]
                
                # Delete file from Cloudinary
                try:
                    result = cloudinary.uploader.destroy(public_id)
                    if result.get('result') == 'ok':
                        # If Cloudinary deletion is successful, delete the resource from the database
                        self.delete_embeddings(resource.course_id, user.id, resource.resource_name)
                        resource.delete()
                        deleted_resources.append(resource_id)
                    else:
                        errors.append(f"Failed to delete resource {resource_id} from Cloudinary")
                except Exception as e:
                    logger.error(f"Error deleting resource {resource_id} from Cloudinary: {str(e)}")
                    errors.append(f"Error deleting resource {resource_id} from Cloudinary")
            
            except Resource.DoesNotExist:
                errors.append(f"Resource {resource_id} not found or does not belong to the user")

        if errors:
            return Response({
                "message": "Some resources could not be deleted",
                "deleted": deleted_resources,
                "errors": errors
            }, status=status.HTTP_207_MULTI_STATUS)
        
        return Response({
            "message": "Resources deleted successfully",
            "deleted": deleted_resources
        }, status=status.HTTP_200_OK)
