from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List
from auth import get_current_user
from database import get_database
from models.favorite import FavoriteCreate, FavoriteWithBusiness

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
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
    
    # Obtener el usuario actual
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar si ya está en favoritos
    favorites = user.get("favorites", [])
    if business_id in favorites:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este negocio ya está en tus favoritos"
        )
    
    # Agregar a favoritos
    favorites.append(business_id)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"favorites": favorites}}
    )
    
    return {"message": "Agregado a favoritos", "business_id": business_id}


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
    
    # Obtener el usuario actual
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar si está en favoritos
    favorites = user.get("favorites", [])
    if business_id not in favorites:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorito no encontrado"
        )
    
    # Remover de favoritos
    favorites.remove(business_id)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"favorites": favorites}}
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
    
    # Obtener el usuario con sus favoritos
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    favorites_ids = user.get("favorites", [])
    if not favorites_ids:
        return []
    
    # Obtener los negocios favoritos
    businesses = await db.businesses.find({"id": {"$in": favorites_ids}}).to_list(None)
    
    # Crear respuesta simulando la estructura anterior
    result = []
    for business in businesses:
        # Formatear la ubicación como string
        location_obj = business.get("location", {})
        if isinstance(location_obj, dict):
            location_str = f"{location_obj.get('address', '')}, {location_obj.get('city', '')}, {location_obj.get('state', '')}, {location_obj.get('country', '')}".strip(", ")
        else:
            location_str = str(location_obj)
        
        # Crear un ID simulado para el favorito (usando el business_id)
        result.append(FavoriteWithBusiness(
            id=business["id"],  # Usar business_id como id del favorito
            user_id=str(user_id),
            business_id=business["id"],
            created_at=datetime.now(),  # No tenemos fecha de creación, usar ahora
            business_name=business.get("name", ""),
            business_categories=business.get("categories", []),
            business_location=location_str,
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
    
    # Obtener el usuario
    user = await db.users.find_one({"id": user_id})
    if not user:
        return {"is_favorite": False}
    
    favorites = user.get("favorites", [])
    return {"is_favorite": business_id in favorites}


@router.get("/count/{business_id}", response_model=dict)
async def get_favorite_count(
    business_id: int,
    db = Depends(get_database)
):
    """
    Obtener el número total de usuarios que han agregado este negocio a favoritos.
    """
    # Contar usuarios que tienen este business_id en su lista de favoritos
    count = await db.users.count_documents({"favorites": business_id})
    
    return {"count": count}


# Trip favorites endpoints

@router.post("/trips/{trip_id}", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_trip_favorite(
    trip_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Agregar un viaje a los favoritos del usuario.
    """
    user_id = current_user.id
    
    # Verificar que el viaje existe
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viaje no encontrado"
        )
    
    # Obtener el usuario actual
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar si ya está en favoritos
    favorite_trips = user.get("favorite_trips", [])
    if trip_id in favorite_trips:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este viaje ya está en tus favoritos"
        )
    
    # Agregar a favoritos
    favorite_trips.append(trip_id)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"favorite_trips": favorite_trips}}
    )
    
    return {"message": "Viaje agregado a favoritos", "trip_id": trip_id}


@router.delete("/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_trip_favorite(
    trip_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Eliminar un viaje de los favoritos del usuario.
    """
    user_id = current_user.id
    
    # Obtener el usuario actual
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar si está en favoritos
    favorite_trips = user.get("favorite_trips", [])
    if trip_id not in favorite_trips:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorito no encontrado"
        )
    
    # Remover de favoritos
    favorite_trips.remove(trip_id)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"favorite_trips": favorite_trips}}
    )
    
    return None


@router.get("/trips", response_model=List[dict])
async def get_favorite_trips(
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Obtener todos los viajes favoritos del usuario.
    """
    user_id = current_user.id
    print(f"DEBUG: Getting favorite trips for user {user_id}")
    
    # Obtener el usuario con sus viajes favoritos
    user = await db.users.find_one({"id": user_id})
    if not user:
        print(f"DEBUG: User {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    favorite_trip_ids = user.get("favorite_trips", [])
    print(f"DEBUG: User {user_id} has favorite_trip_ids: {favorite_trip_ids}")
    
    if not favorite_trip_ids:
        print(f"DEBUG: No favorite trips for user {user_id}")
        return []
    
    # Obtener los viajes favoritos
    trips = await db.trips.find({"id": {"$in": favorite_trip_ids}}).to_list(None)
    print(f"DEBUG: Found {len(trips)} trips in database")
    
    # Formatear respuesta
    result = []
    for trip in trips:
        from utils import serialize_doc
        trip_data = serialize_doc(trip)
        
        # Obtener información del usuario creador
        trip_user = await db.users.find_one({"id": int(trip_data["user_id"])})
        if trip_user:
            trip_data["user_name"] = trip_user.get("full_name", "Usuario")
            trip_data["user_profile_picture"] = trip_user.get("profile_picture")
        else:
            trip_data["user_name"] = "Usuario"
            trip_data["user_profile_picture"] = None
        
        # Obtener likes count
        likes_count = await db.trip_likes.count_documents({"trip_id": trip_data["id"]})
        trip_data["likes_count"] = likes_count
        
        result.append(trip_data)
    
    print(f"DEBUG: Returning {len(result)} favorite trips for user {user_id}")
    return result


@router.get("/trips/check/{trip_id}", response_model=dict)
async def check_trip_favorite(
    trip_id: int,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Verificar si un viaje está en los favoritos del usuario.
    """
    user_id = current_user.id
    
    # Obtener el usuario
    user = await db.users.find_one({"id": user_id})
    if not user:
        return {"is_favorite": False}
    
    favorite_trips = user.get("favorite_trips", [])
    return {"is_favorite": trip_id in favorite_trips}
