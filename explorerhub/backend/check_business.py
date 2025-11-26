"""
Script to check business data in database
"""
import asyncio
from database import Database

async def check_business():
    """Check business data structure"""
    await Database.connect_db()
    db = Database.get_db()
    
    # Get Kansas business
    kansas = await db.businesses.find_one({"name": "Kansas"})
    
    print("Kansas business data:")
    print(kansas)
    
    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(check_business())
