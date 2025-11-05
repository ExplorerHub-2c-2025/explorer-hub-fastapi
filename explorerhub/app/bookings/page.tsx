"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Calendar, Clock, MapPin, Users, Tag, Percent } from "lucide-react"
import styles from "./page.module.css"

interface Booking {
  id: number
  business_id: number
  business_name: string
  business_category: string
  business_image: string | null
  name: string
  amount: number
  date: string
  time: string
  created_at: string
  promotion_code?: string
  discount_applied: number
  original_price?: number
  final_price?: number
  status: 'pending' | 'confirmed' | 'cancelled'
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (!token || !userData) {
      router.push("/sign-in")
      return
    }

    const user = JSON.parse(userData)
    if (user.role === "business") {
      router.push("/dashboard/business")
      return
    }

    fetchBookings()
  }, [router])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      
      const response = await fetch("/api/bookings/my-bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/sign-in")
        return
      }

      if (!response.ok) {
        throw new Error("Error al cargar las reservas")
      }

      const data = await response.json()
      setBookings(data)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Format HH:MM
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      restaurant: "Restaurante",
      hotel: "Hotel",
      tour: "Tour",
      activity: "Actividad",
      transport: "Transporte",
    }
    return categories[category] || category
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendiente', className: styles.statusPending },
      confirmed: { label: 'Confirmada', className: styles.statusConfirmed },
      cancelled: { label: 'Cancelada', className: styles.statusCancelled },
    }

    const statusInfo = statusMap[status] || statusMap.pending
    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <main className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Mis Reservas</h1>
            <p className={styles.subtitle}>
              Aquí puedes ver todas tus reservas realizadas
            </p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && bookings.length === 0 && (
            <div className={styles.emptyState}>
              <Calendar className={styles.emptyIcon} />
              <h2>No tienes reservas</h2>
              <p>Cuando hagas una reserva, aparecerá aquí</p>
              <button
                className={styles.exploreButton}
                onClick={() => router.push("/explore")}
              >
                Explorar actividades
              </button>
            </div>
          )}

          <div className={styles.bookingsGrid}>
            {bookings.map((booking) => (
              <div key={booking.id} className={styles.bookingCard}>
                {booking.business_image && (
                  <div className={styles.imageContainer}>
                    <img
                      src={booking.business_image}
                      alt={booking.business_name}
                      className={styles.image}
                    />
                    {booking.discount_applied > 0 && (
                      <div className={styles.discountBadge}>
                        <Percent className={styles.discountIcon} />
                        {booking.discount_applied}% OFF
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.businessName}>
                      {booking.business_name}
                    </h3>
                    <div className={styles.badges}>
                      <span className={styles.category}>
                        {getCategoryLabel(booking.business_category)}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  <h4 className={styles.bookingName}>{booking.name}</h4>

                  <div className={styles.details}>
                    <div className={styles.detailItem}>
                      <Calendar className={styles.icon} />
                      <span>{formatDate(booking.date)}</span>
                    </div>

                    <div className={styles.detailItem}>
                      <Clock className={styles.icon} />
                      <span>{formatTime(booking.time)}</span>
                    </div>

                    <div className={styles.detailItem}>
                      <Users className={styles.icon} />
                      <span>
                        {booking.amount}{" "}
                        {booking.amount === 1 ? "persona" : "personas"}
                      </span>
                    </div>
                  </div>

                  {booking.promotion_code && (
                    <div className={styles.promotionInfo}>
                      <Tag className={styles.icon} />
                      <span>
                        Código: <strong>{booking.promotion_code}</strong>
                      </span>
                    </div>
                  )}

                  {booking.original_price && booking.final_price && (
                    <div className={styles.priceInfo}>
                      <div className={styles.originalPrice}>
                        ${booking.original_price.toFixed(2)}
                      </div>
                      <div className={styles.finalPrice}>
                        ${booking.final_price.toFixed(2)}
                      </div>
                      <div className={styles.savings}>
                        Ahorraste: $
                        {(booking.original_price - booking.final_price).toFixed(
                          2
                        )}
                      </div>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span className={styles.bookingDate}>
                      Reservado el {formatDate(booking.created_at)}
                    </span>
                    <button
                      className={styles.viewButton}
                      onClick={() =>
                        router.push(`/activity/${booking.business_id}`)
                      }
                    >
                      Ver negocio
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
