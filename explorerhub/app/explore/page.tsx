"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ActivityCard } from "@/components/activity-card"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Search Header */}
        <div className="border-b border-gray-200 bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-gray-200">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar experiencias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
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
                    <Button variant="outline" className="md:hidden bg-transparent">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar onFilterChange={setFilters} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-20">
                <FilterSidebar onFilterChange={setFilters} />
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Explorar Experiencias</h1>
                <p className="text-muted-foreground">{filteredActivities.length} experiencias encontradas</p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-2">Error al cargar experiencias</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button onClick={fetchBusinesses} className="mt-4">
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No se encontraron experiencias que coincidan con tus criterios.</p>
                      <p className="text-sm text-muted-foreground mt-2">Intenta ajustar tus filtros o búsqueda.</p>
                    </div>
                  )}

                  {/* Load More */}
                  {filteredActivities.length > 0 && (
                    <div className="mt-8 text-center">
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
