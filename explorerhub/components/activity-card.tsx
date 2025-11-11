"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Star, MapPin, DollarSign, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageGallery } from "@/components/image-gallery"
import styles from "./activity-card.module.css"

interface ActivityCardProps {
  id: string | number
  name: string
  category?: string  // Hacer opcional para compatibilidad
  categories?: string[]  // Nuevo campo para array de categorías
  location: string
  rating: number
  reviewCount: number
  priceLevel: number
  image?: string
  images?: string[]
  description: string
  tags?: string[]
  onSaveToggle?: (id: string | number, isSaved: boolean) => void
  badgeClassName?: string
}

export function ActivityCard({
  id,
  name,
  category,
  categories,
  location,
  rating,
  reviewCount,
  priceLevel,
  image,
  images = [],
  description,
  tags = [],
  onSaveToggle,
  badgeClassName,
}: ActivityCardProps) {
  // Use images array if available, otherwise fallback to single image
  const imageArray = images && images.length > 0 ? images : image ? [image] : []
  
  // Use categories array if available, otherwise fallback to category string
  let categoryArray: string[] = []
  
  if (categories && Array.isArray(categories) && categories.length > 0) {
    categoryArray = categories.filter((cat: any) => cat && typeof cat === 'string' && cat.trim().length > 0)
  } else if (category && typeof category === 'string' && category.trim().length > 0) {
    categoryArray = [category.trim()]
  }
  
  const displayCategory = categoryArray.length === 0 
    ? 'Sin categoría' 
    : categoryArray.length <= 2 
      ? categoryArray.join(', ') 
      : `${categoryArray[0]} +${categoryArray.length - 1}`

  const [isSaved, setIsSaved] = useState(false)
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(true)

  // Verificar si está en favoritos al montar el componente
  useEffect(() => {
    const checkFavorite = async () => {
      if (typeof window === "undefined") return

      const token = localStorage.getItem("token")
      if (!token) {
        setIsCheckingFavorite(false)
        return
      }

      try {
        const response = await fetch(`/api/favorites/check/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setIsSaved(data.is_favorite)
        }
      } catch (error) {
        console.error("Error checking favorite:", error)
      } finally {
        setIsCheckingFavorite(false)
      }
    }

    checkFavorite()
  }, [id])

  const handleSaveActivity = async (e: React.MouseEvent) => {
    e.preventDefault()

    const token = localStorage.getItem("token")
    if (!token) {
      // Redirigir al login si no está autenticado
      window.location.href = "/sign-in"
      return
    }

    try {
      if (isSaved) {
        // Eliminar de favoritos
        const response = await fetch(`/api/favorites/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok || response.status === 204) {
          setIsSaved(false)
          if (onSaveToggle) {
            onSaveToggle(id, false)
          }
        }
      } else {
        // Agregar a favoritos
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ business_id: Number(id) }),
        })

        if (response.ok) {
          setIsSaved(true)
          if (onSaveToggle) {
            onSaveToggle(id, true)
          }
        }
      }
    } catch (error) {
      console.error("Error saving activity:", error)
    }
  }

  return (
    <Link href={`/activity/${id}`} className={`${styles.root} group`}>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <ImageGallery images={imageArray} alt={name} />
          <Badge className={`${styles.badge} ${badgeClassName || ''}`}>{displayCategory}</Badge>
        </div>

        <div className={styles.content}>
          <h3 className={`${styles.title} group-hover:text-primary`}>{name}</h3>

          <div className={styles.ratingRow}>
            <div className={styles.ratingValue}>
              <Star className={styles.star} />
              <span className={styles.ratingNumber}>{rating.toFixed(1)}</span>
            </div>
            <span className={styles.reviewText}>({reviewCount} reviews)</span>
          </div>

          <div className={styles.locationRow}>
            <MapPin className={styles.mapPin} />
            <span className={styles.locationText}>{location}</span>
          </div>

          <p className={styles.description}>{description}</p>

          <div className={styles.footer}>
            <div className={styles.priceGroup}>
              {Array.from({ length: 4 }).map((_, i) => (
                <DollarSign
                  key={i}
                  className={`${styles.dollar} ${i < priceLevel ? styles.dollarActive : styles.dollarInactive}`}
                />
              ))}
            </div>

            {tags && tags.length > 0 && (
              <div className={styles.tagsGroup}>
                <Badge variant="secondary" className={styles.tagBadge}>
                  {(() => {
                    const validTags = tags.filter((tag: any) => tag && typeof tag === 'string' && tag.trim().length > 0)
                    return validTags.length <= 2 
                      ? validTags.join(', ') 
                      : `${validTags[0]} +${validTags.length - 1}`
                  })()}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
