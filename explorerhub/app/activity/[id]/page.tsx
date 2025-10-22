"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Phone, Globe, DollarSign, Calendar, Heart } from "lucide-react"

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  // Mock data - would be fetched from API
  const activity = {
    id: params.id,
    name: "La Bella Vista Restaurant",
    category: "Restaurant",
    location: "123 Main St, New York, NY",
    rating: 4.8,
    reviewCount: 342,
    priceLevel: 3,
    image: "/restaurant-dining.jpg",
    description:
      "Experience authentic Italian cuisine in an elegant setting with breathtaking city views. Our menu features fresh, locally-sourced ingredients prepared by award-winning chefs. Perfect for romantic dinners, business meetings, or special celebrations.",
    tags: ["Italian", "Fine Dining", "Romantic"],
    phone: "+1-555-0101",
    website: "https://labellavista.example.com",
    hours: "Mon-Sun: 5:00 PM - 11:00 PM",
  }

  const reviews = [
    {
      id: "1",
      userName: "John Doe",
      rating: 5,
      date: "2025-01-15",
      text: "Amazing experience! The food was exceptional and the service was outstanding. Highly recommend the pasta dishes.",
    },
    {
      id: "2",
      userName: "Jane Smith",
      rating: 4,
      date: "2025-01-10",
      text: "Great atmosphere and delicious food. The view from our table was spectacular.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Image */}
        <div className="relative h-96">
          <img src={activity.image || "/placeholder.svg"} alt={activity.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="container mx-auto">
              <Badge className="mb-2">{activity.category}</Badge>
              <h1 className="text-4xl font-bold mb-2">{activity.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-medium">{activity.rating}</span>
                  <span className="opacity-90">({activity.reviewCount} reviews)</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <DollarSign
                      key={i}
                      className={`h-5 w-5 ${i < activity.priceLevel ? "text-white" : "text-white/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">{activity.description}</p>
                <div className="flex gap-2 mt-4">
                  {activity.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{review.userName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(review.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Button className="w-full" size="lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" size="lg">
                    <Heart className="h-4 w-4 mr-2" />
                    Save to Trip
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span>{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{activity.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={activity.website} className="text-primary hover:underline">
                        Visit Website
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Hours</h3>
                  <p className="text-sm text-muted-foreground">{activity.hours}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
