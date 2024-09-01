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
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain
from langchain.schema import HumanMessage, AIMessage


# Create your views here.
load_dotenv()

PROMPT_TEMPLATE = """
You are a friendly and knowledgeable AI assistant/tutor called StudiFlow AI. Your goal is to provide helpful, detailed, and conversational responses based on the uploaded resources and your general knowledge.

Guidelines:
1. Use the provided context as your primary source of information (aim for 90% of your response).
2. Supplement with your general knowledge when appropriate (up to 10% of your response).
3. If the question isn't covered in the resources, clearly state that your answer is based on AI knowledge without specific references.
4. Maintain a warm, engaging tone throughout the conversation.
5. Provide detailed explanations, examples, and analogies to enhance understanding.
6. Ask follow-up questions if clarification is needed.
7. Encourage critical thinking by posing thought-provoking questions related to the topic.

Context:
{context}

Chat History:
{history}

Student's Question: {question}

Please provide a friendly, detailed, and conversational response:
"""

cloudinary.config( 
    cloud_name = os.environ['CLOUDINARY_CLOUD_NAME'], 
    api_key = os.environ['CLOUDINARY_API_KEY'], 
    api_secret = os.environ['CLOUDINARY_API_SECRET'],
    secure=True
)

class ResourceUpload(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        user_id = request.user.id
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
                               "INSERT INTO embeddings (user_id, course_id, content, embedding, source_file) VALUES %s",
                               data)
                
                conn.commit()
        
        print(f"Saved {len(chunks)} chunks to Postgres.")

class ChatHistory(generics.GenericAPIView):
    def post(self, request: Request, *args, **kwargs):
        print("ChatHistory endpoint hit")
        print(f"Request data: {request.data}")

        user = request.user
        course_id = request.data.get('course_id')

        print(f"user_id: {user.id}, course_id: {course_id}")

        if not user or not course_id:
            print("Missing user or course_id")
            return Response({"error": "userID and course_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            DATABASE_URL = os.environ['DATABASE_URL']
            
            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    print("Executing SQL query")
                    cur.execute("""
                        SELECT m.id, m.sender, m.text, m.timestamp
                        FROM messages m
                        JOIN chats c ON m.chat_id = c.id
                        WHERE c.user_id = %s AND c.course_id = %s
                        ORDER BY m.timestamp ASC
                    """, (str(user.id), course_id))
                    
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
    
    def delete(self, request: Request, *args, **kwargs):
        print("ChatHistory delete endpoint hit")
        print(f"Request data: {request.data}")

        user = request.user
        course_id = request.data.get('course_id')

        print(f"user: {user}, course_id: {course_id}")

        if not user or not course_id:
            print("Missing user or course_id")
            return Response({"error": "userID and course_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            DATABASE_URL = os.environ['DATABASE_URL']
            
            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor() as cur:
                    print("Executing SQL delete query")
                    cur.execute("""
                        DELETE FROM messages
                        WHERE chat_id IN (
                            SELECT id FROM chats
                            WHERE user_id = %s AND course_id = %s
                        )
                    """, (str(user.id), course_id))
                    
                    deleted_count = cur.rowcount
                    conn.commit()

            print(f"Deleted {deleted_count} messages")
            return Response({"message": f"Successfully deleted {deleted_count} messages"}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Exception occurred: {str(e)}")
            import traceback
            print("Traceback:")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class Chat(generics.GenericAPIView):
    def post(self, request: Request, *args, **kwargs):
        query_text = request.data.get('query')
        user = request.user
        course_id = request.data.get('course_id')
        
        if not query_text or not user or not course_id:
            return Response({"error": "Query, userID, and course_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        chat_id = self.get_or_create_chat(user.id, course_id)

        # Retrieve chat history
        chat_history = self.get_chat_history(chat_id)
        print("Chat history is", chat_history)
        
        results = self.query_postgres(query_text, user.id, course_id, k=3)

        
        if len(results) == 0 or results[0][1] < 0.7:
            context = "No specific context available."
        else:
            context = "\n\n---\n\n".join([content for content, _score in results])

        prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context, question=query_text, history=chat_history)

        model = ChatOpenAI()

        response_text = model.predict(prompt)

        formatted_response = f"{response_text}\n"

        # Save the user's message and the bot's response
        self.save_message(chat_id, 'user', query_text)
        self.save_message(chat_id, 'bot', formatted_response)

        return Response({"response": formatted_response}, status=status.HTTP_200_OK)

    def get_chat_history(self, chat_id, k=3):  # k is the number of recent conversations to return
        DATABASE_URL = os.environ['DATABASE_URL']
        with psycopg2.connect(DATABASE_URL, sslmode='require') as conn:
            with conn.cursor() as cur:
                # Modify the SQL query to get only the most recent K * 2 messages
                # (assuming each conversation has a user message and an AI response)
                cur.execute("""
                    SELECT sender, text 
                    FROM (
                        SELECT sender, text, timestamp,
                            ROW_NUMBER() OVER (ORDER BY timestamp DESC) as row_num
                        FROM messages 
                        WHERE chat_id = %s
                    ) sub
                    WHERE row_num <= %s
                    ORDER BY timestamp ASC
                """, (chat_id, k * 2))
                results = cur.fetchall()
        
        chat_history = []
        for sender, text in results:
            if sender == 'user':
                chat_history.append(HumanMessage(content=text))
            else:
                chat_history.append(AIMessage(content=text))
        
        return chat_history
    
    def get_or_create_chat(self, user_id, course_id):
        DATABASE_URL = os.environ['DATABASE_URL']
        with psycopg2.connect(DATABASE_URL, sslmode='require') as conn:
            with conn.cursor() as cur:
                # Check if chat exists
                print("Checking if chat exists", str(user_id), course_id)
                cur.execute("SELECT id FROM chats WHERE user_id = %s AND course_id = %s", (str(user_id), course_id))
                result = cur.fetchone()
                
                if result:
                    return result[0]
                else:
                    cur.execute("INSERT INTO chats (user_id, course_id) VALUES (%s, %s) RETURNING id", (user_id, course_id))
                    conn.commit()
                    return cur.fetchone()[0]

    def save_message(self, chat_id, sender, text):
        DATABASE_URL = os.environ['DATABASE_URL']
        with psycopg2.connect(DATABASE_URL, sslmode='require') as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO messages (chat_id, sender, text) VALUES (%s, %s, %s)", (chat_id, sender, text))
                conn.commit()

    def query_postgres(self, query_text, user_id, course_id, k=3):
        embeddings = OpenAIEmbeddings()
        query_embedding = embeddings.embed_query(query_text)
        DATABASE_URL = os.environ['DATABASE_URL']

        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT content, embedding 
                    FROM embeddings 
                    WHERE user_id = %s AND course_id = %s
                """, (str(user_id), course_id))
                results = cur.fetchall()

        similarities = [(content, self.cosine_similarity(np.array(query_embedding), self.string_to_array(embedding)))
                        for content, embedding in results]
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]

    def cosine_similarity(self, a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def string_to_array(self, s):
        return np.fromstring(s.strip('[]'), sep=',')