"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Search, Loader2, MapPin, Grid3x3, Heart, ChevronLeft, ChevronRight, Star, Plus, MessageCircle } from "lucide-react"
import styles from "./page.module.css"

interface Business {
  id: number
  name: string
  description: string
  categories: string[] // Cambiado de category: string a categories: string[]
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
  allows_bookings: boolean
  max_capacity?: number
}

export default function ExplorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activities, setActivities] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [imageIndexes, setImageIndexes] = useState<Record<number, number>>({})
  const [favoriteCounts, setFavoriteCounts] = useState<Record<number, number>>({})

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "business") {
        router.push("/dashboard/business")
      }
    }

    // If the home page sent a category/search via query params, prefill local filters
    const categoryParam = searchParams?.get("category")
    const searchParam = searchParams?.get("search")
    if (categoryParam) {
      setFilters((prev) => ({ ...prev, categories: [categoryParam] }))
    }
    if (searchParam) {
      setSearchQuery(searchParam)
    }

    fetchBusinesses()
    loadFavorites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/businesses`)
      
      if (!response.ok) {
        throw new Error("Error al cargar los establecimientos")
      }

      const data = await response.json()
      setActivities(data)
      
      // Load favorite counts for all businesses
      await loadFavoriteCounts(data)
    } catch (err) {
      console.error("Error fetching businesses:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const loadFavorites = () => {
    const storedFavorites = localStorage.getItem('favorites')
    if (storedFavorites) {
      setFavorites(new Set(JSON.parse(storedFavorites)))
    }
  }

  const loadFavoriteCounts = async (businesses: Business[]) => {
    const counts: Record<number, number> = {}
    
    for (const business of businesses) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/favorites/count/${business.id}`)
        if (response.ok) {
          const data = await response.json()
          counts[business.id] = data.count
        }
      } catch (error) {
        console.error(`Error loading favorite count for business ${business.id}:`, error)
        counts[business.id] = 0
      }
    }
    
    setFavoriteCounts(counts)
  }

  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)))
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

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recommended")
  const [filters, setFilters] = useState({
    priceRange: [1, 4],
    categories: [] as string[],
    minRating: 0,
  })

  const filteredActivities = useMemo(() => {
    let filtered = activities.filter(activity => activity.is_active)

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.location.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((activity) => 
        activity.categories.some(cat => filters.categories.includes(cat))
      )
    }

    // Apply price range filter
    filtered = filtered.filter(
      (activity) => activity.price_level >= filters.priceRange[0] && activity.price_level <= filters.priceRange[1],
    )

    // Apply minimum rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter((activity) => activity.rating >= filters.minRating)
    }

    // Apply sorting
    switch (sortBy) {
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating)
        break
      case "reviews":
        filtered = [...filtered].sort((a, b) => b.review_count - a.review_count)
        break
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price_level - b.price_level)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price_level - a.price_level)
        break
      default:
        // Keep recommended order
        break
    }

    return filtered
  }, [activities, searchQuery, filters, sortBy])

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <div className={styles.headerTop}>
              <h1 className={styles.mainTitle}>
                Las experiencias más populares
                {searchQuery && ` - "${searchQuery}"`}
              </h1>
              <div className={styles.viewButtons}>
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  className={styles.viewButton}
                >
                  <Grid3x3 className={styles.viewIcon} />
                  Ver todo
                </Button>
                <Button 
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  onClick={() => setViewMode('map')}
                  className={styles.viewButton}
                >
                  <MapPin className={styles.viewIcon} />
                  Mapa
                </Button>
              </div>
            </div>
            <p className={styles.subtitle}>
              Los <strong>establecimientos</strong> se basan en datos de otros usuarios. Tomamos en consideración sus opiniones y calificaciones, la cantidad de visualizaciones de la página y su ubicación.
            </p>
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className={styles.loadingSpinner} />
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorTitle}>Error al cargar experiencias</p>
              <p className={styles.errorText}>{error}</p>
              <Button onClick={fetchBusinesses} className={styles.retryButton}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className={styles.attractionsGrid}>
                  {filteredActivities.map((activity, index) => {
                    const currentImageIndex = imageIndexes[activity.id] || 0
                    const hasMultipleImages = activity.images.length > 1
                    
                    return (
                      <div key={activity.id} className={styles.attractionCard}>
                        {/* Image Section */}
                        <div className={styles.imageContainer}>
                          <div className={styles.imageWrapper}>
                            <img 
                              src={activity.images[currentImageIndex] || '/images/placeholder-business.jpg'} 
                              alt={activity.name}
                              className={styles.cardImage}
                            />
                            
                            {/* Favorite Button */}
                            <button 
                              className={styles.favoriteButton}
                              onClick={() => toggleFavorite(activity.id)}
                              aria-label="Guardar en favoritos"
                            >
                              <Heart 
                                className={styles.heartIcon}
                                fill={favorites.has(activity.id) ? 'currentColor' : 'none'}
                              />
                            </button>

                            {/* Add to Itinerary Button */}
                            <button 
                              className={styles.itineraryButton}
                              onClick={() => {
                                // TODO: Implement add to itinerary functionality
                                console.log(`Add to itinerary: ${activity.id}`)
                              }}
                              aria-label="Agregar a itinerario"
                            >
                              <Plus className={styles.plusIcon} />
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
                                  {favoriteCounts[activity.id] || 0}
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

              {/* Map View Placeholder */}
              {viewMode === 'map' && (
                <div className={styles.mapPlaceholder}>
                  <MapPin className={styles.mapIcon} />
                  <p>Vista de mapa próximamente</p>
                </div>
              )}

              {filteredActivities.length === 0 && (
                <div className={styles.emptyState}>
                  <Search className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>No se encontraron experiencias</p>
                  <p className={styles.emptyMessage}>
                    Intenta ajustar tus criterios de búsqueda.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
