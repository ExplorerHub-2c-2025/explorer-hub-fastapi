#!/bin/bash

echo "🔍 Diagnostic Check - Weather & Transport Features"
echo "=================================================="
echo ""

# Check if backend is running
echo "1. Backend Server Status:"
if curl -s https://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
else
    echo "   ❌ Backend is NOT running"
    echo "   Start it with: cd backend && source venv/bin/activate && python -m uvicorn main:app --reload"
    exit 1
fi

# Check if weather endpoint works
echo ""
echo "2. Weather API Test:"
WEATHER_RESPONSE=$(curl -s "https://localhost:8000/api/weather/weather/Buenos%20Aires?country_code=AR")
if echo "$WEATHER_RESPONSE" | grep -q "temperature"; then
    TEMP=$(echo "$WEATHER_RESPONSE" | grep -o '"temperature":[0-9]*' | grep -o '[0-9]*')
    CITY=$(echo "$WEATHER_RESPONSE" | grep -o '"city":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Weather API working! $CITY: ${TEMP}°C"
else
    echo "   ❌ Weather API failed"
    echo "   Response: $WEATHER_RESPONSE"
fi

# Check if directions endpoint works  
echo ""
echo "3. Directions API Test:"
DIR_RESPONSE=$(curl -s "https://localhost:8000/api/directions/directions?start_lat=-34.603722&start_lon=-58.381592&end_lat=-34.615852&end_lon=-58.368402&profile=foot-walking")
if echo "$DIR_RESPONSE" | grep -q "distance"; then
    echo "   ✅ Directions API working!"
else
    echo "   ❌ Directions API failed"
    echo "   Response: $DIR_RESPONSE"
fi

# Check frontend
echo ""
echo "4. Frontend Server Status:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 3000"
else
    echo "   ❌ Frontend is NOT running"
    echo "   Start it with: cd explorerhub && npm run dev"
    exit 1
fi

# Check if components exist
echo ""
echo "5. Component Files Check:"
COMPONENTS=(
    "components/weather-card.tsx"
    "components/openstreetmap-link.tsx"
    "components/transport-recommendations.tsx"
)

for comp in "${COMPONENTS[@]}"; do
    if [ -f "../$comp" ]; then
        echo "   ✅ $comp exists"
    else
        echo "   ❌ $comp missing"
    fi
done

echo ""
echo "6. Browser Console Check:"
echo "   Open your browser's Developer Tools (F12)"
echo "   Go to the Console tab"
echo "   Look for any red error messages"
echo ""
echo "7. Network Tab Check:"
echo "   In Developer Tools, go to Network tab"
echo "   Refresh the trip page"
echo "   Look for failed requests (red)"
echo "   Check if /api/weather/ and /api/directions/ calls are being made"
echo ""
echo "=================================================="
echo "✅ If all checks pass, the features should work!"
echo ""
echo "🎯 To see the features:"
echo "   1. Go to: http://localhost:3000/trips"
echo "   2. Click on any trip"
echo "   3. Look for Weather Card in the right sidebar"
echo "   4. Add at least 2 activities to see transport recommendations"
echo ""
