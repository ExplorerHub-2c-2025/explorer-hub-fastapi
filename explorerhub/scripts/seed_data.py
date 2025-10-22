"""
Seed the database with sample data for testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
from auth import get_password_hash


async def seed_database():
    """Seed database with sample data"""
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    print("Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.businesses.delete_many({})
    await db.reviews.delete_many({})
    await db.trips.delete_many({})
    print("✓ Cleared existing data")
    
    # Create sample users
    users = [
        {
            "email": "john@example.com",
            "full_name": "John Doe",
            "hashed_password": get_password_hash("password123"),
            "is_business": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "email": "business@example.com",
            "full_name": "Business Owner",
            "hashed_password": get_password_hash("password123"),
            "is_business": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    result = await db.users.insert_many(users)
    user_ids = result.inserted_ids
    print(f"✓ Created {len(users)} users")
    
    # Create sample businesses
    businesses = [
        {
            "name": "La Bella Vista Restaurant",
            "description": "Authentic Italian cuisine with stunning city views",
            "category": "Restaurant",
            "location": {
                "address": "123 Main St",
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "latitude": 40.7128,
                "longitude": -74.0060
            },
            "phone": "+1-555-0101",
            "website": "https://labellavista.example.com",
            "price_level": 3,
            "images": ["/restaurant-dining.jpg"],
            "tags": ["Italian", "Fine Dining"],
            "owner_id": str(user_ids[1]),
            "rating": 4.8,
            "review_count": 342,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Mountain Hiking Adventure",
            "description": "Guided hiking tours through breathtaking mountain trails",
            "category": "Nature",
            "location": {
                "address": "Rocky Mountain National Park",
                "city": "Estes Park",
                "state": "CO",
                "country": "USA",
                "latitude": 40.3428,
                "longitude": -105.6836
            },
            "price_level": 2,
            "images": ["/nature-hiking.jpg"],
            "tags": ["Outdoor", "Adventure"],
            "owner_id": str(user_ids[1]),
            "rating": 4.9,
            "review_count": 156,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    result = await db.businesses.insert_many(businesses)
    business_ids = result.inserted_ids
    print(f"✓ Created {len(businesses)} businesses")
    
    # Create sample reviews
    reviews = [
        {
            "business_id": str(business_ids[0]),
            "user_id": str(user_ids[0]),
            "user_name": "John Doe",
            "rating": 5,
            "title": "Amazing experience!",
            "text": "The food was exceptional and the service was outstanding.",
            "images": [],
            "helpful_count": 12,
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=5)
        }
    ]
    
    await db.reviews.insert_many(reviews)
    print(f"✓ Created {len(reviews)} reviews")
    
    print("\n✅ Database seeded successfully!")
    print("\nTest credentials:")
    print("Regular user: john@example.com / password123")
    print("Business user: business@example.com / password123")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
