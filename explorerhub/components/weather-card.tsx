"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertCircle, Sunrise, Sunset, Eye } from "lucide-react"

interface WeatherData {
  city: string
  country: string
  temperature: number
  feels_like: number
  temp_min: number
  temp_max: number
  humidity: number
  pressure: number
  wind_speed: number
  wind_deg?: number
  clouds: number
  condition: string
  description: string
  icon: string
  visibility: number
  sunrise: number
  sunset: number
  coord: {
    lat: number
    lon: number
  }
}

interface WeatherCardProps {
  city: string
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  clear: <Sun className="w-12 h-12 text-yellow-400" />,
  clouds: <Cloud className="w-12 h-12 text-gray-400" />,
  rain: <CloudRain className="w-12 h-12 text-blue-400" />,
  drizzle: <CloudRain className="w-12 h-12 text-blue-300" />,
  thunderstorm: <CloudRain className="w-12 h-12 text-purple-500" />,
  snow: <Cloud className="w-12 h-12 text-blue-200" />,
  mist: <Cloud className="w-12 h-12 text-gray-300" />,
  fog: <Cloud className="w-12 h-12 text-gray-300" />,
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
        setError(null)
        
        // Call our backend API that uses OpenWeatherMap
        const response = await fetch(
          `https://localhost:8000/api/weather/weather/${encodeURIComponent(city)}?country_code=AR`,
        )

        if (!response.ok) {
          throw new Error("Ciudad no encontrada")
        }

        const data = await response.json()
        setWeather(data)
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError(err instanceof Error ? err.message : "Error al cargar el clima")
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
            <p>{error || "No se pudo cargar el clima"}</p>
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
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                Clima en {weather.city}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{weather.temperature}°</span>
                <span className="text-sm text-muted-foreground capitalize">{weather.description}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sensación térmica: {weather.feels_like}°
              </p>
            </div>
            <div className="flex justify-center">
              {WEATHER_ICONS[weather.condition] || WEATHER_ICONS["clear"]}
            </div>
          </div>

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
                <p className="font-medium">{weather.wind_speed} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Eye className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-muted-foreground">Visibilidad</p>
                <p className="font-medium">{weather.visibility.toFixed(1)} km</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Cloud className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-muted-foreground">Nubes</p>
                <p className="font-medium">{weather.clouds}%</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sunrise className="w-3 h-3" />
              <span>{new Date(weather.sunrise * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Sunset className="w-3 h-3" />
              <span>{new Date(weather.sunset * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
