"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, Home, Utensils, Compass, Plane, Building2 } from "lucide-react"
import styles from "./page.module.css"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// Same category mapping used in FilterSidebar (Spanish -> English)
const categoryMap: Record<string, string> = {
  "Restaurantes": "Restaurant",
  "Actividades": "Activity",
  "Atracciones": "Attraction",
  "Naturaleza": "Nature",
  "Cultural": "Cultural",
  "Entretenimiento": "Entertainment",
  "Compras": "Shopping",
  "Vida Nocturna": "Nightlife",
}

const categories = Object.keys(categoryMap)

// Main navigation categories
const mainCategories = [
  { icon: Home, label: "Buscar todo", href: "/explore" },
  { icon: Building2, label: "Hoteles", href: "/explore?category=Hoteles" },
  { icon: Utensils, label: "Restaurantes", href: "/explore?category=Restaurant" },
  { icon: Compass, label: "Cosas que hacer", href: "/explore?category=Activity&category=Cultural&category=Entertainment" },
  { icon: Plane, label: "Viajes", href: "/trips" },
]

// Interest-based categories
const interestCategories = [
  { name: "Atracciones", category: "Attraction", image: "https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=400&h=300&fit=crop" },
  { name: "Naturaleza", category: "Nature", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" },
  { name: "Cultural", category: "Cultural", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop" },
  { name: "Entretenimiento", category: "Entertainment", image: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&h=300&fit=crop" },
  { name: "Compras", category: "Shopping", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop" },
  { name: "Vida Nocturna", category: "Nightlife", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop" },
]

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCheckingUser, setIsCheckingUser] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "business") {
        router.push("/dashboard/business")
        return
      }
    }
    setIsCheckingUser(false)
  }, [router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    router.push(`/explore?${params.toString()}`)
  }

  if (isCheckingUser) {
    return (
      <div className={styles.pageLoadingContainer}>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>¿Adónde irás?</h1>
          
          {/* Main Categories */}
          <div className={styles.categoryTabs}>
            {mainCategories.map((cat) => (
              <Link key={cat.label} href={cat.href} className={styles.categoryTab}>
                <cat.icon className={styles.categoryIcon} />
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <Input
                type="text"
                placeholder="Atracciones, actividades y hoteles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <Button type="submit" className={styles.searchButton}>
                Buscar
              </Button>
            </div>
          </form>
        </div>
      </section>

      <main className={styles.mainContent}>
        {/* Interest Categories */}
        <section className={styles.interestSection}>
          <h2 className={styles.sectionTitle}>Encuentra cosas que hacer según tu interés</h2>
          <div className={styles.interestGrid}>
            {interestCategories.map((interest) => (
              <Link
                key={interest.name}
                href={`/explore?category=${interest.category}`}
                className={styles.interestCard}
              >
                <div className={styles.interestImageWrapper}>
                  <img
                    src={interest.image}
                    alt={interest.name}
                    className={styles.interestImage}
                  />
                  <div className={styles.interestOverlay}>
                    <h3 className={styles.interestName}>{interest.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
