"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, MapPin, Calendar, ChevronLeft, ChevronRight, Search, UserPlus, UserMinus, Users } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import styles from "./page.module.css"
import Link from "next/link"

interface TripComment {
  user_id: string
  user_name: string
  comment: string
  created_at: string
}

interface PublicTrip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  description?: string
  cover_image?: string
  user_id: string
  user_name: string
  user_profile_picture?: string
  activities: any[]
  likes_count: number
  comments: TripComment[]
  created_at: string
}

interface UserSearchResult {
  id: string
  username: string
  full_name: string
  profile_picture?: string
  trips_count: number
  is_following: boolean
}

export default function CommunityPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<PublicTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [likedTrips, setLikedTrips] = useState<Set<string>>(new Set())
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({})
  const [showComments, setShowComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState<"explore" | "following">("explore")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (activeTab === "explore") {
      loadPublicTrips()
    } else {
      loadFollowingFeed()
    }
    loadLikedTrips()
  }, [activeTab])

  const loadLikedTrips = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch("https://localhost:8000/api/trips/my-liked-trips", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setLikedTrips(new Set(data.liked_trip_ids.map((id: number) => String(id))))
      }
    } catch (error) {
      console.error("Error loading liked trips:", error)
    }
  }

  const loadPublicTrips = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("https://localhost:8000/api/trips/public")
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTrips(data)
      } else {
        console.error("API returned non-array data:", data)
        setTrips([])
      }
    } catch (error) {
      console.error("Error loading public trips:", error)
      setTrips([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadFollowingFeed = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Debes iniciar sesión para ver tu feed")
      router.push("/sign-in")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("https://localhost:8000/api/users/following/feed", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setTrips(data)
      } else {
        setTrips([])
      }
    } catch (error) {
      console.error("Error loading following feed:", error)
      setTrips([])
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`https://localhost:8000/api/users/search?q=${encodeURIComponent(query)}`, {
        headers,
      })
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setSearchResults(data)
      }
    } catch (error) {
      console.error("Error searching users:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce para búsqueda en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300) // Espera 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleFollow = async (userId: string, isFollowing: boolean) => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Debes iniciar sesión para seguir usuarios")
      router.push("/sign-in")
      return
    }

    try {
      const method = isFollowing ? "DELETE" : "POST"
      const response = await fetch(`https://localhost:8000/api/users/${userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        // Refresh search results
        if (searchQuery) {
          await searchUsers(searchQuery)
        }
        // Refresh feed if in following tab
        if (activeTab === "following") {
          await loadFollowingFeed()
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }

  const toggleLike = async (tripId: string) => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Debes iniciar sesión para dar like")
      router.push("/sign-in")
      return
    }

    try {
      const isLiked = likedTrips.has(tripId)
      
      if (isLiked) {
        await fetch(`https://localhost:8000/api/trips/${tripId}/like`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
        const newLiked = new Set(likedTrips)
        newLiked.delete(tripId)
        setLikedTrips(newLiked)
      } else {
        await fetch(`https://localhost:8000/api/trips/${tripId}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        const newLiked = new Set(likedTrips)
        newLiked.add(tripId)
        setLikedTrips(newLiked)
      }

      // Reload trips to update counts
      if (activeTab === "explore") {
        loadPublicTrips()
      } else {
        loadFollowingFeed()
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleComment = async (tripId: string) => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Debes iniciar sesión para comentar")
      router.push("/sign-in")
      return
    }

    if (!newComment.trim()) return

    try {
      const response = await fetch(`https://localhost:8000/api/trips/${tripId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        alert(`Error al comentar: ${errorData.detail || 'Error desconocido'}`)
        return
      }

      setNewComment("")
      if (activeTab === "explore") {
        loadPublicTrips()
      } else {
        loadFollowingFeed()
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Error al añadir el comentario")
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Comunidad de Viajeros</h1>
          <p className="text-muted-foreground">Descubre itinerarios increíbles compartidos por otros viajeros</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab("explore")}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "explore"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Explorar
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "following"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Siguiendo
          </button>
        </div>

        {/* User Search Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar viajeros por nombre o username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results - Aparecen automáticamente mientras escribes */}
            {searchQuery && (
              <div className="mt-4">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No se encontraron viajeros</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {searchResults.map((user, index) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {user.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt={user.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <img
                                src="/blank-profile.png"
                                alt={user.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{user.full_name}</p>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                            <p className="text-xs text-gray-500">{user.trips_count} {user.trips_count === 1 ? 'viaje' : 'viajes'}</p>
                          </div>
                        </div>
                        <Button
                          variant={user.is_following ? "outline" : "default"}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFollow(user.id, user.is_following)
                          }}
                        >
                          {user.is_following ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-1" />
                              Siguiendo
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Seguir
                            </>
                          )}
                        </Button>
                      </Link>
                    ))}
                    {searchResults.length > 5 && (
                      <p className="text-xs text-center text-gray-500 py-2">
                        Desliza para ver más resultados
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {trips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                {activeTab === "following" 
                  ? "No hay itinerarios de usuarios que sigues" 
                  : "No hay itinerarios públicos todavía"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {activeTab === "following"
                  ? "Busca y sigue a otros viajeros para ver sus itinerarios"
                  : "¡Sé el primero en compartir tu viaje!"}
              </p>
              {activeTab === "explore" && (
                <Link href="/trips/new">
                  <Button className="mt-4">Crear Mi Itinerario</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">{trips.map((trip) => {
              const currentImageIndex = imageIndexes[trip.id] || 0
              const tripImages = trip.activities
                .filter(a => a.images && a.images.length > 0)
                .flatMap(a => a.images)
              const hasImages = tripImages.length > 0
              const hasCoverImage = trip.cover_image

              return (
                <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* User Header */}
                  <div className="p-4 flex items-center gap-3 border-b">
                    <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {trip.user_profile_picture ? (
                          <img
                            src={trip.user_profile_picture}
                            alt={trip.user_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <img
                            src="/blank-profile.png"
                            alt={trip.user_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{trip.user_name}</p>
                        <p className="text-xs text-muted-foreground">@{trip.user_name.toLowerCase().replace(' ', '_')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Content */}
                  <div className="p-4">
                    <p className="mb-3">{trip.description || `¡Miren el increíble viaje que armé para recorrer ${trip.destination}! ${Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))} días de paisajes de ensueño ⛰️✨`}</p>
                    
                    {/* Cover Image or Image Gallery */}
                    {hasCoverImage ? (
                      <div className="relative mb-4 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                        <img
                          src={trip.cover_image}
                          alt={trip.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : hasImages ? (
                      <div className="relative mb-4 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                        <img
                          src={tripImages[currentImageIndex] || "/placeholder.svg"}
                          alt={trip.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {tripImages.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                prevImage(trip.id, tripImages.length)
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                nextImage(trip.id, tripImages.length)
                              }}
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
                    ) : null}

                    {/* Trip Info Card */}
                    <Link href={`/trips/${trip.id}/view`}>
                      <div className="border rounded-lg p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                        <h3 className="font-bold text-lg mb-2">{trip.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{trip.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(trip.start_date), "dd MMM", { locale: es })} - {format(new Date(trip.end_date), "dd MMM yyyy", { locale: es })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{trip.destination.split(',').length} destinos</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleLike(trip.id)
                      }}
                      className="flex items-center gap-2 text-sm font-medium hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className={`h-5 w-5 ${likedTrips.has(trip.id) ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span>{trip.likes_count}</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowComments(showComments === trip.id ? null : trip.id)
                      }}
                      className="flex items-center gap-2 text-sm font-medium hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>{trip.comments.length}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments === trip.id && (
                    <div className="border-t p-4 bg-gray-50" onClick={(e) => e.stopPropagation()}>
                      <h4 className="font-semibold mb-3">Comentarios</h4>
                      
                      {trip.comments.map((comment, idx) => (
                        <div key={idx} className="mb-3 flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            <img
                              src="/blank-profile.png"
                              alt={comment.user_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-semibold">{comment.user_name}</span>
                              {' '}
                              <span className="text-muted-foreground text-xs">
                                {new Date(comment.created_at).toLocaleDateString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </p>
                            <p className="text-sm mt-1">{comment.comment}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2 mt-4">
                        <Input
                          placeholder="Escribe un comentario..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleComment(trip.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleComment(trip.id)
                          }} 
                          size="sm"
                        >
                          Enviar
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
