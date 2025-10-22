"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Plus } from "lucide-react"
import Link from "next/link"

export default function TripsPage() {
  // Mock data - will be replaced with API calls
  const trips = [
    {
      id: "1",
      name: "Summer in Italy",
      destination: "Rome, Florence, Venice",
      startDate: "2025-07-15",
      endDate: "2025-07-25",
      activities: 12,
      image: "/italy-travel-rome-colosseum.jpg",
    },
    {
      id: "2",
      name: "Tokyo Adventure",
      destination: "Tokyo, Kyoto, Osaka",
      startDate: "2025-09-10",
      endDate: "2025-09-20",
      activities: 8,
      image: "/tokyo-skyline.png",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Trips</h1>
            <p className="text-muted-foreground">Plan and organize your travel adventures</p>
          </div>
          <Link href="/trips/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start planning your next adventure by creating your first trip
                </p>
                <Link href="/trips/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Trip
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video relative">
                    <img
                      src={trip.image || "/placeholder.svg"}
                      alt={trip.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{trip.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} -{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-sm font-medium">{trip.activities} activities planned</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
