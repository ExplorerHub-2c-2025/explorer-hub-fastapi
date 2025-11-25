#!/bin/bash

# ExplorerHub - Weather and Transport Integration Setup Script
# This script helps you set up the real-time weather and transport features

echo "🌟 ExplorerHub - Weather & Transport Setup"
echo "=========================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd explorerhub/backend && ./setup_weather_transport.sh"
    exit 1
fi

# Step 1: Check Python version
echo "1️⃣  Checking Python version..."
python3 --version
if [ $? -ne 0 ]; then
    echo "❌ Python 3 is required but not found"
    exit 1
fi
echo "✅ Python 3 found"
echo ""

# Step 2: Install httpx
echo "2️⃣  Installing httpx for API requests..."
if python3 -m pip install --user httpx==0.27.0; then
    echo "✅ httpx installed successfully"
else
    echo "⚠️  Could not install httpx. You may need to:"
    echo "   - Create a virtual environment"
    echo "   - Or use: pip install --user httpx==0.27.0"
fi
echo ""

# Step 3: Check for .env file
echo "3️⃣  Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  IMPORTANT: You need to add your API keys to .env"
else
    echo "✅ .env file exists"
fi
echo ""

# Step 4: Check for API keys
echo "4️⃣  Checking API keys configuration..."
if grep -q "your_openweathermap_api_key_here" .env 2>/dev/null; then
    echo "⚠️  OpenWeatherMap API key not configured"
    echo "   Get your free key at: https://openweathermap.org/api"
else
    echo "✅ OpenWeatherMap API key appears to be configured"
fi

if grep -q "your_openrouteservice_api_key_here" .env 2>/dev/null; then
    echo "⚠️  OpenRouteService API key not configured"
    echo "   Get your free key at: https://openrouteservice.org/"
else
    echo "✅ OpenRouteService API key appears to be configured"
fi
echo ""

# Step 5: Summary
echo "📋 Setup Summary"
echo "================"
echo ""
echo "New API Endpoints:"
echo "  - GET  /api/weather/weather/{city}"
echo "  - GET  /api/weather/forecast/{city}"
echo "  - GET  /api/directions/directions"
echo "  - GET  /api/directions/directions/route-summary"
echo "  - POST /api/directions/directions/geocode"
echo ""
echo "Frontend Components Updated:"
echo "  - WeatherCard (now uses OpenWeatherMap)"
echo "  - OpenStreetMapLink (replaces GoogleMapsLink)"
echo "  - TransportRecommendations (real-time routes)"
echo "  - ItineraryBuilder (uses OpenStreetMap)"
echo ""
echo "Next Steps:"
echo "1. If you haven't already, get your free API keys:"
echo "   - OpenWeatherMap: https://openweathermap.org/api"
echo "   - OpenRouteService: https://openrouteservice.org/"
echo ""
echo "2. Add the API keys to your .env file:"
echo "   OPENWEATHER_API_KEY=your_key_here"
echo "   OPENROUTE_API_KEY=your_key_here"
echo ""
echo "3. Restart your backend server:"
echo "   python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "4. Test the new features:"
echo "   - Weather should appear in trip detail pages"
echo "   - Directions should show real distances/times"
echo ""
echo "📚 For more information, see README_WEATHER_TRANSPORT.md"
echo ""
echo "✨ Setup complete! Happy coding!"
