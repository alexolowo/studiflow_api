from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from .serializers import SignUpSerializer
from rest_framework import status, generics
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated, AllowAny

from .tokens import create_tokens

# Create your views here.


class SignUpView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = SignUpSerializer

    def post(self, request: Request):
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            user = authenticate(request=request, email=request.data['email'], password=request.data['password'])
            tokens = create_tokens(user)

            response = {
                'message': 'User created successfully',
                'data': serializer.data,
                'token': tokens
            }

            return Response(data=response, status=status.HTTP_201_CREATED)
        
        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request: Request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(request=request, email=email, password=password)
        
        if user is not None:
            tokens = create_tokens(user)
            response = {
                'message': 'User logged in successfully',
                'token': tokens
            }
            login(request, user)
            
            return Response(data=response, status=status.HTTP_200_OK)
        return Response(data={'message':'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
        
    def get(self, request: Request):
        content={
            "user":str(request.user),  
            "auth":str(request.auth),  
        }
        
        return Response(data=content, status=status.HTTP_200_OK)
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    
    def post(self, request: Request):
        logout(request)
        return Response(data={'message': 'logout successful'}, status=status.HTTP_200_OK)