"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ActivityCard } from "@/components/activity-card"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal, Loader2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import styles from "./page.module.css"

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

export default function ExplorePage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "business") {
        router.push("/dashboard/business")
      }
    }
    
    fetchBusinesses()
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
    } catch (err) {
      console.error("Error fetching businesses:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
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
          activity.location.state.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((activity) => filters.categories.includes(activity.category))
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
        {/* Search Header */}
        <div className={styles.searchHeader}>
          <div className={styles.searchHeaderContainer}>
            <div className={styles.searchHeaderGrid}>
              <div className={styles.searchBarWrapper}>
                <Search className={styles.searchIcon} />
                <Input
                  type="text"
                  placeholder="Buscar experiencias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className={styles.clearButton}
                  >
                    <X className={styles.clearIcon} />
                  </Button>
                )}
              </div>

              <div className={styles.controlsRow}>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={styles.sortSelect}>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recomendados</SelectItem>
                    <SelectItem value="rating">Mejor Valorados</SelectItem>
                    <SelectItem value="reviews">Más Reseñas</SelectItem>
                    <SelectItem value="price-low">Precio: Menor a Mayor</SelectItem>
                    <SelectItem value="price-high">Precio: Mayor a Menor</SelectItem>
                  </SelectContent>
                </Select>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className={styles.filterButton}>
                      <SlidersHorizontal className={styles.filterIcon} />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className={styles.sheetContent}>
                      <FilterSidebar onFilterChange={setFilters} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.contentContainer}>
          <div className={styles.contentGrid}>
            {/* Desktop Sidebar */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarSticky}>
                <FilterSidebar onFilterChange={setFilters} />
              </div>
            </aside>

            {/* Results */}
            <div className={styles.resultsSection}>
              <div className={styles.resultsHeader}>
                <h1 className={styles.resultsTitle}>Explorar Experiencias</h1>
                <div className={styles.resultsInfo}>
                  <p className={styles.resultsCount}>
                    {filteredActivities.length} experiencia{filteredActivities.length !== 1 ? 's' : ''} encontrada{filteredActivities.length !== 1 ? 's' : ''}
                  </p>
                  {sortBy !== "recommended" && (
                    <p className={styles.sortInfo}>
                      Ordenado por: {
                        sortBy === "rating" ? "Mejor Valorados" :
                        sortBy === "reviews" ? "Más Reseñas" :
                        sortBy === "price-low" ? "Precio: Menor a Mayor" :
                        sortBy === "price-high" ? "Precio: Mayor a Menor" :
                        "Recomendados"
                      }
                    </p>
                  )}
                </div>
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
                  <div className={styles.activitiesGrid}>
                    {filteredActivities.map((activity) => (
                      <ActivityCard 
                        key={activity.id} 
                        id={activity.id}
                        name={activity.name}
                        category={activity.category}
                        location={`${activity.location.city}, ${activity.location.state}`}
                        rating={activity.rating}
                        reviewCount={activity.review_count}
                        priceLevel={activity.price_level}
                        images={activity.images}
                        description={activity.description}
                        tags={activity.tags}
                      />
                    ))}
                  </div>

                  {filteredActivities.length === 0 && !isLoading && (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIconContainer}>
                        <Search className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>No se encontraron experiencias</p>
                        <p className={styles.emptyMessage}>
                          No hay resultados que coincidan con tus criterios de búsqueda.
                        </p>
                        <p className={styles.emptyHint}>
                          Intenta ajustar tus filtros o búsqueda para ver más resultados.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Load More */}
                  {filteredActivities.length > 0 && (
                    <div className={styles.loadMoreSection}>
                      <Button variant="outline" size="lg">
                        Cargar Más
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
