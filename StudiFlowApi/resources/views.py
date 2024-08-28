from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Resource
from .serializers import ResourceSerializer
import cloudinary.uploader
import cloudinary.api
import os
import psycopg2
from psycopg2.extras import execute_values
from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader
import tempfile

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
            # Upload file to Cloudinary
            upload_result = cloudinary.uploader.upload(file, resource_type="auto")
            
            # Create Resource object
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
            
            # Process the file and generate embeddings
            self.process_file(resource, upload_result['public_id'])
            
            uploaded_resources.append(serializer.data)

        return Response(uploaded_resources, status=status.HTTP_201_CREATED)

    def process_file(self, resource, public_id):
        # Download the file from Cloudinary
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resource.resource_name)[1]) as temp_file:
            cloudinary.api.download(public_id, file=temp_file.name)
            temp_file_path = temp_file.name

        try:
            # Process the file based on its type
            if resource.resource_type == 'application/pdf':
                loader = PyPDFLoader(temp_file_path)
                documents = loader.load()
            else:
                # For other file types, you might need to implement different loaders
                with open(temp_file_path, 'r') as file:
                    documents = [file.read()]

            # Split the text
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=300,
                chunk_overlap=100,
                length_function=len,
                add_start_index=True,
            )
            chunks = text_splitter.split_documents(documents)

            # Generate embeddings and save to database
            self.save_embeddings(chunks, resource)

            # Update resource content
            resource.resource_content = ' '.join([chunk.page_content for chunk in chunks])
            resource.save()

        finally:
            # Clean up temporary file
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
                
                execute_values(cur, 
                               "INSERT INTO embeddings (user_name, course_id, content, embedding, source_file) VALUES %s",
                               data)
                
                conn.commit()

class ResourceList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ResourceSerializer

    def get_queryset(self):
        user = self.request.user
        return Resource.objects.filter(user=user, course_id=self.kwargs['course_id'])
    
    def get(self, request, *args, **kwargs):
        course_id = kwargs.get('course_id')
        queryset = self.get_queryset(course_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(data=serializer.data)
    

class ResourceDelete(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Resource.objects.all()
    
    def delete(self, request, *args, **kwargs):
        resource_id = kwargs.get('pk')
        user = request.user

        try:
            resource = get_object_or_404(Resource, id=resource_id, user=user)
            resource.delete()
            return Response({"message": "Resource deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Resource.DoesNotExist:
            return Response({"error": "Resource not found or you don't have permission to delete it"}, status=status.HTTP_404_NOT_FOUND)
