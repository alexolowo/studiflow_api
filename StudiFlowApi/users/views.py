from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from .serializers import SignUpSerializer
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes, APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.middleware.csrf import get_token
from .tokens import create_tokens

# Create your views here.


class SignUpView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = SignUpSerializer

    def post(self, request: Request):
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            serializer.save()

            response = {
                'message': 'User created successfully',
                'data': serializer.data
            }

            return Response(data=response, status=status.HTTP_201_CREATED)
        
        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LoginView(APIView):
    permission_classes = []
    
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

@api_view(http_method_names=['GET'])
@permission_classes([AllowAny])
def generate_csrf(request):
    token = get_token(request)
    return Response({'csrftoken': token})
# class LogoutView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request: Request):
#         # Get the CSRF token from the request
#         request.META['HTTP_X_CSRFTOKEN'] = get_token(request)
#         csrf_token = request.META["HTTP_X_CSRFTOKEN"]
#         # Validate the CSRF token
#         if not csrf_token or not request.csrf_processing_done:
#             return Response({"detail": "CSRF token missing or invalid."}, status=status.HTTP_403_FORBIDDEN)

#         # Logout the user
#         logout(request)

#         # Return a success response
#         return Response(status=status.HTTP_200_OK)
