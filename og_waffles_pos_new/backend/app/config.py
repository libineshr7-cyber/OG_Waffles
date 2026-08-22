import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env file from backend directory if present
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings(BaseSettings):
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "og_waffles")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "og_waffles_dev_secret_key_please_change_in_production_32char")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    AUTO_SEED: bool = os.getenv("AUTO_SEED", "true").lower() in ("1", "true", "yes")

    model_config = SettingsConfigDict(
        env_file=str(env_path) if env_path.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
