
from pathlib import Path
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DEBUG: bool = Field(default=False)
    DATABASE_URL: str
    SECRET_KEY: str
    FRONTEND_URLS : str
    OPENAI_API_KEY : str
    class Config:
        env_file = str(Path(__file__).parent.parent / ".env")

settings = Settings()


print(settings.FRONTEND_URLS)