"use client"

import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, Navigation, Loader2, Car, Bus, Footprints, Bike, Zap } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TransportMode = "foot-walking" | "driving-car" | "driving-motorcycle" | "cycling-regular" | "public-transport"

interface OpenStreetMapLinkProps {
  fromAddress: string
  fromCity: string
  toAddress: string
  toCity: string
  activityName?: string
  fromActivityName?: string
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
  fromActivityName,
  mode = "foot-walking"
}: OpenStreetMapLinkProps) {
  // Create a TRULY unique identifier for this route using all address details
  const routeId = useMemo(() => {
    const id = `${fromActivityName || 'unknown'}-${activityName || 'unknown'}-${fromAddress}-${fromCity}-${toAddress}-${toCity}`
    console.log(`[Creating routeId] ${id}`)
    return id
  }, [fromAddress, fromCity, toAddress, toCity, fromActivityName, activityName])
  
  console.log(`[Component Render] ${routeId}`, {
    fromActivityName,
    activityName,
    fromAddress,
    fromCity,
    toAddress,
    toCity
  })
  
  const [selectedMode, setSelectedMode] = useState<TransportMode>(mode)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when routeId changes (different route)
  useEffect(() => {
    console.log(`[State Reset] Resetting state for ${routeId}`)
    setRouteData(null)
    setError(null)
    setIsLoading(false)
  }, [routeId])

  useEffect(() => {
    const fetchRoute = async () => {
      // Skip if addresses are empty or invalid
      if (!fromAddress || !toAddress || !fromCity || !toCity) {
        console.log(`[${routeId}] SKIP: Missing address data`, {
          fromAddress, fromCity, toAddress, toCity
        })
        return
      }

      console.log(`[${routeId}] FETCHING for this specific component`)
      setIsLoading(true)
      setError(null)
      setRouteData(null) // Reset route data

      try {
        const fromAddressFull = `${fromAddress}, ${fromCity}, Argentina`
        const toAddressFull = `${toAddress}, ${toCity}, Argentina`
        
        // Debug log
        console.log(`[${routeId}] START Fetching route:`, {
          from: fromActivityName || fromAddressFull,
          to: activityName || toAddressFull,
          mode: selectedMode,
          fromFull: fromAddressFull,
          toFull: toAddressFull
        })

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

        console.log(`[${routeId}] Response status:`, response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[${routeId}] Error response:`, errorText)
          throw new Error(`No se pudo calcular la ruta: ${response.status}`)
        }

        const data = await response.json()
        
        console.log(`[${routeId}] SUCCESS Route fetched:`, {
          ...data.route,
          forRoute: `${fromActivityName} → ${activityName}`
        })
        
        console.log(`[${routeId}] SETTING routeData for ${fromActivityName} → ${activityName}`)
        setRouteData(data.route)
      } catch (err) {
        console.error(`[${routeId}] ERROR fetching route:`, err)
        const errorMessage = err instanceof Error ? err.message : "Error al cargar la ruta"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoute()
  }, [fromAddress, fromCity, toAddress, toCity, selectedMode, routeId, fromActivityName, activityName])

  const handleOpenMaps = (modeToUse?: TransportMode) => {
    const origin = `${fromAddress}, ${fromCity}`.trim()
    const destination = `${toAddress}, ${toCity}`.trim()
    const routeMode = modeToUse || selectedMode

    // Map to OpenStreetMap routing engines
    let osmEngine = 'fossgis_osrm_foot'
    if (routeMode === 'driving-car') {
      osmEngine = 'fossgis_osrm_car'
    } else if (routeMode === 'cycling-regular') {
      osmEngine = 'fossgis_osrm_bike'
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
      case "cycling-regular":
        return "🚴 En bici"
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
      case "cycling-regular":
        return "En bicicleta"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-2">
      <Tabs value={selectedMode} onValueChange={(value) => setSelectedMode(value as TransportMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="foot-walking" className="text-xs gap-1 px-1 py-2">
            <Footprints className="w-3 h-3" />
            <span className="hidden sm:inline">Pie</span>
          </TabsTrigger>
          <TabsTrigger value="driving-car" className="text-xs gap-1 px-1 py-2">
            <Car className="w-3 h-3" />
            <span className="hidden sm:inline">Auto</span>
          </TabsTrigger>
          <TabsTrigger value="cycling-regular" className="text-xs gap-1 px-1 py-2">
            <Bike className="w-3 h-3" />
            <span className="hidden sm:inline">Bici</span>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
