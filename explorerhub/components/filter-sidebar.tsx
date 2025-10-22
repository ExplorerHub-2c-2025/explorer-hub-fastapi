"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import styles from "./filter-sidebar.module.css"

interface FilterSidebarProps {
  onFilterChange?: (filters: any) => void
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([1, 4])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)

  const categories = [
    "Restaurantes",
    "Actividades",
    "Atracciones",
    "Naturaleza",
    "Cultural",
    "Entretenimiento",
    "Compras",
    "Vida Nocturna",
  ]

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        priceRange,
        categories: selectedCategories,
        minRating,
      })
    }
  }, [priceRange, selectedCategories, minRating, onFilterChange])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleClearFilters = () => {
    setPriceRange([1, 4])
    setSelectedCategories([])
    setMinRating(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className={styles.heading}>Categorías</h3>
        <div className={styles.spaceY3}>
          {categories.map((category) => (
            <div key={category} className={styles.row}>
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label htmlFor={category} className="cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sectionDivider}>
        <h3 className={styles.heading}>Rango de Precio</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} min={1} max={4} step={1} className="mb-2" />
        <div className={styles.priceRow}>
          <span>$</span>
          <span>$$$$</span>
        </div>
      </div>

      <div className={styles.sectionDivider}>
        <h3 className={styles.heading}>Calificación Mínima</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(rating)}
              className={`${styles.ratingButton} ${
                minRating === rating ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <div className={styles.ratingStars}>
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-sm">y más</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sectionDivider}>
        <Button variant="outline" className={styles.clearBtn} onClick={handleClearFilters}>
          Limpiar Filtros
        </Button>
      </div>
    </div>
  )
}
