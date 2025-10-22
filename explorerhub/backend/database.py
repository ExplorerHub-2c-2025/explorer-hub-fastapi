from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from config import settings

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        cls.client = AsyncIOMotorClient(settings.mongodb_url)
        print(f"Connected to MongoDB: {settings.mongodb_url}")
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("Closed MongoDB connection")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        return cls.client[settings.database_name]


async def get_database():
    """Dependency for getting database"""
    return Database.get_db()
