"""
Counter model for sequential IDs
"""
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId


class Counter(BaseModel):
    """Counter for sequential IDs"""
    collection_name: str
    sequence_value: int = 0
    
    class Config:
        json_encoders = {ObjectId: str}


async def get_next_sequence_value(collection_name: str, db) -> int:
    """
    Get the next sequence value for a collection.
    Implements an atomic counter using MongoDB's findOneAndUpdate.
    """
    counter = await db.counters.find_one_and_update(
        {"collection_name": collection_name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True  # Return the updated document
    )
    
    # If this is the first time, the counter might be None or have sequence_value 0
    if counter is None or counter.get("sequence_value") == 0:
        # Initialize counter
        await db.counters.update_one(
            {"collection_name": collection_name},
            {"$set": {"sequence_value": 1}},
            upsert=True
        )
        return 1
    
    return counter["sequence_value"]
