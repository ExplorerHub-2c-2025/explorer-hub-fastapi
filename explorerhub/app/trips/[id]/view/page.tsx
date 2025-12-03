"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Calendar, Heart, MessageCircle, Share2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { authFetch } from "@/lib/api"
import styles from "../page.module.css"

interface TripActivity {
  business_id: string
  business_name: string
  scheduled_date?: string
  notes?: string
  images?: Array<{url: string, notes?: string}>
  business_images?: string[]
}

interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  description?: string
  cover_image?: string
  activities: TripActivity[]
  user_id: string
  user_name: string
  user_profile_picture?: string
  likes_count: number
  comments: any[]
  created_at: string
}

export default function TripViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [likedTrips, setLikedTrips] = useState<Set<string>>(new Set())
  const [showComments, setShowComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({})

  useEffect(() => {
    loadTrip()
    loadLikedTrips()
  }, [resolvedParams.id])

  const loadTrip = async () => {
    try {
      const data = await authFetch(`https://localhost:8000/api/trips/${resolvedParams.id}/public`)
      setTrip(data)
    } catch (error) {
      console.error("Error loading trip:", error)
      router.push("/community")
    } finally {
      setIsLoading(false)
    }
  }

    const loadLikedTrips = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      // Get user's liked trips from the backend
      const response = await fetch("https://localhost:8000/api/trips/my-liked-trips", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        const liked = new Set<string>(data.liked_trip_ids.map((id: number) => id.toString()))
        setLikedTrips(liked)
      }
    } catch (error) {
      console.error("Error loading liked trips:", error)
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
      const method = isLiked ? "DELETE" : "POST"

      const response = await fetch(`https://localhost:8000/api/trips/${tripId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 400 && !isLiked) {
        // If POST returns "Already liked", it means the trip is liked but not in local state
        // Switch to DELETE to unlike it
        const deleteResponse = await fetch(`https://localhost:8000/api/trips/${tripId}/like`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (deleteResponse.ok) {
          // Update local state to reflect unliking
          setLikedTrips(prev => {
            const newSet = new Set(prev)
            newSet.delete(tripId)
            return newSet
          })

          // Update trip likes count
          if (trip) {
            setTrip({
              ...trip,
              likes_count: trip.likes_count - 1
            })
          }
        }
      } else if (response.ok) {
        // Normal case: toggle worked as expected
        setLikedTrips(prev => {
          const newSet = new Set(prev)
          if (isLiked) {
            newSet.delete(tripId)
          } else {
            newSet.add(tripId)
          }
          return newSet
        })

        // Update trip likes count
        if (trip) {
          setTrip({
            ...trip,
            likes_count: isLiked ? trip.likes_count - 1 : trip.likes_count + 1
          })
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleComment = async (tripId: string) => {
    if (!newComment.trim()) return

    const token = localStorage.getItem("token")
    if (!token) {
      alert("Debes iniciar sesión para comentar")
      router.push("/sign-in")
      return
    }

    try {
      await fetch(`https://localhost:8000/api/trips/${tripId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment }),
      })

      setNewComment("")
      // Reload trip to get updated comments
      loadTrip()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const nextImage = (activityId: string, maxImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [activityId]: ((prev[activityId] || 0) + 1) % maxImages
    }))
  }

  const prevImage = (activityId: string, maxImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [activityId]: ((prev[activityId] || 0) - 1 + maxImages) % maxImages
    }))
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    )
  }

  if (!trip) {
    return null
  }

  const formattedActivities = trip.activities.map((activity) => ({
    id: activity.business_id,
    business_id: activity.business_id,
    business_name: activity.business_name,
    categories: [], // Categories would come from business data
    scheduled_date: activity.scheduled_date ? new Date(activity.scheduled_date) : undefined,
    notes: activity.notes,
    images: activity.images || [],
    business_images: activity.business_images || [],
  }))

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <Link href="/community">
          <Button variant="ghost" className={styles.backButton}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Comunidad
          </Button>
        </Link>

        <div className={styles.contentGrid}>
          {/* Main Content */}
          <div className={styles.mainSection}>
            <div>
              <div className={styles.tripHeader}>
                <div className={styles.tripInfo}>
                  <h1 className={styles.tripTitle}>{trip.name}</h1>
                  <div className={styles.tripMeta}>
                    <div className={styles.tripMetaItem}>
                      <MapPin className="h-4 w-4" />
                      <span>{trip.destination}</span>
                    </div>
                    <div className={styles.tripMetaItem}>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(trip.start_date), "MMM d")} - {format(new Date(trip.end_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.actionButtons}>
                  <Button 
                    variant={likedTrips.has(trip.id) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => toggleLike(trip.id)}
                    className={likedTrips.has(trip.id) ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${likedTrips.has(trip.id) ? "fill-current" : ""}`} />
                    {likedTrips.has(trip.id) ? "Liked" : "Like"} ({trip.likes_count})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowComments(showComments === trip.id ? null : trip.id)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comentarios ({trip.comments.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert("Función de compartir próximamente")}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>

              {trip.description && <p className={styles.tripDescription}>{trip.description}</p>}

              {trip.cover_image && (
                <div className="mb-6">
                  <img
                    src={trip.cover_image}
                    alt={`Portada de ${trip.name}`}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Itinerary in read-only mode */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Itinerario</h2>

                {formattedActivities.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">Este viaje aún no tiene actividades planificadas</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const sortedActivities = [...formattedActivities].sort((a, b) => {
                        if (!a.scheduled_date && !b.scheduled_date) return 0
                        if (!a.scheduled_date) return 1
                        if (!b.scheduled_date) return -1
                        return a.scheduled_date.getTime() - b.scheduled_date.getTime()
                      })

                      // Group activities by date
                      const groupedActivities = sortedActivities.reduce((groups, activity) => {
                        const dateKey = activity.scheduled_date 
                          ? format(activity.scheduled_date, "yyyy-MM-dd")
                          : "sin-fecha"
                        
                        if (!groups[dateKey]) {
                          groups[dateKey] = []
                        }
                        groups[dateKey].push(activity)
                        return groups
                      }, {} as Record<string, typeof sortedActivities>)

                      const orderedDates = Object.keys(groupedActivities).sort((a, b) => {
                        if (a === "sin-fecha") return 1
                        if (b === "sin-fecha") return -1
                        return a.localeCompare(b)
                      })

                      return orderedDates.map((dateKey) => {
                        const dateActivities = groupedActivities[dateKey]
                        const isUnscheduled = dateKey === "sin-fecha"
                        const displayDate = isUnscheduled 
                          ? "Sin fecha programada"
                          : format(new Date(dateKey + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })

                        return (
                          <div key={dateKey} className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex-1 h-px bg-gray-200" />
                              <h3 className="text-lg font-semibold text-gray-700 capitalize">
                                {displayDate}
                              </h3>
                              <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {dateActivities.map((activity) => (
                              <Card key={activity.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-4">
                                    {/* Business Image on the left */}
                                    {activity.business_images && activity.business_images.length > 0 && (
                                      <div className="shrink-0">
                                        <img
                                          src={activity.business_images[0]}
                                          alt={activity.business_name}
                                          className="w-32 h-32 object-cover rounded-lg"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                          }}
                                        />
                                      </div>
                                    )}

                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg mb-2">{activity.business_name}</h4>

                                      {activity.notes && (
                                        <p className="text-sm text-gray-700 mb-3">{activity.notes}</p>
                                      )}

                                      {activity.images && activity.images.length > 0 && (
                                        <div className="space-y-2">
                                          <div className="relative rounded-lg overflow-hidden" style={{ height: '300px' }}>
                                            <img
                                              src={activity.images[imageIndexes[activity.id] || 0]?.url || "/placeholder.svg"}
                                              alt={activity.business_name}
                                              className="w-full h-full object-cover"
                                            />

                                            {activity.images.length > 1 && (
                                              <>
                                                <button
                                                  onClick={() => prevImage(activity.id, activity.images!.length)}
                                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                                                >
                                                  ←
                                                </button>
                                                <button
                                                  onClick={() => nextImage(activity.id, activity.images!.length)}
                                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                                                >
                                                  →
                                                </button>
                                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                  {(imageIndexes[activity.id] || 0) + 1} / {activity.images.length}
                                                </div>
                                              </>
                                            )}
                                          </div>

                                          {activity.images.map((image, idx) => (
                                            <div key={idx} className="mt-2">
                                              {image.notes && (
                                                <p className="text-xs text-gray-600 italic">"{image.notes}"</p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <Card>
              <CardContent className={styles.cardContent}>
                <h3 className={styles.sectionTitle}>Resumen del Viaje</h3>
                <div className={styles.tripSummary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Duración</span>
                    <span className={styles.summaryValue}>
                      {Math.ceil(
                        (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      días
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Actividades</span>
                    <span className={styles.summaryValue}>{trip.activities.length}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Destino</span>
                    <span className={styles.summaryValue}>{trip.destination}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={styles.cardContent}>
                <h3 className={styles.sectionTitle}>Sobre el Viajero</h3>
                <Link href={`/profile/${trip.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
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
                    <p className="text-sm text-muted-foreground">Ver perfil completo</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
