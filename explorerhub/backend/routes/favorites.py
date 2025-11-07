from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List
from auth import get_current_user
from database import get_database
from models.favorite import FavoriteCreate, Favorite, FavoriteWithBusiness
from models.counter import get_next_sequence_value

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("", response_model=Favorite, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    favorite_data: FavoriteCreate,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Agregar un negocio a los favoritos del usuario.
    """
    user_id = current_user.id
    business_id = favorite_data.business_id
    
    # Verificar que el negocio existe
    business = await db.businesses.find_one({"id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado"
        )
    
    # Verificar si ya está en favoritos
    existing = await db.favorites.find_one({
        "user_id": user_id,
        "business_id": business_id
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este negocio ya está en tus favoritos"
        )
    
    # Crear el favorito
    favorite_id = await get_next_sequence_value("favorites", db)
    favorite = {
        "id": favorite_id,
        "user_id": user_id,
        "business_id": business_id,
        "created_at": datetime.now()
    }
    
    await db.favorites.insert_one(favorite)
    
    return Favorite(**favorite)


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    business_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Eliminar un negocio de los favoritos del usuario.
    """
    user_id = current_user.id
    
    result = await db.favorites.delete_one({
        "user_id": user_id,
        "business_id": business_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorito no encontrado"
        )
    
    return None


@router.get("", response_model=List[FavoriteWithBusiness])
async def get_favorites(
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener todos los favoritos del usuario con información del negocio.
    """
    user_id = current_user.id
    
    # Obtener favoritos con JOIN de negocios
    favorites = await db.favorites.aggregate([
        {
            "$match": {"user_id": user_id}
        },
        {
            "$lookup": {
                "from": "businesses",
                "localField": "business_id",
                "foreignField": "id",
                "as": "business"
            }
        },
        {
            "$unwind": "$business"
        },
        {
            "$sort": {"created_at": -1}
        }
    ]).to_list(None)
    
    # Formatear la respuesta
    result = []
    for fav in favorites:
        business = fav["business"]
        result.append(FavoriteWithBusiness(
            id=fav["id"],
            user_id=fav["user_id"],
            business_id=fav["business_id"],
            created_at=fav["created_at"],
            business_name=business.get("name", ""),
            business_category=business.get("category", ""),
            business_location=business.get("location", ""),
            business_rating=business.get("rating", 0.0),
            business_review_count=business.get("review_count", 0),
            business_price_level=business.get("price_level", 1),
            business_images=business.get("images", []),
            business_description=business.get("description"),
            business_tags=business.get("tags", [])
        ))
    
    return result


@router.get("/check/{business_id}", response_model=dict)
async def check_favorite(
    business_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Verificar si un negocio está en los favoritos del usuario.
    """
    user_id = current_user.id
    
    favorite = await db.favorites.find_one({
        "user_id": user_id,
        "business_id": business_id
    })
    
    return {"is_favorite": favorite is not None}
