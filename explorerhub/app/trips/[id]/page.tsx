"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Calendar, Edit, Share2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import ItineraryBuilder from "@/components/itinerary-builder" // Import ItineraryBuilder component

export default function TripDetailPage({ params }: { params: { id: string } }) {
  // Mock data - would be fetched from API
  const [trip, setTrip] = useState({
    id: params.id,
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
        scheduled_date: new Date("2025-07-16"),
        notes: "Book tickets in advance",
      },
      {
        id: "2",
        business_id: "2",
        business_name: "Trattoria Roma",
        category: "Restaurant",
        scheduled_date: new Date("2025-07-16"),
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/trips">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
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
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
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
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Trip Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activities</span>
                    <span className="font-medium">{trip.activities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Recommendations</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on your itinerary, you might also enjoy these experiences:
                </p>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-gray-200 hover:bg-muted/50 cursor-pointer transition-colors">
                    <h4 className="font-medium text-sm mb-1">Vatican Museums</h4>
                    <p className="text-xs text-muted-foreground">Attraction • Rome</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200 hover:bg-muted/50 cursor-pointer transition-colors">
                    <h4 className="font-medium text-sm mb-1">Gondola Ride</h4>
                    <p className="text-xs text-muted-foreground">Activity • Venice</p>
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
