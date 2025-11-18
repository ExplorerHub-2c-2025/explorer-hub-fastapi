"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertCircle } from "lucide-react"

interface WeatherData {
  temperature: number
  condition: string
  humidity?: number
  windSpeed?: number
  icon: string
}

interface WeatherCardProps {
  city: string
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  clear: <Sun className="w-12 h-12 text-yellow-400" />,
  clouds: <Cloud className="w-12 h-12 text-gray-400" />,
  rain: <CloudRain className="w-12 h-12 text-blue-400" />,
  snow: <Cloud className="w-12 h-12 text-blue-200" />,
}

export function WeatherCard({ city }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!city) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
        )
        const geoData = await geoResponse.json()

        if (!geoData.results || geoData.results.length === 0) {
          setError("City not found")
          setIsLoading(false)
          return
        }

        const { latitude, longitude } = geoData.results[0]

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius`,
        )
        const weatherData = await weatherResponse.json()

        if (weatherData.current) {
          const current = weatherData.current
          const weatherCode = current.weather_code

          // Map WMO weather codes to conditions
          let condition = "clear"
          if (weatherCode === 0) condition = "clear"
          else if ([1, 2, 3].includes(weatherCode)) condition = "clouds"
          else if ([45, 48].includes(weatherCode)) condition = "clouds"
          else if ([51, 53, 55, 61, 63, 65, 71, 73, 75, 77, 80, 81, 82].includes(weatherCode)) condition = "rain"
          else if ([85, 86].includes(weatherCode)) condition = "snow"

          setWeather({
            temperature: Math.round(current.temperature_2m),
            condition: condition,
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            icon: condition,
          })
        }
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError("Unable to fetch weather data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [city])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-24">
            <p className="text-sm text-muted-foreground">Cargando clima...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <p>No se pudo cargar el clima</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Clima en {city}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{weather.temperature}°</span>
                <span className="text-sm text-muted-foreground capitalize">{weather.condition}</span>
              </div>
            </div>
            <div className="flex justify-center">{WEATHER_ICONS[weather.icon] || WEATHER_ICONS["clear"]}</div>
          </div>

          {weather.humidity !== undefined && weather.windSpeed !== undefined && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs">
                <Droplets className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-muted-foreground">Humedad</p>
                  <p className="font-medium">{weather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Wind className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-muted-foreground">Viento</p>
                  <p className="font-medium">{weather.windSpeed} km/h</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
