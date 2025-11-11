"use client"

import { use, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Calendar, Edit, Share2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import ItineraryBuilder from "@/components/itinerary-builder"
import { WeatherCard } from "@/components/weather-card"
import { NearbyEventsCard } from "@/components/nearby-events-card"
import { TransportRecommendations } from "@/components/transport-recommendations"

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  // Mock data - would be fetched from API
  const [trip, setTrip] = useState({
    id: resolvedParams.id,
    name: "Summer in Italy",
    destination: "Rome, Florence, Venice",
    startDate: new Date("2025-07-15"),
    endDate: new Date("2025-07-25"),
    description: "Exploring the best of Italian culture, cuisine, and history",
    activities: [
      {
        id: "1",
        business_id: "1",
        business_name: "Colosseum Tour",
        category: "Attraction",
        categories: ["Attraction"],
        scheduled_date: new Date("2025-07-16"),
        notes: "Book tickets in advance",
        location: {
          address: "Piazza del Colosseo, 1",
          city: "Rome",
          state: "Lazio",
          country: "Italy",
        },
      },
      {
        id: "2",
        business_id: "2",
        business_name: "Trattoria Roma",
        category: "Restaurant",
        categories: ["Restaurant"],
        scheduled_date: new Date("2025-07-16"),
        location: {
          address: "Via Cavour, 5",
          city: "Rome",
          state: "Lazio",
          country: "Italy",
        },
      },
    ],
  })

  const handleAddActivity = () => {
    console.log("Add activity")
    // Would open a modal or navigate to activity selection
  }

  const handleRemoveActivity = (businessId: string) => {
    setTrip({
      ...trip,
      activities: trip.activities.filter((a) => a.business_id !== businessId),
    })
  }

  const handleUpdateSchedule = (businessId: string, date: Date) => {
    setTrip({
      ...trip,
      activities: trip.activities.map((a) => (a.business_id === businessId ? { ...a, scheduled_date: date } : a)),
    })
  }

  const nearestCity = trip.activities.length > 0 ? trip.activities[0].location?.city || "" : ""

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/trips">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Viajes
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
                  <div className="flex flex-col gap-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(trip.startDate, "MMM d")} - {format(trip.endDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>

              {trip.description && <p className="text-muted-foreground">{trip.description}</p>}
            </div>

            <ItineraryBuilder
              activities={trip.activities}
              onAddActivity={handleAddActivity}
              onRemoveActivity={handleRemoveActivity}
              onUpdateSchedule={handleUpdateSchedule}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {nearestCity && <WeatherCard city={nearestCity} />}

            {nearestCity && <NearbyEventsCard city={nearestCity} />}

            {trip.activities.length >= 2 && (
              <TransportRecommendations
                fromCity={trip.activities[0].location?.city || ""}
                toCity={trip.activities[1].location?.city || ""}
              />
            )}

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Resumen del Viaje</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-medium">
                      {Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))} días
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actividades</span>
                    <span className="font-medium">{trip.activities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destino</span>
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Recomendaciones</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Basado en tu itinerario, también podrían gustarte estas experiencias:
                </p>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-gray-200 hover:bg-muted/50 cursor-pointer transition-colors">
                    <h4 className="font-medium text-sm mb-1">Museos Vaticanos</h4>
                    <p className="text-xs text-muted-foreground">Atracción • Rome</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200 hover:bg-muted/50 cursor-pointer transition-colors">
                    <h4 className="font-medium text-sm mb-1">Paseo en Góndola</h4>
                    <p className="text-xs text-muted-foreground">Actividad • Venice</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
