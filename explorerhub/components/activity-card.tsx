"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
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

  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      const userId = userData ? JSON.parse(userData).id : null

      if (userId) {
        const saved = localStorage.getItem(`savedActivities_${userId}`)
        if (saved) {
          const savedActivities = JSON.parse(saved)
          return savedActivities.some((act: any) => act.id === id)
        }
      }
    }
    return false
  })

  const handleSaveActivity = (e: React.MouseEvent) => {
    e.preventDefault()

    const userData = localStorage.getItem("user")
    const userId = userData ? JSON.parse(userData).id : null

    if (!userId) return

    const storageKey = `savedActivities_${userId}`
    const saved = localStorage.getItem(storageKey)
    let savedActivities = saved ? JSON.parse(saved) : []

    let newIsSaved = !isSaved

    if (isSaved) {
      // Remove from saved
      savedActivities = savedActivities.filter((act: any) => act.id !== id)
      newIsSaved = false
    } else {
      // Add to saved
      savedActivities.push({
        id,
        name,
        category,
        location,
        rating,
        reviewCount,
        priceLevel,
        images: imageArray,
        description,
        tags,
      })
      newIsSaved = true
    }

    localStorage.setItem(storageKey, JSON.stringify(savedActivities))
    setIsSaved(newIsSaved)

    if (onSaveToggle) {
      onSaveToggle(id, newIsSaved)
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
