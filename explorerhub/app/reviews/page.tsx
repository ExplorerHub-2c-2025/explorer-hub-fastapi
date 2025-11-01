"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ThumbsUp } from "lucide-react"
import styles from "./page.module.css"

export default function ReviewsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role === "business") {
      router.push("/dashboard/business")
      return
    }
    setIsAuthorized(true)
  }, [router])

  if (!isAuthorized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    )
  }
  // Mock data
  const reviews = [
    {
      id: "1",
      activityName: "La Bella Vista Restaurant",
      rating: 5,
      date: "2025-01-15",
      text: "Amazing experience! The food was exceptional and the service was outstanding. Highly recommend the pasta dishes.",
      helpful: 12,
    },
    {
      id: "2",
      activityName: "Mountain Hiking Adventure",
      rating: 4,
      date: "2025-01-10",
      text: "Great hiking experience with knowledgeable guides. The views were breathtaking. Would do it again!",
      helpful: 8,
    },
  ]

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Mis Reseñas</h1>
            <p className={styles.description}>Comparte tus experiencias y ayuda a otros viajeros</p>
          </div>

          <div className={styles.reviewsList}>
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <h3 className={styles.reviewTitle}>{review.activityName}</h3>
                      <div className={styles.reviewMeta}>
                        <div className={styles.starsContainer}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`${styles.star} ${
                                i < review.rating ? styles.starFilled : styles.starEmpty
                              }`}
                            />
                          ))}
                        </div>
                        <span className={styles.reviewDate}>
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.reviewText}>{review.text}</p>

                  <div className={styles.reviewActions}>
                    <Button variant="ghost" size="sm" className={styles.helpfulButton}>
                      <ThumbsUp className={styles.helpfulIcon} />
                      Útil ({review.helpful})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
