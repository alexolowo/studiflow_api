import os
from dotenv import load_dotenv
from pymongo import MongoClient
def get_db_handle():
    """returns a handle to the database of collections

    Returns:
        _type_: client to the database of collections
    """
    load_dotenv()
    client = MongoClient(os.environ.get('MONGO_CONNECTION_STRING'))
    return client[os.environ.get("MONGO_DB_NAME")]