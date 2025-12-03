"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Calendar, Users, UserPlus, UserMinus, Heart, MessageCircle, ChevronLeft, ChevronRight, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface User {
  id: string
  username: string
  full_name: string
  profile_picture?: string
  bio?: string
  country?: string
  travel_preferences?: string[]
}

interface PublicTrip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  description?: string
  activities: any[]
  likes_count: number
  comments: any[]
  created_at: string
}

interface UserStats {
  trips_count: number
  followers_count: number
  following_count: number
}

interface FollowUser {
  id: string
  username: string
  full_name: string
  profile_picture?: string
  is_following: boolean
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<PublicTrip[]>([])
  const [stats, setStats] = useState<UserStats>({ trips_count: 0, followers_count: 0, following_count: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Modal states
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false)

  useEffect(() => {
    // Get current user ID
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setCurrentUserId(String(parsedUser.id))
    }
    loadUserProfile()
  }, [resolvedParams.id])

  const loadUserProfile = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // Cargar información del usuario
      const userResponse = await fetch(`https://localhost:8000/api/users/${resolvedParams.id}`, {
        headers,
      })
      
      if (!userResponse.ok) {
        throw new Error("Usuario no encontrado")
      }

      const userData = await userResponse.json()
      setUser(userData)
      setIsFollowing(userData.is_following || false)

      // Cargar estadísticas
      const statsResponse = await fetch(`https://localhost:8000/api/users/${resolvedParams.id}/stats`, {
        headers,
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Cargar viajes públicos del usuario
      const tripsResponse = await fetch(`https://localhost:8000/api/users/${resolvedParams.id}/trips`, {
        headers,
      })
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json()
        setTrips(Array.isArray(tripsData) ? tripsData : [])
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      alert("No se pudo cargar el perfil del usuario")
    } finally {
      setIsLoading(false)
    }
  }

  const loadFollowers = async () => {
    setIsLoadingFollowers(true)
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`https://localhost:8000/api/users/${resolvedParams.id}/followers`, {
        headers,
      })
      
