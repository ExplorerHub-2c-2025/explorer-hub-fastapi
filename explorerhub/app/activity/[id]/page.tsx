"use client"

import { use, useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageGallery } from "@/components/image-gallery"
import { Star, MapPin, Phone, Globe, DollarSign, Calendar, Heart, Loader2 } from "lucide-react"

interface Business {
  id: number
  name: string
  description: string
  category: string
  location: {
    address: string
    city: string
    state: string
    country: string
  }
  rating: number
  review_count: number
  price_level: number
  images: string[]
  tags: string[]
  phone?: string
  website?: string
}

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [activity, setActivity] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/businesses/${resolvedParams.id}`)
        
        if (!response.ok) {
          throw new Error("Negocio no encontrado")
        }

        const data = await response.json()
        setActivity(data)
      } catch (err) {
        console.error("Error fetching business:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [resolvedParams.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error al cargar el negocio</p>
            <p className="text-sm text-muted-foreground">{error || "No encontrado"}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Image Gallery */}
        <div className="relative h-96 bg-gray-900">
          <ImageGallery images={activity.images} alt={activity.name} showThumbnails={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white pointer-events-none">
            <div className="container mx-auto">
              <Badge className="mb-2 pointer-events-auto">{activity.category}</Badge>
              <h1 className="text-4xl font-bold mb-2">{activity.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-medium">{activity.rating.toFixed(1)}</span>
                  <span className="opacity-90">({activity.review_count} reseñas)</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <DollarSign
                      key={i}
                      className={`h-5 w-5 ${i < activity.price_level ? "text-white" : "text-white/30"}`}
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
                <h2 className="text-2xl font-bold mb-4">Acerca de</h2>
                <p className="text-muted-foreground leading-relaxed">{activity.description}</p>
                {activity.tags && activity.tags.length > 0 && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {activity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews Section - Could be implemented later */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Reseñas</h2>
                <p className="text-muted-foreground">Las reseñas estarán disponibles próximamente.</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Button className="w-full" size="lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    Reservar Ahora
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" size="lg">
                    <Heart className="h-4 w-4 mr-2" />
                    Guardar en Viaje
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold">Información de Contacto</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span>
                        {activity.location.address}, {activity.location.city}, {activity.location.state}, {activity.location.country}
                      </span>
                    </div>
                    {activity.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{activity.phone}</span>
                      </div>
                    )}
                    {activity.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={activity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Visitar Sitio Web
                        </a>
                      </div>
                    )}
                  </div>
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
