"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ActivityCard } from "@/components/activity-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Plus, Edit, Eye, Loader2 } from "lucide-react"

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
  is_active: boolean
}

export default function BusinessDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "business") {
      router.push("/explore")
      return
    }
    setUser(parsedUser)
    fetchMyBusinesses()
  }, [router])

  const fetchMyBusinesses = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/businesses/owner/my-businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBusinesses(data)
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">¡Bienvenido, {user.full_name}!</h1>
                <p className="text-muted-foreground">Gestiona tus establecimientos</p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/profile/edit">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/business/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Negocio
                  </Link>
                </Button>
              </div>
            </div>

          {/* Businesses List */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Establecimientos</CardTitle>
              <CardDescription>
                {businesses.length === 0
                  ? "Aún no has agregado ningún negocio"
                  : `Tienes ${businesses.length} establecimiento${businesses.length !== 1 ? "s" : ""} registrado${businesses.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : businesses.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes negocios registrados</h3>
                  <p className="text-muted-foreground mb-6">Comienza agregando tu primer establecimiento</p>
                  <Button asChild>
                    <Link href="/business/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Negocio
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {businesses.map((business) => (
                    <div key={business.id} className="relative">
                      {!business.is_active && (
                        <div className="absolute top-2 right-2 z-10 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                          Inactivo
                        </div>
                      )}
                      <ActivityCard
                        id={business.id}
                        name={business.name}
                        category={business.category}
                        location={`${business.location.city}, ${business.location.state}`}
                        rating={business.rating}
                        reviewCount={business.review_count}
                        priceLevel={business.price_level}
                        images={business.images}
                        description={business.description}
                        tags={business.tags}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/activity/${business.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/business/${business.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
