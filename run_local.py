#!/usr/bin/env python3
import os
import uvicorn
from app.database import Base, engine

# Set local environment variables
os.environ["DATABASE_URL"] = "sqlite:///./local_clothing.db"
os.environ["SECRET_KEY"] = "your-secret-key-here"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

# Create tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# Start the server
if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 