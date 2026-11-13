import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from pymongo import AsyncMongoClient

# Ensure repository root .env is loaded
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=backend_dir.parents[1] / ".env")


@asynccontextmanager
async def mongo_lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for MongoDB connection.
    Gracefully connects if configured, with non-blocking error handling.
    """
    mongo_url = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI")
    database_name = os.getenv("MONGODB_DATABASE", "ipca_db")

    client = None
    if mongo_url:
        try:
            client = AsyncMongoClient(mongo_url, serverSelectionTimeoutMS=2000)
            await client.admin.command("ping")
            app.state.mongo_client = client
            app.state.database = client[database_name]
            print("[MongoDB] Connected successfully")
        except Exception as e:
            print(f"[MongoDB] Warning: Could not connect to MongoDB ({e}). Running without database persistence.")
            app.state.mongo_client = None
            app.state.database = None
    else:
        app.state.mongo_client = None
        app.state.database = None

    try:
        yield
    finally:
        if client:
            await client.close()
            print("[MongoDB] Connection closed")
