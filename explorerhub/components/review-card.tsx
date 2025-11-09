import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Star, User } from "lucide-react"
import styles from "./review-card.module.css"

interface ReviewCardProps {
  review: {
    id: number
    user_name: string
    username?: string
    profile_picture?: string
    rating: number
    title: string
    text: string
    created_at: string
    helpful_count: number
  }
}

export function ReviewCard({ review }: ReviewCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className={styles.userInfo}>
          <img
            src={review.profile_picture 
              ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${review.profile_picture}`
              : '/images/blank-profile-picture.png'
            }
            alt={review.username || review.user_name}
            className={styles.profilePicture}
          />
          <div className={styles.userDetails}>
            <h4 className={styles.userName}>
              {review.username ? `@${review.username}` : review.user_name}
            </h4>
            <p className={styles.userFullName}>{review.user_name}</p>
          </div>
        </div>
        <div className={styles.rating}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`${styles.star} ${i < review.rating ? styles.starFilled : ''}`}
              fill={i < review.rating ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </div>

      <div className={styles.reviewContent}>
        <h3 className={styles.reviewTitle}>{review.title}</h3>
        <p className={styles.reviewText}>{review.text}</p>
      </div>

      <div className={styles.reviewFooter}>
        <span className={styles.reviewDate}>
          {formatDistanceToNow(new Date(review.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </span>
        <span className={styles.helpfulCount}>
          {review.helpful_count} personas encontraron esto útil
        </span>
      </div>
    </div>
  )
}
