from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CareLoop API"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/postgres"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
