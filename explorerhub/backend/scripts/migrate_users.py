"""
Migration script to add username and profile_picture fields to existing users
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "explorerhub")


async def migrate_users():
    """Add username and profile_picture fields to all existing users"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔄 Starting user migration...")
    
    # Get all users
    users = await db.users.find({}).to_list(length=None)
    print(f"📊 Found {len(users)} users to migrate")
    
    updated_count = 0
    
    for user in users:
        # Check if user already has username
        if "username" not in user or not user.get("username"):
            # Generate username from email or full_name
            email = user.get("email", "")
            full_name = user.get("full_name", "")
            user_id = user.get("id", 0)
            
            # Try to create username from email (before @)
            if email:
                base_username = email.split("@")[0]
            elif full_name:
                base_username = full_name.lower().replace(" ", "_")
            else:
                base_username = f"user_{user_id}"
            
            # Ensure username is unique
            username = base_username
            counter = 1
            while await db.users.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1
            
            # Update user with new fields
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "username": username,
                        "profile_picture": None
                    }
                }
            )
            
            print(f"✅ Updated user {user.get('email')} with username: {username}")
            updated_count += 1
        else:
            # Just ensure profile_picture field exists
            if "profile_picture" not in user:
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"profile_picture": None}}
                )
                print(f"✅ Added profile_picture field to user {user.get('email')}")
                updated_count += 1
    
    print(f"\n🎉 Migration completed! Updated {updated_count} users")
    
    # Update reviews to include username and profile_picture
    print("\n🔄 Updating existing reviews...")
    reviews = await db.reviews.find({}).to_list(length=None)
    print(f"📊 Found {len(reviews)} reviews to update")
    
    review_updated_count = 0
    
    for review in reviews:
        user_id = review.get("user_id")
        if user_id:
            # Get user info
            user = await db.users.find_one({"id": int(user_id)})
            if user:
                update_data = {}
                if "username" not in review:
                    update_data["username"] = user.get("username")
                if "profile_picture" not in review:
                    update_data["profile_picture"] = user.get("profile_picture")
                
                if update_data:
                    await db.reviews.update_one(
                        {"_id": review["_id"]},
                        {"$set": update_data}
                    )
                    review_updated_count += 1
        
        # Update replies
        replies = review.get("replies", [])
        if replies:
            updated_replies = []
            for reply in replies:
                user_id = reply.get("user_id")
                if user_id:
                    user = await db.users.find_one({"id": int(user_id)})
                    if user:
                        if "username" not in reply:
                            reply["username"] = user.get("username")
                        if "profile_picture" not in reply:
                            reply["profile_picture"] = user.get("profile_picture")
                updated_replies.append(reply)
            
            if updated_replies != replies:
                await db.reviews.update_one(
                    {"_id": review["_id"]},
                    {"$set": {"replies": updated_replies}}
                )
    
    print(f"🎉 Reviews migration completed! Updated {review_updated_count} reviews")
    
    client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 ExplorerHub - User Migration Script")
    print("=" * 60)
    asyncio.run(migrate_users())
    print("\n✨ All done!")
