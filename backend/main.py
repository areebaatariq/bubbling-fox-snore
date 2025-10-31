from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from api import router as api_router

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5137",
    "https://bubbling-fox-snore.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/v1/healthz")
def health_check():
    try:
        # Assume MONGO_URI is set as an environment variable
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise HTTPException(status_code=500, detail="MONGO_URI environment variable not set")

        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        return {"status": "ok"}
    except ConnectionFailure:
        raise HTTPException(status_code=503, detail="MongoDB connection failed")