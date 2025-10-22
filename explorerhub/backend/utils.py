"""
Utility functions for the backend
"""
from typing import Dict, List, Any


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert MongoDB document to JSON-serializable format
    Removes _id field and uses sequential 'id' field
    """
    if doc is None:
        return None
    
    # Create a copy to avoid modifying original
    result = dict(doc)
    
    # Remove _id if present (we use sequential 'id' instead)
    if "_id" in result:
        del result["_id"]
    
    # Recursively process nested documents
    for key, value in list(result.items()):
        if isinstance(value, list):
            result[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
    
    return result


def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert list of MongoDB documents to JSON-serializable format
    """
    return [serialize_doc(doc) for doc in docs]


def ensure_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure document has an 'id' field
    """
    if doc and "_id" in doc:
        del doc["_id"]
    return doc
