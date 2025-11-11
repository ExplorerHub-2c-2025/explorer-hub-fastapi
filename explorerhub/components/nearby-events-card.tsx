"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, AlertCircle } from "lucide-react"

interface Event {
  id: string
  title: string
  time: string
  type: string
  location?: string
}

interface NearbyEventsCardProps {
  city: string
}

export function NearbyEventsCard({ city }: NearbyEventsCardProps) {
  const mockEvents: Event[] = [
    {
      id: "1",
      title: "Mercado local de artesanías",
      time: "14:00 - 18:00",
      type: "Mercado",
      location: city,
    },
    {
      id: "2",
      title: "Visita guiada por la ciudad",
      time: "10:00 - 12:00",
      type: "Tour",
      location: city,
    },
    {
      id: "3",
      title: "Cena en terraza local",
      time: "19:30 - 22:00",
      type: "Gastronomía",
      location: city,
    },
  ]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Eventos cercanos hoy
          </h3>

          {mockEvents.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <AlertCircle className="w-4 h-4" />
              <p>No hay eventos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{event.time}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {event.type}
                    </Badge>
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
