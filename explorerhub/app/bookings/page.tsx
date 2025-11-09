"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Calendar, Clock, MapPin, Users, Tag, Percent, X } from "lucide-react"
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
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null)

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

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
      return
    }

    setCancellingBookingId(bookingId)
    
    try {
      const token = localStorage.getItem("token")
      
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PUT",
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
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al cancelar la reserva")
      }

      // Actualizar la lista de reservas
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      )
      
      alert("Reserva cancelada exitosamente")
    } catch (err) {
      console.error("Error cancelling booking:", err)
      alert(err instanceof Error ? err.message : "Error al cancelar la reserva")
    } finally {
      setCancellingBookingId(null)
    }
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

          {!isLoading && bookings.length > 0 && (
            <>
              {/* Próximas reservas */}
              <div className={styles.carouselSection}>
                <h2 className={styles.sectionTitle}>Próximas reservas</h2>
                <div className={styles.carousel}>
                  {bookings
                    .filter(booking => booking.status !== 'cancelled')
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 10)
                    .map((booking) => (
                      <div key={`upcoming-${booking.id}`} className={styles.bookingCard}>
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
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>

                          <h4 className={styles.bookingName}>{booking.name}</h4>

                          <div className={styles.details}>
                            <div className={styles.detailItem}>
                              <Calendar className={styles.icon} />
                              <span>{formatDate(booking.date)}</span>
                            </div>

                            <div className={styles.detailRow}>
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
                          </div>

                          <div className={styles.cardFooter}>
                            <div className={styles.footerActions}>
                              {booking.status !== 'cancelled' && (
                                <button
                                  className={styles.cancelButton}
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingBookingId === booking.id}
                                >
                                  {cancellingBookingId === booking.id ? (
                                    <>Cancelando...</>
                                  ) : (
                                    <>
                                      <X className={styles.cancelIcon} />
                                      Cancelar
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                className={styles.viewButton}
                                onClick={() =>
                                  router.push(`/activity/${booking.business_id}`)
                                }
                              >
                                Ver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Últimas reservas */}
              <div className={styles.carouselSection}>
                <h2 className={styles.sectionTitle}>Últimas reservas</h2>
                <div className={styles.carousel}>
                  {bookings
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((booking) => (
                      <div key={`recent-${booking.id}`} className={styles.bookingCard}>
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
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>

                          <h4 className={styles.bookingName}>{booking.name}</h4>

                          <div className={styles.details}>
                            <div className={styles.detailItem}>
                              <Calendar className={styles.icon} />
                              <span>{formatDate(booking.date)}</span>
                            </div>

                            <div className={styles.detailRow}>
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
                          </div>

                          <div className={styles.cardFooter}>
                            <div className={styles.footerActions}>
                              {booking.status !== 'cancelled' && (
                                <button
                                  className={styles.cancelButton}
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingBookingId === booking.id}
                                >
                                  {cancellingBookingId === booking.id ? (
                                    <>Cancelando...</>
                                  ) : (
                                    <>
                                      <X className={styles.cancelIcon} />
                                      Cancelar
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                className={styles.viewButton}
                                onClick={() =>
                                  router.push(`/activity/${booking.business_id}`)
                                }
                              >
                                Ver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Todas las reservas */}
              <div className={styles.carouselSection}>
                <h2 className={styles.sectionTitle}>Todas las reservas</h2>
                <div className={styles.carousel}>
                  {bookings.map((booking) => (
                    <div key={`all-${booking.id}`} className={styles.bookingCard}>
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
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>

                        <h4 className={styles.bookingName}>{booking.name}</h4>

                        <div className={styles.details}>
                          <div className={styles.detailItem}>
                            <Calendar className={styles.icon} />
                            <span>{formatDate(booking.date)}</span>
                          </div>

                          <div className={styles.detailRow}>
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
                        </div>

                        <div className={styles.cardFooter}>
                          <div className={styles.footerActions}>
                            {booking.status !== 'cancelled' && (
                              <button
                                className={styles.cancelButton}
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingBookingId === booking.id}
                              >
                                {cancellingBookingId === booking.id ? (
                                  <>Cancelando...</>
                                ) : (
                                  <>
                                    <X className={styles.cancelIcon} />
                                    Cancelar
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              className={styles.viewButton}
                              onClick={() =>
                                router.push(`/activity/${booking.business_id}`)
                              }
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
