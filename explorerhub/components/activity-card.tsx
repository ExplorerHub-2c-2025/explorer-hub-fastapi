import Link from "next/link"
import { Star, MapPin, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import styles from "./activity-card.module.css"

interface ActivityCardProps {
  id: string
  name: string
  category: string
  location: string
  rating: number
  reviewCount: number
  priceLevel: number
  image: string
  description: string
  tags?: string[]
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
  description,
  tags = [],
}: ActivityCardProps) {
  return (
  <Link href={`/activity/${id}`} className={`${styles.root} group`}>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <img src={image || "/placeholder.svg"} alt={name} className={`${styles.image} group-hover:scale-105`} />
          <Badge className={styles.badge}>{category}</Badge>
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
                <DollarSign key={i} className={`${styles.dollar} ${i < priceLevel ? styles.dollarActive : styles.dollarInactive}`} />
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
