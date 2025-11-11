"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ActivityCard } from "@/components/activity-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Plus, Edit, Eye, Loader2, Users, Calendar, Clock } from "lucide-react"
import styles from "./page.module.css"

interface Business {
  id: number
  name: string
  description: string
  category: string | string[]
  categories?: string[]
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
  const [capacityInfo, setCapacityInfo] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCapacity, setIsLoadingCapacity] = useState(false)

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
    fetchCapacityInfo()
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

  const fetchCapacityInfo = async () => {
    try {
      setIsLoadingCapacity(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/businesses/owner/capacity-usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCapacityInfo(data)
      }
    } catch (error) {
      console.error("Error fetching capacity info:", error)
    } finally {
      setIsLoadingCapacity(false)
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
                <Button asChild variant="outline" className={styles.editProfileButton}>
                  <Link href="/profile/edit">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Link>
                </Button>
                <Button asChild className={styles.addBusinessButton}>
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
                  <Button asChild className={styles.addBusinessButton}>
                    <Link href="/business/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Negocio
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.map((business) => (
                    <div key={business.id} className="relative flex flex-col h-full">
                      {!business.is_active && (
                        <div className="absolute top-2 right-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                          Inactivo
                        </div>
                      )}
                      <ActivityCard
                        id={business.id}
                        name={business.name}
                        categories={business.categories || (business.category ? (Array.isArray(business.category) ? business.category : [business.category]) : [])}
                        location={`${business.location.city}, ${business.location.state}`}
                        rating={business.rating}
                        reviewCount={business.review_count}
                        priceLevel={business.price_level}
                        images={business.images}
                        description={business.description}
                        tags={business.tags}
                        badgeClassName={styles.categoryBadge}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button asChild variant="outline" size="sm" className={`${styles.viewButton} flex-1`}>
                          <Link href={`/activity/${business.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Link>
                        </Button>
                        <Button asChild size="sm" className={`${styles.editButton} flex-1`}>
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

          {/* Capacity Usage Section */}
          {capacityInfo.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ocupación de Cupos
                </CardTitle>
                <CardDescription>
                  Información sobre la ocupación de cupos en tus establecimientos con límite de capacidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCapacity ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {capacityInfo.map((business) => (
                      <div key={business.business_id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">{business.business_name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Capacidad máxima: {business.max_capacity} personas
                        </p>

                        {business.capacity_usage.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No hay reservas confirmadas próximamente</p>
                        ) : (
                          <div className="space-y-3">
                            {business.capacity_usage.map((usage: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{usage.date}</p>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {usage.time}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">
                                      {usage.used}/{usage.max_capacity}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {usage.bookings.length} reserva{usage.bookings.length !== 1 ? 's' : ''}
                                  </div>
                                </div>

                                <div className="w-24">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        usage.used / usage.max_capacity >= 0.9
                                          ? 'bg-red-500'
                                          : usage.used / usage.max_capacity >= 0.7
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                      }`}
                                      style={{ width: `${(usage.used / usage.max_capacity) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
