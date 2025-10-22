"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ActivityCard } from "@/components/activity-card"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "business") {
        router.push("/dashboard/business")
      } else {
        router.push("/explore")
      }
    }
  }, [router])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recommended")
  const [filters, setFilters] = useState({
    priceRange: [1, 4],
    categories: [] as string[],
    minRating: 0,
  })

  // Mock data - will be replaced with API calls
  const activities = [
    {
      id: "1",
      name: "La Bella Vista Restaurant",
      category: "Restaurants",
      location: "Downtown, New York",
      rating: 4.8,
      reviewCount: 342,
      priceLevel: 3,
      image: "/restaurant-dining.jpg",
      description: "Authentic Italian cuisine with stunning city views and fresh ingredients.",
      tags: ["Italian", "Fine Dining"],
    },
    {
      id: "2",
      name: "Mountain Hiking Adventure",
      category: "Nature",
      location: "Rocky Mountains, Colorado",
      rating: 4.9,
      reviewCount: 156,
      priceLevel: 2,
      image: "/nature-hiking.jpg",
      description: "Guided hiking tours through breathtaking mountain trails.",
      tags: ["Outdoor", "Adventure"],
    },
    {
      id: "3",
      name: "Historic City Tour",
      category: "Attractions",
      location: "Old Town, Boston",
      rating: 4.6,
      reviewCount: 523,
      priceLevel: 2,
      image: "/tourist-attractions.jpg",
      description: "Explore centuries of history with expert local guides.",
      tags: ["History", "Walking Tour"],
    },
    {
      id: "4",
      name: "Kayaking & Water Sports",
      category: "Activities",
      location: "Lake Tahoe, California",
      rating: 4.7,
      reviewCount: 289,
      priceLevel: 2,
      image: "/diverse-outdoor-activities.png",
      description: "Experience the thrill of water sports in crystal clear waters.",
      tags: ["Water Sports", "Adventure"],
    },
    {
      id: "5",
      name: "Sunset Wine Tasting",
      category: "Activities",
      location: "Napa Valley, California",
      rating: 4.9,
      reviewCount: 412,
      priceLevel: 3,
      image: "/wine-tasting-vineyard-sunset.jpg",
      description: "Sample premium wines while watching the sunset over rolling vineyards.",
      tags: ["Wine", "Relaxation"],
    },
    {
      id: "6",
      name: "Street Food Market Tour",
      category: "Restaurants",
      location: "Chinatown, San Francisco",
      rating: 4.5,
      reviewCount: 678,
      priceLevel: 1,
      image: "/street-food-market-asian-cuisine.jpg",
      description: "Discover authentic street food and local culinary traditions.",
      tags: ["Food Tour", "Cultural"],
    },
  ]

  const filteredActivities = useMemo(() => {
    let filtered = activities

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((activity) => filters.categories.includes(activity.category))
    }

    // Apply price range filter
    filtered = filtered.filter(
      (activity) => activity.priceLevel >= filters.priceRange[0] && activity.priceLevel <= filters.priceRange[1],
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
        filtered = [...filtered].sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.priceLevel - b.priceLevel)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.priceLevel - a.priceLevel)
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredActivities.map((activity) => (
                  <ActivityCard key={activity.id} {...activity} />
                ))}
              </div>

              {filteredActivities.length === 0 && (
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
