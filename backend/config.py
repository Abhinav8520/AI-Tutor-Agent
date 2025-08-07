import os
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    debug: bool = True
    
    # Data directories
    data_dir: str = "./data"
    upload_dir: str = "./uploads"
    
    # OpenAI Configuration
    openai_api_key: str = ""
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create settings instance
settings = Settings()

# Ensure data directories exist
os.makedirs(settings.data_dir, exist_ok=True)
os.makedirs(settings.upload_dir, exist_ok=True) 