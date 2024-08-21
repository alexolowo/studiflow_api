from rest_framework import generics, status
from rest_framework.response import Response
from langchain.document_loaders import DirectoryLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
import openai
from dotenv import load_dotenv
import os
import psycopg2
from psycopg2.extras import execute_values
from django.core.files.storage import default_storage
from django.conf import settings
from rest_framework.request import Request
from django.shortcuts import render, HttpResponse
import numpy as np
from langchain.prompts import ChatPromptTemplate



# Create your views here.
load_dotenv()

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

class ResourceUpload(generics.GenericAPIView):
    def get(self, request: Request, *args, **kwargs):
        return HttpResponse("Hello freaking world")
    
    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        course_id = request.data.get('course_id', 'CSC263')
        files = request.FILES.getlist('files')

        if not user_id or not files:
            return Response({"error": "User ID and files are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Save uploaded files
        upload_dir = os.path.join(settings.MEDIA_ROOT, f'uploads/{user_id}/{course_id}')
        os.makedirs(upload_dir, exist_ok=True)
        
        for file in files:
            file_path = os.path.join(upload_dir, file.name)
            with default_storage.open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

        # Process the uploaded files
        documents = self.load_documents(upload_dir)
        chunks = self.split_text(documents)
        self.save_to_postgres(chunks, user_id, course_id)

        return Response({"response": "Files processed  ç stored successfully"}, status=status.HTTP_201_CREATED)

    def load_documents(self, data_path):
        loader = DirectoryLoader(data_path, glob="*.pdf", loader_cls=PyPDFLoader)
        documents = loader.load()
        return documents

    def split_text(self, documents: list[Document]):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,
            chunk_overlap=100,
            length_function=len,
            add_start_index=True,
        )
        chunks = text_splitter.split_documents(documents)
        print(f"Split {len(documents)} documents into {len(chunks)} chunks.")
        return chunks

    def save_to_postgres(self, chunks: list[Document], user_id: str, course_id: str):
        embeddings = OpenAIEmbeddings()
        DATABASE_URL = os.environ['DATABASE_URL']
        
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Prepare data for insertion
                data = []
                for chunk in chunks:
                    embedding = embeddings.embed_query(chunk.page_content)
                    data.append((user_id, course_id, chunk.page_content, embedding))
                
                # Insert data
                execute_values(cur, 
                               "INSERT INTO embeddings (user_name, course_id, content, embedding) VALUES %s",
                               data)
                
                conn.commit()
        
        print(f"Saved {len(chunks)} chunks to Postgres.")

class Chat(generics.GenericAPIView):
    def get(self, request: Request, *args, **kwargs):
        return HttpResponse("Hello freaking world")
    
    def post(self, request: Request, *args, **kwargs):
        query_text = request.data.get('query')
        
        if not query_text:
            return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)

        results = self.query_postgres(query_text, k=3)
        
        if len(results) == 0 or results[0][1] < 0.7:
            # No matching results from the database
            prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
            prompt = prompt_template.format(context="No specific context available.", question=query_text)

            model = ChatOpenAI()
            response_text = model.predict(prompt)

            formatted_response = f"{response_text}\n\nNote: This response is generated directly from AI without specific references."
        else:
            # Matching results found in the database
            context_text = "\n\n---\n\n".join([content for content, _score in results])
            prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
            prompt = prompt_template.format(context=context_text, question=query_text)

            model = ChatOpenAI()
            response_text = model.predict(prompt)

            formatted_response = f"{response_text}\n"

        return Response({"response": formatted_response}, status=status.HTTP_200_OK)

    def query_postgres(self, query_text, k=3):
        embeddings = OpenAIEmbeddings()
        query_embedding = embeddings.embed_query(query_text)
        DATABASE_URL = os.environ['DATABASE_URL']

        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT content, embedding FROM embeddings")
                results = cur.fetchall()

        similarities = [(content, self.cosine_similarity(np.array(query_embedding), self.string_to_array(embedding)))
                        for content, embedding in results]
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]

    def cosine_similarity(self, a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def string_to_array(self, s):
        return np.fromstring(s.strip('[]'), sep=',')