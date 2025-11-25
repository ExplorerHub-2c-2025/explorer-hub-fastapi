"""
Geocoding service using OpenStreetMap Nominatim API
Free and no API key required
"""
import httpx
import logging
from typing import Optional, Tuple

logger = logging.getLogger("uvicorn.error")

class GeocodingService:
    """Service to geocode addresses using OpenStreetMap Nominatim"""
    
    BASE_URL = "https://nominatim.openstreetmap.org/search"
    
    @staticmethod
    async def geocode_address(
        address: str,
        city: str,
        state: Optional[str] = None,
        country: Optional[str] = None
    ) -> Tuple[Optional[float], Optional[float]]:
        """
        Geocode an address to get latitude and longitude
        
        Args:
            address: Street address
            city: City name
            state: State/province (optional)
            country: Country name (optional)
            
        Returns:
            Tuple of (latitude, longitude) or (None, None) if not found
        """
        try:
            # Build full address query
            query_parts = [address, city]
            if state:
                query_parts.append(state)
            if country:
                query_parts.append(country)
            
            full_address = ", ".join(query_parts)
            
            # Make request to Nominatim
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "q": full_address,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1
                }
                headers = {
                    "User-Agent": "ExplorerHub/1.0"  # Nominatim requires a user agent
                }
                
                response = await client.get(
                    GeocodingService.BASE_URL,
                    params=params,
                    headers=headers
                )
                response.raise_for_status()
                
                results = response.json()
                
                if results and len(results) > 0:
                    lat = float(results[0]["lat"])
                    lon = float(results[0]["lon"])
                    logger.info(f"✅ Geocoded '{full_address}' → ({lat}, {lon})")
                    return (lat, lon)
                else:
                    logger.warning(f"⚠️ No coordinates found for '{full_address}'")
                    return (None, None)
                    
        except httpx.TimeoutException:
            logger.error(f"❌ Timeout geocoding address: {full_address}")
            return (None, None)
        except httpx.HTTPError as e:
            logger.error(f"❌ HTTP error geocoding address: {e}")
            return (None, None)
        except Exception as e:
            logger.error(f"❌ Error geocoding address: {e}")
            return (None, None)
    
    @staticmethod
    async def geocode_business_location(location: dict) -> dict:
        """
        Geocode a business location dict and add latitude/longitude
        
        Args:
            location: Dictionary with address, city, state, country
            
        Returns:
            Updated location dict with latitude and longitude
        """
        if not location.get("address") or not location.get("city"):
            logger.warning("⚠️ Missing address or city, cannot geocode")
            return location
        
        # Skip if already has coordinates
        if location.get("latitude") and location.get("longitude"):
            logger.info("ℹ️ Location already has coordinates, skipping geocoding")
            return location
        
        lat, lon = await GeocodingService.geocode_address(
            address=location["address"],
            city=location["city"],
            state=location.get("state"),
            country=location.get("country")
        )
        
        if lat and lon:
            location["latitude"] = lat
            location["longitude"] = lon
        
        return location
