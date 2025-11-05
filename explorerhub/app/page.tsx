"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import styles from "./page.module.css"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
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

  const handleSearch = () => {
    // Build query params: category as English value
    const categoryEnglish = categoryMap[selectedCategory]
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (categoryEnglish) params.set("category", categoryEnglish)

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
      <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 900, padding: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '3rem', textAlign: 'center', textWrap: 'balance' }}>
            Descubre experiencias inolvidables cerca de ti
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Input
              aria-label="Buscar"
              placeholder="Buscar experiencias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />

            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecciona una categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleSearch}
            >
              Buscar
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