      if (response.ok) {
        const data = await response.json()
        setFollowers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading followers:", error)
    } finally {
      setIsLoadingFollowers(false)
    }
  }

  const loadFollowing = async () => {
    setIsLoadingFollowing(true)
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`https://localhost:8000/api/users/${resolvedParams.id}/following`, {
        headers,
      })
      
      if (response.ok) {
        const data = await response.json()
        setFollowing(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading following:", error)
    } finally {
      setIsLoadingFollowing(false)
    }
  }

  const toggleFollow = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Debes iniciar sesión para seguir usuarios")
      router.push("/sign-in")
      return
    }

    try {
      const method = isFollowing ? "DELETE" : "POST"
      const response = await fetch(`https://localhost:8000/api/users/${resolvedParams.id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        // Actualizar contadores
        setStats(prev => ({
          ...prev,
          followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
        }))
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }

  const toggleFollowInModal = async (userId: string, currentlyFollowing: boolean) => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Debes iniciar sesión para seguir usuarios")
      router.push("/sign-in")
      return
    }

    try {
      const method = currentlyFollowing ? "DELETE" : "POST"
      const response = await fetch(`https://localhost:8000/api/users/${userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        // Actualizar la lista localmente
        setFollowers(prev => prev.map(f => 
          f.id === userId ? { ...f, is_following: !currentlyFollowing } : f
        ))
        setFollowing(prev => prev.map(f => 
          f.id === userId ? { ...f, is_following: !currentlyFollowing } : f
        ))
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }

  const handleShowFollowers = () => {
    setShowFollowersModal(true)
    loadFollowers()
  }

  const handleShowFollowing = () => {
    setShowFollowingModal(true)
    loadFollowing()
  }

  const nextImage = (tripId: string, maxImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [tripId]: ((prev[tripId] || 0) + 1) % maxImages
    }))
  }

  const prevImage = (tripId: string, maxImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [tripId]: ((prev[tripId] || 0) - 1 + maxImages) % maxImages
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="py-12 text-center">
              <p className="text-lg font-semibold mb-2">Usuario no encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                El usuario que buscas no existe o ha sido eliminado
              </p>
              <Button onClick={() => router.push("/community")}>
                Volver a la comunidad
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Header del perfil */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-3xl flex-shrink-0">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{user.full_name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Información del usuario */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold mb-1">{user.full_name}</h1>
                <p className="text-muted-foreground mb-2">@{user.username}</p>
                
                {user.bio && (
                  <p className="text-sm mb-4">{user.bio}</p>
                )}

                {user.country && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground justify-center md:justify-start mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{user.country}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-6 justify-center md:justify-start mb-4">
                  <div className="text-center cursor-pointer" onClick={handleShowFollowers}>
                    <p className="font-bold text-lg hover:text-blue-600">{stats.followers_count}</p>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                  </div>
                  <div className="text-center cursor-pointer" onClick={handleShowFollowing}>
                    <p className="font-bold text-lg hover:text-blue-600">{stats.following_count}</p>
                    <p className="text-xs text-muted-foreground">Siguiendo</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{stats.trips_count}</p>
                    <p className="text-xs text-muted-foreground">Viajes</p>
                  </div>
                </div>

                {/* Botón seguir */}
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={toggleFollow}
                  className="w-full md:w-auto"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Dejar de seguir
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Seguir
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Viajes del usuario */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Viajes de {user.full_name}</h2>
          
          {trips.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {user.full_name} aún no ha compartido ningún viaje público
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {trips.map((trip) => {
                const currentImageIndex = imageIndexes[trip.id] || 0
                const tripImages = trip.activities
                  .filter(a => a.images && a.images.length > 0)
                  .flatMap(a => a.images)
                const hasImages = tripImages.length > 0

                return (
                  <Link key={trip.id} href={`/trips/${trip.id}/view`}>
                    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    {/* Trip Content */}
                    <div className="p-4">
                      <p className="mb-3">{trip.description || `Viaje increíble a ${trip.destination}`}</p>
                      
                      {/* Image Gallery */}
                      {hasImages && (
                        <div className="relative mb-4 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                          <img
                            src={tripImages[currentImageIndex] || "/placeholder.svg"}
                            alt={trip.name}
                            className="w-full h-full object-cover"
                          />
                          
                          {tripImages.length > 1 && (
                            <>
                              <button
                                onClick={() => prevImage(trip.id, tripImages.length)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => nextImage(trip.id, tripImages.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {currentImageIndex + 1} / {tripImages.length}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Trip Info Card */}
                      <div className="border rounded-lg p-4 bg-white">
                        <h3 className="font-bold text-lg mb-2">{trip.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(trip.start_date), "dd MMM", { locale: es })} - {format(new Date(trip.end_date), "dd MMM yyyy", { locale: es })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{trip.destination}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="h-5 w-5" />
                        <span>{trip.likes_count}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageCircle className="h-5 w-5" />
                        <span>{trip.comments.length}</span>
                      </div>
                    </div>
                  </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Followers Modal */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="w-[60%] max-w-lg max-h-[600px] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Seguidores</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {isLoadingFollowers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : followers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay seguidores</p>
            ) : (
              <div className="space-y-2">
                {followers.map((follower) => (
                  <div key={follower.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 border">
                    <Link href={`/profile/${follower.id}`} className="flex items-center gap-3 flex-1" onClick={() => setShowFollowersModal(false)}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {follower.profile_picture ? (
                          <img
                            src={follower.profile_picture}
                            alt={follower.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{follower.full_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{follower.full_name}</p>
                        <p className="text-sm text-gray-600">@{follower.username}</p>
                      </div>
                    </Link>
                    {currentUserId && currentUserId !== follower.id && (
                      <Button
                        variant={follower.is_following ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleFollowInModal(follower.id, follower.is_following)}
                      >
                        {follower.is_following ? "Siguiendo" : "Seguir"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="w-[60%] max-w-lg max-h-[600px] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Siguiendo</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {isLoadingFollowing ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : following.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sigue a nadie</p>
            ) : (
              <div className="space-y-2">
                {following.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 border">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1" onClick={() => setShowFollowingModal(false)}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={user.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{user.full_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{user.full_name}</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                    </Link>
                    {currentUserId && currentUserId !== user.id && (
                      <Button
                        variant={user.is_following ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleFollowInModal(user.id, user.is_following)}
                      >
                        {user.is_following ? "Siguiendo" : "Seguir"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
