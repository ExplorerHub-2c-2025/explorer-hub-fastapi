"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface TransportOption {
  id: string
  type: string
  icon: string
  estimatedTime: string
  description: string
  distance?: string
  profile: string
}

interface TransportRecommendationsProps {
  fromCity: string
  toCity: string
  fromAddress?: string
  toAddress?: string
}

export function TransportRecommendations({ 
  fromCity, 
  toCity,
  fromAddress = "",
  toAddress = ""
}: TransportRecommendationsProps) {
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!fromAddress || !toAddress) {
        // Use default static data if addresses not provided
        setTransportOptions([
          {
            id: "1",
            type: "Transporte público",
            icon: "🚌",
            estimatedTime: "20-30 minutos",
            description: "Autobús o metro disponible",
            profile: "transit"
          },
          {
            id: "2",
            type: "Taxi/Ride-sharing",
            icon: "🚕",
            estimatedTime: "10-15 minutos",
            description: "Uber o taxi local",
            profile: "driving-car"
          },
          {
            id: "3",
            type: "A pie",
            icon: "🚶",
            estimatedTime: "15-45 minutos",
            description: "Caminar por la ciudad",
            profile: "foot-walking"
          },
        ])
        return
      }

      setIsLoading(true)

      try {
        const fromAddressFull = `${fromAddress}, ${fromCity}, Argentina`
        const toAddressFull = `${toAddress}, ${toCity}, Argentina`

        // Fetch routes for different transport modes
        const modes: Array<{ profile: "foot-walking" | "driving-car" | "cycling-regular", label: string, icon: string, desc: string }> = [
          { profile: "foot-walking", label: "A pie", icon: "🚶", desc: "Caminar por la ciudad" },
          { profile: "driving-car", label: "En auto", icon: "🚗", desc: "Auto particular o taxi" },
          { profile: "cycling-regular", label: "En bicicleta", icon: "🚴", desc: "Bicicleta o bici pública" },
        ]

        const routePromises = modes.map(async (mode) => {
          try {
            const response = await fetch(
              `https://localhost:8000/api/directions/directions/route-summary?` +
              `from_address=${encodeURIComponent(fromAddressFull)}&` +
              `to_address=${encodeURIComponent(toAddressFull)}&` +
              `profile=${mode.profile}`
            )

            if (!response.ok) {
              return null
            }

            const data = await response.json()
            return {
              id: mode.profile,
              type: mode.label,
              icon: mode.icon,
              estimatedTime: `${data.route.duration_min} minutos`,
              description: mode.desc,
              distance: `${data.route.distance_km} km`,
              profile: mode.profile
            }
          } catch (err) {
            console.error(`Error fetching ${mode.profile} route:`, err)
            return null
          }
        })

        const results = await Promise.all(routePromises)
        const validOptions = results.filter((opt) => opt !== null) as TransportOption[]

        if (validOptions.length > 0) {
          setTransportOptions(validOptions)
        } else {
          // Fallback to static data
          setTransportOptions([
            {
              id: "1",
              type: "Transporte público",
              icon: "🚌",
              estimatedTime: "20-30 minutos",
              description: "Autobús o metro disponible",
              profile: "transit"
            },
            {
              id: "2",
              type: "Taxi/Ride-sharing",
              icon: "🚕",
              estimatedTime: "10-15 minutos",
              description: "Uber o taxi local",
              profile: "driving-car"
            },
            {
              id: "3",
              type: "A pie",
              icon: "🚶",
              estimatedTime: "15-45 minutos",
              description: "Caminar por la ciudad",
              profile: "foot-walking"
            },
          ])
        }
      } catch (err) {
        console.error("Error fetching transport options:", err)
        // Use default static data on error
        setTransportOptions([
          {
            id: "1",
            type: "Transporte público",
            icon: "🚌",
            estimatedTime: "20-30 minutos",
            description: "Autobús o metro disponible",
            profile: "transit"
          },
          {
            id: "2",
            type: "Taxi/Ride-sharing",
            icon: "🚕",
            estimatedTime: "10-15 minutos",
            description: "Uber o taxi local",
            profile: "driving-car"
          },
          {
            id: "3",
            type: "A pie",
            icon: "🚶",
            estimatedTime: "15-45 minutos",
            description: "Caminar por la ciudad",
            profile: "foot-walking"
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoutes()
  }, [fromCity, toCity, fromAddress, toAddress])

  if (!fromCity || !toCity) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Opciones de transporte
          </h3>

          <p className="text-xs text-muted-foreground">
            De {fromCity} a {toCity}
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Calculando rutas...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {transportOptions.map((option) => (
                <div key={option.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{option.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{option.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {option.estimatedTime}
                        </Badge>
                        {option.distance && (
                          <Badge variant="secondary" className="text-xs">
                            {option.distance}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
