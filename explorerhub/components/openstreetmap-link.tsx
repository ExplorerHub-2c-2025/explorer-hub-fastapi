"use client"

import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, Navigation, Loader2, Car, Bus, Footprints, Bike, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TransportMode = "foot-walking" | "driving-car" | "driving-motorcycle" | "cycling-regular" | "public-transport"

interface OpenStreetMapLinkProps {
  fromAddress: string
  fromCity: string
  toAddress: string
  toCity: string
  activityName?: string
  mode?: TransportMode
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
  const [selectedMode, setSelectedMode] = useState<TransportMode>(mode)
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

        // Map frontend modes to backend API profiles
        let apiProfile = selectedMode
        if (selectedMode === "driving-motorcycle") {
          apiProfile = "driving-car" // Use car profile for motorcycle
        } else if (selectedMode === "public-transport") {
          apiProfile = "foot-walking" // Use walking for public transport estimate
        }

        const response = await fetch(
          `http://localhost:8000/api/directions/directions/route-summary?` +
          `from_address=${encodeURIComponent(fromAddressFull)}&` +
          `to_address=${encodeURIComponent(toAddressFull)}&` +
          `profile=${apiProfile}`
        )

        if (!response.ok) {
          throw new Error("No se pudo calcular la ruta")
        }

        const data = await response.json()
        
        // Adjust duration for public transport (typically slower than walking in total time due to waits)
        if (selectedMode === "public-transport") {
          data.route.duration_min = Math.round(data.route.duration_min * 1.5)
          data.route.profile = "public-transport"
        } else if (selectedMode === "driving-motorcycle") {
          // Motorcycle might be slightly faster in traffic
          data.route.duration_min = Math.round(data.route.duration_min * 0.85)
          data.route.profile = "driving-motorcycle"
        }
        
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
  }, [fromAddress, fromCity, toAddress, toCity, selectedMode])

  const handleOpenMaps = (modeToUse?: TransportMode) => {
    const origin = `${fromAddress}, ${fromCity}`.trim()
    const destination = `${toAddress}, ${toCity}`.trim()
    const routeMode = modeToUse || selectedMode

    // Map to OpenStreetMap routing engines
    let osmEngine = 'fossgis_osrm_foot'
    if (routeMode === 'driving-car' || routeMode === 'driving-motorcycle') {
      osmEngine = 'fossgis_osrm_car'
    } else if (routeMode === 'cycling-regular') {
      osmEngine = 'fossgis_osrm_bike'
    } else if (routeMode === 'public-transport') {
      // For public transport, we'll use a general maps view since OSM doesn't have direct PT routing
      const osmUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=transit`
      window.open(osmUrl, "_blank")
      return
    }

    const osmUrl = `https://www.openstreetmap.org/directions?engine=${osmEngine}&route=${encodeURIComponent(origin)};${encodeURIComponent(destination)}`
    window.open(osmUrl, "_blank")
  }

  const getModeLabel = (profile: string) => {
    switch (profile) {
      case "foot-walking":
        return "🚶 Caminando"
      case "driving-car":
        return "🚗 En auto"
      case "driving-motorcycle":
        return "🏍️ En moto"
      case "cycling-regular":
        return "🚴 En bici"
      case "public-transport":
        return "🚌 Transporte público"
      default:
        return "🗺️"
    }
  }

  const getModeDescription = (profile: string) => {
    switch (profile) {
      case "foot-walking":
        return "A pie"
      case "driving-car":
        return "En automóvil"
      case "driving-motorcycle":
        return "En motocicleta"
      case "cycling-regular":
        return "En bicicleta"
      case "public-transport":
        return "En colectivo, tren o subte"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-2">
      <Tabs value={selectedMode} onValueChange={(value) => setSelectedMode(value as TransportMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="foot-walking" className="text-xs gap-1 px-1 py-2">
            <Footprints className="w-3 h-3" />
            <span className="hidden sm:inline">Pie</span>
          </TabsTrigger>
          <TabsTrigger value="driving-car" className="text-xs gap-1 px-1 py-2">
            <Car className="w-3 h-3" />
            <span className="hidden sm:inline">Auto</span>
          </TabsTrigger>
          <TabsTrigger value="driving-motorcycle" className="text-xs gap-1 px-1 py-2">
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Moto</span>
          </TabsTrigger>
          <TabsTrigger value="cycling-regular" className="text-xs gap-1 px-1 py-2">
            <Bike className="w-3 h-3" />
            <span className="hidden sm:inline">Bici</span>
          </TabsTrigger>
          <TabsTrigger value="public-transport" className="text-xs gap-1 px-1 py-2">
            <Bus className="w-3 h-3" />
            <span className="hidden sm:inline">Público</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedMode} className="space-y-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenMaps()}
            className="gap-2 w-full justify-center bg-transparent"
            title={`Ruta a ${activityName || "destino"}`}
            disabled={isLoading}
          >
            <Navigation className="w-4 h-4" />
            <span>
              {selectedMode === "public-transport" 
                ? "Ver en Google Maps" 
                : "Ver ruta en OpenStreetMap"}
            </span>
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
              {selectedMode === "public-transport" && (
                <div className="text-xs text-muted-foreground italic mt-1 pt-1 border-t">
                  * Incluye tiempo de espera y transbordos
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
