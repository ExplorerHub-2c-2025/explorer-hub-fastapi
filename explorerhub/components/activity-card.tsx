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
  category: string
  location: string
  rating: number
  reviewCount: number
  priceLevel: number
  image?: string
  images?: string[]
  description: string
  tags?: string[]
  onSaveToggle?: (id: string | number, isSaved: boolean) => void
}

export function ActivityCard({
  id,
  name,
  category,
  location,
  rating,
  reviewCount,
  priceLevel,
  image,
  images = [],
  description,
  tags = [],
  onSaveToggle,
}: ActivityCardProps) {
  // Use images array if available, otherwise fallback to single image
  const imageArray = images && images.length > 0 ? images : image ? [image] : []

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
    <Link href={`/activity/${id}`} className={`${styles.root} group relative`}>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <ImageGallery images={imageArray} alt={name} />
          <Badge className={styles.badge}>{category}</Badge>
          <Button
            onClick={handleSaveActivity}
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Heart className={`h-5 w-5 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </Button>
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

            {tags.length > 0 && (
              <div className={styles.tagsGroup}>
                {tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className={styles.tagBadge}>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
