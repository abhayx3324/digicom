import os
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Digital Complaint Management System"
    VERSION: str = "1.0.0"

    MONGO_URI: str = os.getenv("MONGO_URI")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    GOOGLE_APP_PASSWORD = os.getenv("GOOGLE_APP_PASSWORD")

    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER")

    ALLOWED_EXTENSIONS: Dict[str, Any] = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
    MAX_FILE_SIZE: int = 5 * 1024 * 1024

settings = Settings()
