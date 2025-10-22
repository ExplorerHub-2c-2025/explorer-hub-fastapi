"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BusinessStatsCard } from "@/components/business-stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, Star, MessageSquare, TrendingUp, Plus, Edit, Eye, Trash } from "lucide-react"
import Link from "next/link"

export default function BusinessDashboardPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in/business")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (!parsedUser.is_business) {
      router.push("/profile/traveler")
      return
    }
    setIsAuthorized(true)
  }, [router])

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    const fetchData = async () => {
      try {
        const resStats = await fetch("/api/businesses/owner/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (resStats.ok) setStats(await resStats.json())

        const res = await fetch("/api/businesses/owner/my-businesses", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setBusinesses(await res.json())
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token")
    if (!token) return
    try {
      const res = await fetch(`/api/businesses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id))
      } else {
        console.error("Delete failed", res.status)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const recentReviews: any[] = []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Panel de Negocios</h1>
            <p className="text-muted-foreground">Gestiona tus negocios y monitorea el rendimiento</p>
          </div>
          <Link href="/business/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Negocio
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BusinessStatsCard
            title="Total Negocios"
            value={stats?.total_businesses ?? "-"}
            icon={Store}
            trend={{ value: 12, isPositive: true }}
          />
          <BusinessStatsCard
            title="Calificación Promedio"
            value={stats?.average_rating != null ? Number(stats.average_rating).toFixed(1) : "-"}
            icon={Star}
            description="En todos los negocios"
          />
          <BusinessStatsCard
            title="Total Reseñas"
            value={stats?.total_reviews ?? "-"}
            icon={MessageSquare}
            trend={{ value: 8, isPositive: true }}
          />
          <BusinessStatsCard
            title="Vistas Mensuales"
            value={stats?.total_views != null ? Number(stats.total_views).toLocaleString() : "-"}
            icon={TrendingUp}
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="businesses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="businesses">Mis Negocios</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas Recientes</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="space-y-4">
            {businesses && businesses.length > 0 ? (
              businesses.map((business) => (
                <Card key={business.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{business.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            {business.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{business.category}</p>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-medium">{business.rating}</span>
                            <span className="text-muted-foreground">({business.reviews} reseñas)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{business.views} vistas</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/business/${business.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        <Link href={`/activity/${business.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(business.id)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent>
                  <p>No tienes negocios aún. Crea uno desde el botón "Agregar Negocio".</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {recentReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{review.businessName}</h4>
                      <p className="text-sm text-muted-foreground">
                        por {review.userName} • {new Date(review.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.text}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analíticas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Vistas en el Tiempo</h4>
                    <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Visualización de gráfico aquí</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Tendencias de Reseñas</h4>
                    <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Visualización de gráfico aquí</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
