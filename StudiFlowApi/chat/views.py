from rest_framework import generics, status
from rest_framework.response import Response
from langchain.document_loaders import DirectoryLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
import traceback
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
from psycopg2.extras import RealDictCursor
import cloudinary

# Create your views here.
load_dotenv()

PROMPT_TEMPLATE = """
You are a helpful assistant that for a college student. 
The user will ask you questions about the content of the uploaded resources.
Provide the user with detailed and relevant information from the uploaded resources.
You can also use your knowledge base to answer the user's questions, 
but only if the user asks about a specific topic or question that is not covered in the resources.
If the user asks about a specific topic or question that is not covered in the resources, 
you must let them know that the response is generated directly from AI without specific references.
You are free to build on the response that is generated from the context, 
but 90 percent of the response should be the response from the resources.
Only 10 percent of the response should be your own knowledge.
{context}

---

Answer the question based on the above context: {question}
"""

cloudinary.config( 
    cloud_name = os.environ['CLOUDINARY_CLOUD_NAME'], 
    api_key = os.environ['CLOUDINARY_API_KEY'], 
    api_secret = os.environ['CLOUDINARY_API_SECRET'],
    secure=True
)

class ResourceUpload(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        course_id = request.data.get('course_id') 
        files = request.FILES.getlist('files')

        if not user_id or not files:
            return Response({"error": "User ID and files are required"}, status=status.HTTP_400_BAD_REQUEST)

        # TODO: Change the code below to remap to the Amazon S3 bucket (for later)
        upload_dir = os.path.join(settings.MEDIA_ROOT, f'uploads/{user_id}/{course_id}')
        os.makedirs(upload_dir, exist_ok=True)
        
        file_names = []
        for file in files:
            file_path = os.path.join(upload_dir, file.name)
            with default_storage.open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            file_names.append(file.name)

        # Process the uploaded files
        documents = self.load_documents(upload_dir)
        chunks = self.split_text(documents)
        self.save_to_postgres(chunks, user_id, course_id, file_names)

        return Response({"response": "Files processed and stored successfully"}, status=status.HTTP_201_CREATED)

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

    def save_to_postgres(self, chunks: list[Document], user_id: str, course_id: str, file_names: list[str]):
        embeddings = OpenAIEmbeddings()
        DATABASE_URL = os.environ['DATABASE_URL']
        
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                data = []
                for chunk in chunks:
                    embedding = embeddings.embed_query(chunk.page_content)
                    file_name = chunk.metadata.get('source', '').split('/')[-1]  
                    data.append((user_id, course_id, chunk.page_content, embedding, file_name))
                
                execute_values(cur, 
                               "INSERT INTO embeddings (user_name, course_id, content, embedding, source_file) VALUES %s",
                               data)
                
                conn.commit()
        
        print(f"Saved {len(chunks)} chunks to Postgres.")

class ChatHistory(generics.GenericAPIView):
    def post(self, request: Request, *args, **kwargs):
        print("ChatHistory endpoint hit")
        print(f"Request data: {request.data}")

        user_email = request.data.get('user_email')
        course_id = request.data.get('course_id')

        print(f"user_email: {user_email}, course_id: {course_id}")

        if not user_email or not course_id:
            print("Missing user_email or course_id")
            return Response({"error": "user_email and course_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            DATABASE_URL = os.environ['DATABASE_URL']
            
            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    print("Executing SQL query")
                    cur.execute("""
                        SELECT m.id, m.sender, m.text, m.timestamp
                        FROM messages m
                        JOIN chats c ON m.chat_id = c.id
                        WHERE c.user_email = %s AND c.course_id = %s
                        ORDER BY m.timestamp ASC
                    """, (user_email, course_id))
                    
                    print("Fetching results")
                    results = cur.fetchall()
                    print(f"Number of results: {len(results)}")

                    messages = [
                        {
                            'id': row['id'],
                            'sender': row['sender'],
                            'text': row['text'],
                            'timestamp': row['timestamp'].isoformat()
                        }
                        for row in results
                    ]

            print(f"Returning {len(messages)} messages")
            return Response(messages, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Exception occurred: {str(e)}")
            import traceback
            print("Traceback:")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class Chat(generics.GenericAPIView):
    def post(self, request: Request, *args, **kwargs):
        query_text = request.data.get('query')
        user_email = request.data.get('user_email')
        course_id = request.data.get('course_id')
        
        if not query_text or not user_email or not course_id:
            return Response({"error": "Query, user_email, and course_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        chat_id = self.get_or_create_chat(user_email, course_id)

        results = self.query_postgres(query_text, user_email, course_id, k=3)
        
        if len(results) == 0 or results[0][1] < 0.7:
            # No matching results from the database
            prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
            prompt = prompt_template.format(context="No specific context available.", question=query_text)

            model = ChatOpenAI()
            response_text = model.predict(prompt)

            formatted_response = f"{response_text}\n\nNote: This response is generated directly from AI without specific references."
        else:
            context_text = "\n\n---\n\n".join([content for content, _score in results])
            prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
            prompt = prompt_template.format(context=context_text, question=query_text)

            model = ChatOpenAI()
            response_text = model.predict(prompt)

            formatted_response = f"{response_text}\n"

        # Save the user's message and the bot's response
        self.save_message(chat_id, 'user', query_text)
        self.save_message(chat_id, 'bot', formatted_response)

        return Response({"response": formatted_response}, status=status.HTTP_200_OK)

    def get_or_create_chat(self, user_email, course_id):
        DATABASE_URL = os.environ['DATABASE_URL']
        with psycopg2.connect(DATABASE_URL, sslmode='require') as conn:
            with conn.cursor() as cur:
                # Check if chat exists
                cur.execute("SELECT id FROM chats WHERE user_email = %s AND course_id = %s", (user_email, course_id))
                result = cur.fetchone()
                
                if result:
                    return result[0]
                else:
                    cur.execute("INSERT INTO chats (user_email, course_id) VALUES (%s, %s) RETURNING id", (user_email, course_id))
                    conn.commit()
                    return cur.fetchone()[0]

    def save_message(self, chat_id, sender, text):
        DATABASE_URL = os.environ['DATABASE_URL']
        with psycopg2.connect(DATABASE_URL, sslmode='require') as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO messages (chat_id, sender, text) VALUES (%s, %s, %s)", (chat_id, sender, text))
                conn.commit()

    def query_postgres(self, query_text, user_email, course_id, k=3):
        embeddings = OpenAIEmbeddings()
        query_embedding = embeddings.embed_query(query_text)
        DATABASE_URL = os.environ['DATABASE_URL']

        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT content, embedding 
                    FROM embeddings 
                    WHERE user_name = %s AND course_id = %s
                """, (user_email, course_id))
                results = cur.fetchall()

        similarities = [(content, self.cosine_similarity(np.array(query_embedding), self.string_to_array(embedding)))
                        for content, embedding in results]
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]

    def cosine_similarity(self, a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def string_to_array(self, s):
        return np.fromstring(s.strip('[]'), sep=',')