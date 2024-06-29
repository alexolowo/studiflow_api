# StudiFlowApi

This is a Django project. Follow the steps below to setup and run the application.

## Prerequisites

Ensure you have Python installed on your machine. This project uses Python 3.8.

## Setup

1. Clone the repository to your local machine.

2. Navigate to the project directory:
    ```
    cd studiflow_api/StudiFlowApi
    ```

3. Create a virtual environment and activate it:
    ```
    python3 -m venv django_environment
    source django_environment/bin/activate
    ```

4. Install the required packages:
    ```
    pip3 install django
    pip3 install djangorestframework
    pip3 install dj_database_url
    pip3 install python-dotenv
    pip3 install psycopg2-binary
    pip3 install djangorestframework-simplejwt
    pip3 install requests
    pip3 install django-cors-headers
    ```

## Running the Application

1. Ensure you are in the virtual environment. If not, activate it:
    ```
    source django_environment/bin/activate
    ```

2. Run the Django server:
    ```python3 manage.py runserver
    
    ```

The application should now be running at `http://127.0.0.1:8000/`.

## License

This project is licensed under the MIT License.