"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, MapPin, MessageCircle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { getUser } from "@/lib/auth"

import styles from "../explore/page.module.css"

interface FavoriteActivity {
  id: number
  user_id: string
  business_id: number
  created_at: string
  business_name: string
  business_categories: string[]
  business_location: string
  business_rating: number
  business_review_count: number
  business_price_level: number
  business_images: string[]
  business_description?: string
  business_tags: string[]
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageIndexes, setImageIndexes] = useState<Record<number, number>>({})
  const router = useRouter()

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push("/sign-in")
      return
    }

    fetchFavorites()
  }, [router])

  const fetchFavorites = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')

      if (!token) {
        setError("No autorizado")
        return
      }

      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Error al cargar favoritos")
      }

      const data = await response.json()
      setFavorites(data)
    } catch (err) {
      console.error("Error fetching favorites:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async (businessId: number) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`/api/favorites/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.business_id !== businessId))
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const nextImage = (id: number, maxImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % maxImages
    }))
  }

  const prevImage = (id: number, maxImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + maxImages) % maxImages
    }))
  }

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <div className={styles.headerTop}>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className={styles.backButton}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <h1 className={styles.mainTitle}>
                Mis Favoritos
              </h1>
            </div>
            <p className={styles.subtitle}>
              Tus <strong>actividades favoritas</strong> guardadas para futuras visitas.
            </p>
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className={styles.loadingSpinner} />
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorTitle}>Error al cargar favoritos</p>
              <p className={styles.errorText}>{error}</p>
              <Button onClick={fetchFavorites} className={styles.retryButton}>
                Reintentar
              </Button>
            </div>
          ) : favorites.length === 0 ? (
            <div className={styles.emptyState}>
              <Heart className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No tienes favoritos aún</p>
              <p className={styles.emptyMessage}>
                Explora actividades y guarda las que más te gusten.
              </p>
              <Button onClick={() => router.push('/explore')} className={styles.retryButton}>
                Explorar Actividades
              </Button>
            </div>
          ) : (
            <div className={styles.attractionsGrid}>
              {favorites.map((favorite, index) => {
                const activity = {
                  id: favorite.business_id,
                  name: favorite.business_name,
                  description: favorite.business_description || '',
                  categories: favorite.business_categories,
                  location: { city: favorite.business_location.split(',')[1]?.trim() || '', state: favorite.business_location.split(',')[2]?.trim() || '' },
                  rating: favorite.business_rating,
                  review_count: favorite.business_review_count,
                  price_level: favorite.business_price_level,
                  images: favorite.business_images,
                  tags: favorite.business_tags,
                  is_active: true,
                  allows_bookings: true,
                  max_capacity: undefined
                }

                const currentImageIndex = imageIndexes[activity.id] || 0
                const hasMultipleImages = activity.images.length > 1

                return (
                  <div key={favorite.id} className={styles.attractionCard}>
                    {/* Image Section */}
                    <div className={styles.imageContainer}>
                      <div className={styles.imageWrapper}>
                        <img
                          src={activity.images[currentImageIndex] || '/images/placeholder-business.jpg'}
                          alt={activity.name}
                          className={styles.cardImage}
                        />

                        {/* Favorite Button - Always filled since these are favorites */}
                        <button
                          className={styles.favoriteButton}
                          onClick={() => toggleFavorite(activity.id)}
                          aria-label="Remover de favoritos"
                        >
                          <Heart
                            className={styles.heartIcon}
                            fill="currentColor"
                          />
                        </button>

                        {/* Navigation Arrows */}
                        {hasMultipleImages && (
                          <>
                            <button
                              className={`${styles.navButton} ${styles.navButtonLeft}`}
                              onClick={(e) => {
                                e.preventDefault()
                                prevImage(activity.id, activity.images.length)
                              }}
                              aria-label="Imagen anterior"
                            >
                              <ChevronLeft className={styles.navIcon} />
                            </button>
                            <button
                              className={`${styles.navButton} ${styles.navButtonRight}`}
                              onClick={(e) => {
                                e.preventDefault()
                                nextImage(activity.id, activity.images.length)
                              }}
                              aria-label="Imagen siguiente"
                            >
                              <ChevronRight className={styles.navIcon} />
                            </button>

                            {/* Image Indicators */}
                            <div className={styles.imageIndicators}>
                              {activity.images.map((_, imgIndex) => (
                                <div
                                  key={imgIndex}
                                  className={`${styles.indicator} ${imgIndex === currentImageIndex ? styles.indicatorActive : ''}`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Badge */}
                        <div className={styles.badge}>
                          {activity.categories[0] || 'Sin categoría'}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div
                      className={styles.cardContent}
                      onClick={() => router.push(`/activity/${activity.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.cardNumber}>{index + 1}.</span>
                        <h2 className={styles.cardTitle}>{activity.name}</h2>
                      </div>

                      {/* Rating */}
                      <div className={styles.ratingSection}>
                        <div className={styles.ratingBubbles}>
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`${styles.ratingBubble} ${i < Math.floor(activity.rating) ? styles.ratingBubbleFilled : ''}`}
                            />
                          ))}
                        </div>
                        <span className={styles.reviewCount}>
                          ({activity.review_count.toLocaleString()})
                        </span>
                      </div>

                      {/* Category Badge */}
                      <div className={styles.categoryBadge}>
                        {activity.tags.slice(0, 2).join(' • ')}
                      </div>

                      {/* Description */}
                      <p className={styles.cardDescription}>
                        {activity.description.slice(0, 150)}
                        {activity.description.length > 150 && '...'}
                      </p>

                      {/* Footer */}
                      <div className={styles.cardFooter}>
                        <div className={styles.locationInfo}>
                          <MapPin className={styles.locationIcon} />
                          <span>{activity.location.city}, {activity.location.state}</span>
                        </div>
                        <div className={styles.statsContainer}>
                          <div className={styles.statItem}>
                            <Heart className={styles.statIcon} />
                            <span className={styles.statCount}>
                              ❤️
                            </span>
                          </div>
                          <div className={styles.statItem}>
                            <MessageCircle className={styles.statIcon} />
                            <span className={styles.statCount}>
                              {activity.review_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
