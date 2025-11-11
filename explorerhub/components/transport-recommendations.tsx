"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "lucide-react"

interface TransportOption {
  id: string
  type: string
  icon: string
  estimatedTime: string
  description: string
}

interface TransportRecommendationsProps {
  fromCity: string
  toCity: string
}

export function TransportRecommendations({ fromCity, toCity }: TransportRecommendationsProps) {
  const transportOptions: TransportOption[] = [
    {
      id: "1",
      type: "Transporte público",
      icon: "🚌",
      estimatedTime: "20-30 minutos",
      description: "Autobús o metro disponible",
    },
    {
      id: "2",
      type: "Taxi/Ride-sharing",
      icon: "🚕",
      estimatedTime: "10-15 minutos",
      description: "Uber o taxi local",
    },
    {
      id: "3",
      type: "A pie",
      icon: "🚶",
      estimatedTime: "15-45 minutos",
      description: "Caminar por la ciudad",
    },
  ]

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

          <div className="space-y-2">
            {transportOptions.map((option) => (
              <div key={option.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{option.type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {option.estimatedTime}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
