"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, MapPin, Sparkles, Bookmark, Heart, LogOut } from "lucide-react"
import { ActivityCard } from "@/components/activity-card"

interface SavedActivity {
  id: string | number
  name: string
  category: string
  location: string
  rating: number
  reviewCount: number
  priceLevel: number
  images: string[]
  description: string
  tags: string[]
}

export default function TravelerProfile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role === "business") {
      router.push("/dashboard/business")
      return
    }
    setUser(parsedUser)

    const saved = localStorage.getItem(`savedActivities_${parsedUser.id}`)
    if (saved) {
      setSavedActivities(JSON.parse(saved))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
    router.refresh()
  }

  const handleSaveToggle = (activityId: string | number, isSaved: boolean) => {
    if (!isSaved) {
      // Activity was unsaved, remove it from the list
      const updated = savedActivities.filter((act) => act.id !== activityId)
      setSavedActivities(updated)
      localStorage.setItem(`savedActivities_${user.id}`, JSON.stringify(updated))
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">¡Hola, {user.name}!</h1>
              <p className="text-muted-foreground">Tu perfil de viajero</p>
            </div>
            <Button onClick={handleLogout} variant="destructive" className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Editar Perfil</CardTitle>
                    <CardDescription>Actualiza tu información personal</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/profile/edit">Editar perfil</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Recomendaciones</CardTitle>
                    <CardDescription>Descubre lugares para ti</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/explore">Ver recomendaciones</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Explorar Destinos</CardTitle>
                    <CardDescription>Busca actividades y lugares</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/explore">Explorar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Destinos de Interes</CardTitle>
                    <CardDescription>
                      {savedActivities.length} experiencia{savedActivities.length !== 1 ? "s" : ""} guardada
                      {savedActivities.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {savedActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Aún no tienes destinos guardados</p>
                  <Button asChild>
                    <Link href="/explore">Explorar experiencias</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedActivities.map((activity) => (
                    <div key={activity.id}>
                      <ActivityCard
                        id={activity.id}
                        name={activity.name}
                        category={activity.category}
                        location={activity.location}
                        rating={activity.rating}
                        reviewCount={activity.reviewCount}
                        priceLevel={activity.priceLevel}
                        images={activity.images}
                        description={activity.description}
                        tags={activity.tags}
                        onSaveToggle={handleSaveToggle}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-muted-foreground">Nombre completo:</span>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                {user.country && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-muted-foreground">País de residencia:</span>
                    <span className="font-medium">{user.country}</span>
                  </div>
                )}
                {user.date_of_birth && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-muted-foreground">Fecha de nacimiento:</span>
                    <span className="font-medium">{new Date(user.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                {user.language && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-muted-foreground">Idioma preferido:</span>
                    <span className="font-medium capitalize">{user.language}</span>
                  </div>
                )}
                {user.travel_preferences && user.travel_preferences.length > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Preferencias de viaje:</span>
                    <span className="font-medium capitalize">{user.travel_preferences.join(", ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
