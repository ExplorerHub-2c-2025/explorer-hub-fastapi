"use client"

import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, Navigation, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface OpenStreetMapLinkProps {
  fromAddress: string
  fromCity: string
  toAddress: string
  toCity: string
  activityName?: string
  mode?: "foot-walking" | "driving-car" | "cycling-regular"
}

interface RouteData {
  distance_km: number
  duration_min: number
  profile: string
}

export function OpenStreetMapLink({ 
  fromAddress, 
  fromCity, 
  toAddress, 
  toCity, 
  activityName,
  mode = "foot-walking"
}: OpenStreetMapLinkProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoute = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const fromAddressFull = `${fromAddress}, ${fromCity}, Argentina`
        const toAddressFull = `${toAddress}, ${toCity}, Argentina`

        const response = await fetch(
          `http://localhost:8000/api/directions/directions/route-summary?` +
          `from_address=${encodeURIComponent(fromAddressFull)}&` +
          `to_address=${encodeURIComponent(toAddressFull)}&` +
          `profile=${mode}`
        )

        if (!response.ok) {
          throw new Error("No se pudo calcular la ruta")
        }

        const data = await response.json()
        setRouteData(data.route)
      } catch (err) {
        console.error("Error fetching route:", err)
        setError(err instanceof Error ? err.message : "Error al cargar la ruta")
      } finally {
        setIsLoading(false)
      }
    }

    if (fromAddress && toAddress) {
      fetchRoute()
    }
  }, [fromAddress, fromCity, toAddress, toCity, mode])

  const handleOpenMaps = () => {
    const origin = `${fromAddress}, ${fromCity}`.trim()
    const destination = `${toAddress}, ${toCity}`.trim()

    // OpenStreetMap doesn't have a built-in directions URL, so we'll use a popular routing service
    // or just show the destination on OSM
    const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${mode === 'foot-walking' ? 'foot' : mode === 'driving-car' ? 'car' : 'bike'}&route=${encodeURIComponent(origin)};${encodeURIComponent(destination)}`

    window.open(osmUrl, "_blank")
  }

  const getModeLabel = (profile: string) => {
    switch (profile) {
      case "foot-walking":
        return "🚶 Caminando"
      case "driving-car":
        return "🚗 En auto"
      case "cycling-regular":
        return "🚴 En bici"
      default:
        return "🗺️"
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenMaps}
        className="gap-2 w-full justify-center bg-transparent"
        title={`Ruta a ${activityName || "destino"}`}
        disabled={isLoading}
      >
        <Navigation className="w-4 h-4" />
        <span>Ver ruta en OpenStreetMap</span>
        <ExternalLink className="w-3 h-3 ml-auto" />
      </Button>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Calculando ruta...</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 text-center">
          {error}
        </div>
      )}

      {routeData && !error && (
        <div className="bg-muted/50 rounded-md p-2 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{getModeLabel(routeData.profile)}</span>
            <span className="font-medium">{routeData.distance_km} km</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duración estimada:</span>
            <span className="font-medium">~{routeData.duration_min} min</span>
          </div>
        </div>
      )}
    </div>
  )
}
