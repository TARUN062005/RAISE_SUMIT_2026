import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dynamically resolve absolute path to backend/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
# current_dir is backend/app/core; backend directory is two levels up
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
env_path = os.path.join(backend_dir, ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=env_path,
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    MONGO_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "hospital_clinical_trials"
    VULTR_API_KEY: str = ""
    VULTR_BASE_URL: str = "https://api.vultrinference.com/v1"
    VULTR_MODEL: str = ""

settings = Settings()
