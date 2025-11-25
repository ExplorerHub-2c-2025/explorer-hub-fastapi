"""
Weather API routes using OpenWeatherMap
"""
from fastapi import APIRouter, HTTPException, Query
import httpx
from config import settings

router = APIRouter()


@router.get("/weather/{city}")
async def get_weather(
    city: str,
    country_code: str = Query(default="AR", description="ISO country code")
):
    """
    Get current weather for a city using OpenWeatherMap API
    
    Args:
        city: City name (e.g., "Buenos Aires")
        country_code: ISO country code (default: AR for Argentina)
    
    Returns:
        Weather data including temperature, conditions, humidity, wind speed
    """
    api_key = settings.openweather_api_key
    
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenWeatherMap API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Get weather data
            url = f"https://api.openweathermap.org/data/2.5/weather"
            params = {
                "q": f"{city},{country_code}",
                "appid": api_key,
                "units": "metric",
                "lang": "es"
            }
            
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Format response
            weather_data = {
                "city": data["name"],
                "country": data["sys"]["country"],
                "temperature": round(data["main"]["temp"]),
                "feels_like": round(data["main"]["feels_like"]),
                "temp_min": round(data["main"]["temp_min"]),
                "temp_max": round(data["main"]["temp_max"]),
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": round(data["wind"]["speed"] * 3.6),  # Convert m/s to km/h
                "wind_deg": data["wind"].get("deg"),
                "clouds": data["clouds"]["all"],
                "condition": data["weather"][0]["main"].lower(),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "visibility": data.get("visibility", 0) / 1000,  # Convert to km
                "sunrise": data["sys"]["sunrise"],
                "sunset": data["sys"]["sunset"],
                "timezone": data["timezone"],
                "coord": {
                    "lat": data["coord"]["lat"],
                    "lon": data["coord"]["lon"]
                }
            }
            
            return weather_data
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"City '{city}' not found"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching weather data: {str(e)}"
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Weather service timeout"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@router.get("/weather/forecast/{city}")
async def get_forecast(
    city: str,
    country_code: str = Query(default="AR", description="ISO country code"),
    days: int = Query(default=5, ge=1, le=5, description="Number of days (1-5)")
):
    """
    Get weather forecast for a city
    
    Args:
        city: City name
        country_code: ISO country code
        days: Number of forecast days (1-5)
    
    Returns:
        Weather forecast data
    """
    api_key = settings.openweather_api_key
    
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenWeatherMap API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Get forecast data
            url = f"https://api.openweathermap.org/data/2.5/forecast"
            params = {
                "q": f"{city},{country_code}",
                "appid": api_key,
                "units": "metric",
                "lang": "es",
                "cnt": days * 8  # 8 forecasts per day (every 3 hours)
            }
            
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Format forecast data
            forecasts = []
            for item in data["list"]:
                forecasts.append({
                    "dt": item["dt"],
                    "temperature": round(item["main"]["temp"]),
                    "feels_like": round(item["main"]["feels_like"]),
                    "temp_min": round(item["main"]["temp_min"]),
                    "temp_max": round(item["main"]["temp_max"]),
                    "humidity": item["main"]["humidity"],
                    "wind_speed": round(item["wind"]["speed"] * 3.6),
                    "condition": item["weather"][0]["main"].lower(),
                    "description": item["weather"][0]["description"],
                    "icon": item["weather"][0]["icon"],
                    "clouds": item["clouds"]["all"],
                    "pop": round(item.get("pop", 0) * 100)  # Probability of precipitation
                })
            
            return {
                "city": data["city"]["name"],
                "country": data["city"]["country"],
                "coord": data["city"]["coord"],
                "forecasts": forecasts
            }
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"City '{city}' not found"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching forecast data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
