"""
Directions API routes using OpenRouteService
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Literal
import httpx
from config import settings

router = APIRouter()


@router.get("/directions")
async def get_directions(
    start_lat: float = Query(..., description="Starting latitude"),
    start_lon: float = Query(..., description="Starting longitude"),
    end_lat: float = Query(..., description="Ending latitude"),
    end_lon: float = Query(..., description="Ending longitude"),
    profile: Literal["driving-car", "foot-walking", "cycling-regular"] = Query(
        default="foot-walking",
        description="Transportation mode"
    )
):
    """
    Get directions between two points using OpenRouteService
    
    Args:
        start_lat: Starting point latitude
        start_lon: Starting point longitude
        end_lat: Ending point latitude
        end_lon: Ending point longitude
        profile: Transportation mode (driving-car, foot-walking, cycling-regular)
    
    Returns:
        Route information including distance, duration, and geometry
    """
    api_key = settings.openroute_api_key
    
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenRouteService API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.openrouteservice.org/v2/directions/{profile}"
            
            headers = {
                "Authorization": api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "coordinates": [[start_lon, start_lat], [end_lon, end_lat]],
                "instructions": True,
                "language": "es",
                "units": "m"
            }
            
            response = await client.post(
                url,
                json=payload,
                headers=headers,
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            if "routes" not in data or len(data["routes"]) == 0:
                raise HTTPException(
                    status_code=404,
                    detail="No route found"
                )
            
            route = data["routes"][0]
            summary = route["summary"]
            
            # Format response
            directions_data = {
                "distance": round(summary["distance"]),  # meters
                "duration": round(summary["duration"]),  # seconds
                "distance_km": round(summary["distance"] / 1000, 2),
                "duration_min": round(summary["duration"] / 60),
                "geometry": route["geometry"],
                "steps": [
                    {
                        "instruction": step["instruction"],
                        "distance": round(step["distance"]),
                        "duration": round(step["duration"]),
                        "type": step["type"],
                        "name": step.get("name", "")
                    }
                    for step in route["segments"][0]["steps"]
                ] if "segments" in route else [],
                "bbox": route.get("bbox"),
                "profile": profile
            }
            
            return directions_data
            
    except httpx.HTTPStatusError as e:
        error_detail = "Error fetching directions"
        try:
            error_data = e.response.json()
            if "error" in error_data:
                error_detail = error_data["error"].get("message", error_detail)
        except:
            pass
            
        raise HTTPException(
            status_code=e.response.status_code,
            detail=error_detail
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Directions service timeout"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@router.post("/directions/geocode")
async def geocode_address(
    address: str = Query(..., description="Address to geocode")
):
    """
    Convert an address to coordinates using OpenRouteService geocoding
    
    Args:
        address: Address string
    
    Returns:
        Coordinates and formatted address
    """
    api_key = settings.openroute_api_key
    
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenRouteService API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            url = "https://api.openrouteservice.org/geocode/search"
            
            params = {
                "api_key": api_key,
                "text": address,
                "size": 5
            }
            
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            if "features" not in data or len(data["features"]) == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Address not found"
                )
            
            results = []
            for feature in data["features"]:
                coords = feature["geometry"]["coordinates"]
                props = feature["properties"]
                
                results.append({
                    "lat": coords[1],
                    "lon": coords[0],
                    "label": props.get("label", ""),
                    "name": props.get("name", ""),
                    "locality": props.get("locality", ""),
                    "country": props.get("country", ""),
                    "confidence": props.get("confidence", 0)
                })
            
            return {"results": results}
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail="Error geocoding address"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@router.get("/directions/route-summary")
async def get_route_summary(
    from_address: str = Query(..., description="Starting address"),
    to_address: str = Query(..., description="Destination address"),
    profile: Literal["driving-car", "foot-walking", "cycling-regular"] = Query(
        default="foot-walking",
        description="Transportation mode"
    )
):
    """
    Get route summary between two addresses (geocodes addresses first)
    
    Args:
        from_address: Starting address
        to_address: Destination address
        profile: Transportation mode
    
    Returns:
        Route summary with distance and duration
    """
    api_key = settings.openroute_api_key
    
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenRouteService API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Geocode start address
            start_geocode = await geocode_address(from_address)
            if not start_geocode["results"]:
                raise HTTPException(404, "Start address not found")
            start = start_geocode["results"][0]
            
            # Geocode end address
            end_geocode = await geocode_address(to_address)
            if not end_geocode["results"]:
                raise HTTPException(404, "End address not found")
            end = end_geocode["results"][0]
            
            # Get directions
            directions = await get_directions(
                start_lat=start["lat"],
                start_lon=start["lon"],
                end_lat=end["lat"],
                end_lon=end["lon"],
                profile=profile
            )
            
            return {
                "from": {
                    "address": from_address,
                    "label": start["label"],
                    "lat": start["lat"],
                    "lon": start["lon"]
                },
                "to": {
                    "address": to_address,
                    "label": end["label"],
                    "lat": end["lat"],
                    "lon": end["lon"]
                },
                "route": directions
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
