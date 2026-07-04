from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]

async def get_db():
    return db
