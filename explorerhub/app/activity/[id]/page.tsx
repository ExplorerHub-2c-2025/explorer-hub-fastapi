"use client"

import { use, useEffect, useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Star, MapPin, Phone, Globe, DollarSign, Calendar, Heart, Loader2, ArrowLeft, Plus, MessageSquare, Trash2, Reply, AlertCircle, CheckCircle2 } from "lucide-react"
import { AuthRequiredDialog } from "@/components/auth-required-dialog"
import { ReviewForm } from "@/components/review-form"
import { useAuthRequired } from "@/lib/hooks/use-auth-required"
import styles from "./page.module.css"

interface Business {
  id: number
  name: string
  description: string
  category: string
  location: {
    address: string
    city: string
    state: string
    country: string
  }
  rating: number
  review_count: number
  price_level: number
  images: string[]
  tags: string[]
  phone?: string
  website?: string
}

interface Reply {
  id: number
  user_id: string
  user_name: string
  text: string
  created_at: string
  replies: Reply[]
}

interface Review {
  id: number
  user_id: string
  user_name: string
  business_id: string
  rating: number
  title: string
  text: string
  images?: string[]
  helpful_count: number
  replies: Reply[]
  created_at: string
}

// Componente recursivo para renderizar respuestas (fuera del componente principal)
const RenderReply = memo(({ 
  reply, 
  reviewId, 
  depth = 0,
  replyingToReply,
  nestedReplyText,
  setNestedReplyText,
  setReplyingToReply,
  handleReplyToReply,
  handleSubmitNestedReply,
  handleDeleteReply,
  isOwnReply,
  styles
}: { 
  reply: Reply
  reviewId: number
  depth?: number
  replyingToReply: { reviewId: number, replyId: number } | null
  nestedReplyText: string
  setNestedReplyText: (text: string) => void
  setReplyingToReply: (value: { reviewId: number, replyId: number } | null) => void
  handleReplyToReply: (reviewId: number, replyId: number) => void
  handleSubmitNestedReply: () => void
  handleDeleteReply: (reviewId: number, replyId: number) => void
  isOwnReply: (reply: Reply) => boolean
  styles: any
}) => {
  return (
    <div className={styles.replyItem} style={{ marginLeft: `${depth * 20}px` }}>
      <div className={styles.replyHeader}>
        <span className={styles.replyAuthor}>{reply.user_name}</span>
        <span className={styles.replyDate}>
          {new Date(reply.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
      <p className={styles.replyText}>{reply.text}</p>
      
      <div className={styles.replyActions}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReplyToReply(reviewId, reply.id)}
          className={styles.replyActionButton}
        >
          <Reply className="h-3 w-3 mr-1" />
          Responder
        </Button>
        
        {isOwnReply(reply) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteReply(reviewId, reply.id)}
            className={styles.deleteReplyButton}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Nested Reply Form */}
      {replyingToReply?.reviewId === reviewId && replyingToReply?.replyId === reply.id && (
        <div className={styles.replyForm} style={{ marginTop: '10px' }}>
          <textarea
            key={`nested-reply-${reviewId}-${reply.id}`}
            value={nestedReplyText}
            onChange={(e) => setNestedReplyText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className={styles.replyTextarea}
            rows={3}
            autoFocus
            dir="ltr"
            style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'normal' }}
          />
          <div className={styles.replyFormActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyingToReply(null)
                setNestedReplyText("")
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitNestedReply}
            >
              Enviar
            </Button>
          </div>
        </div>
      )}

      {/* Render nested replies recursively */}
      {reply.replies && reply.replies.length > 0 && (
        <div className={styles.nestedRepliesContainer}>
          {reply.replies.map((nestedReply) => (
            <RenderReply 
              key={nestedReply.id} 
              reply={nestedReply} 
              reviewId={reviewId}
              depth={depth + 1}
              replyingToReply={replyingToReply}
              nestedReplyText={nestedReplyText}
              setNestedReplyText={setNestedReplyText}
              setReplyingToReply={setReplyingToReply}
              handleReplyToReply={handleReplyToReply}
              handleSubmitNestedReply={handleSubmitNestedReply}
              handleDeleteReply={handleDeleteReply}
              isOwnReply={isOwnReply}
              styles={styles}
            />
          ))}
        </div>
      )}
    </div>
  )
})

RenderReply.displayName = 'RenderReply'

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { id } = resolvedParams
  const router = useRouter()
  const [activity, setActivity] = useState<Business | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const { showAuthDialog, setShowAuthDialog, requireAuth } = useAuthRequired()
  
  // Reply states
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyingToReply, setReplyingToReply] = useState<{ reviewId: number, replyId: number } | null>(null)
  const [nestedReplyText, setNestedReplyText] = useState("")
  
  // Alert/Confirm Dialog states
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    type: 'success' | 'error' | 'confirm'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    open: false,
    type: 'success',
    title: '',
    message: ''
  })

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertDialog({ open: true, type, title, message })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertDialog({ open: true, type: 'confirm', title, message, onConfirm })
  }

  const closeAlert = () => {
    setAlertDialog({ ...alertDialog, open: false })
  }

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/businesses/${resolvedParams.id}`)
        
        if (!response.ok) {
          throw new Error("Negocio no encontrado")
        }

        const data = await response.json()
        setActivity(data)

        // Fetch reviews - ruta correcta
        const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/business/${resolvedParams.id}`)
        console.log("Fetching reviews from:", `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/business/${resolvedParams.id}`)
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          console.log("Reviews recibidas:", reviewsData)
          setReviews(reviewsData)
        } else {
          console.error("Error al obtener reseñas:", reviewsResponse.status)
        }
      } catch (err) {
        console.error("Error fetching business:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [resolvedParams.id])

  const handleReserve = () => {
    console.log("handleReserve clicked")
    requireAuth(() => {
      // Implementar lógica de reserva
      console.log("Reservar - Usuario autenticado")
    })
  }

  const handleSaveToTrip = () => {
    console.log("handleSaveToTrip clicked")
    requireAuth(() => {
      // Implementar lógica de guardar en viaje
      console.log("Guardar en viaje - Usuario autenticado")
    })
  }

  const handleAddReview = () => {
    console.log("handleAddReview clicked")
    requireAuth(() => {
      console.log("Agregar reseña - Usuario autenticado")
      setShowReviewForm(true)
    })
  }

  const handleReviewSuccess = async (reviewData: any) => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        showAlert('error', 'Sesión requerida', 'Debes iniciar sesión para dejar una reseña')
        setShowAuthDialog(true)
        return
      }
      
      // Asegurar que business_id sea número
      const payload = {
        ...reviewData,
        business_id: parseInt(id)
      }
      
      console.log("Enviando reseña:", payload)
      console.log("Token:", token ? "presente" : "ausente")
      console.log("URL:", `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews`)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)

      if (response.status === 401) {
        // Token inválido o expirado
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        showAlert('error', 'Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
        setTimeout(() => {
          setShowAuthDialog(true)
          setShowReviewForm(false)
        }, 1500)
        return
      }

      if (response.ok) {
        console.log("Reseña creada exitosamente")
        showAlert('success', '¡Éxito!', '¡Reseña agregada exitosamente!')
        setShowReviewForm(false)
        // Recargar las reseñas después de un momento
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        console.error("Error del servidor:", errorData)
        showAlert('error', 'Error', errorData.detail || 'No se pudo crear la reseña')
      }
    } catch (error) {
      console.error("Error completo al enviar la reseña:", error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showAlert('error', 'Error de conexión', 'No se puede conectar al servidor. Verifica que el backend esté corriendo.')
      } else {
        showAlert('error', 'Error', error instanceof Error ? error.message : 'Error desconocido al enviar la reseña')
      }
    }
  }

  const handleDeleteReview = (reviewId: number) => {
    requireAuth(async () => {
      showConfirm(
        '¿Eliminar reseña?',
        '¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.',
        async () => {
          try {
            const token = localStorage.getItem("token")
            
            if (!token) {
              showAlert('error', 'Sesión expirada', 'Por favor inicia sesión nuevamente')
              setShowAuthDialog(true)
              return
            }
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/${reviewId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.status === 401) {
              // Token inválido o expirado
              localStorage.removeItem("token")
              localStorage.removeItem("user")
              showAlert('error', 'Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
              setTimeout(() => setShowAuthDialog(true), 1500)
              return
            }

            if (response.ok) {
              showAlert('success', 'Reseña eliminada', 'La reseña ha sido eliminada exitosamente')
              // Actualizar la lista de reseñas
              setReviews(reviews.filter(review => review.id !== reviewId))
              // Recargar para actualizar el rating
              setTimeout(() => window.location.reload(), 1500)
            } else {
              showAlert('error', 'Error', 'No tienes permiso para eliminar esta reseña')
            }
          } catch (error) {
            console.error("Error al eliminar la reseña:", error)
            showAlert('error', 'Error', 'Error al eliminar la reseña')
          }
        }
      )
    })
  }

  const handleReplyReview = (reviewId: number) => {
    requireAuth(() => {
      setReplyingTo(reviewId)
      setReplyText("")
    })
  }

  const handleSubmitReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      showAlert('error', 'Error', 'Por favor escribe una respuesta')
      return
    }

    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        showAlert('error', 'Sesión expirada', 'Por favor inicia sesión nuevamente')
        setShowAuthDialog(true)
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/${reviewId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: replyText.trim() }),
      })

      if (response.status === 401) {
        // Token inválido o expirado
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        showAlert('error', 'Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
        setTimeout(() => {
          setShowAuthDialog(true)
          setReplyingTo(null)
        }, 1500)
        return
      }

      if (response.ok) {
        showAlert('success', '¡Éxito!', 'Respuesta agregada exitosamente')
        setReplyingTo(null)
        setReplyText("")
        // Recargar las reseñas
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        showAlert('error', 'Error', errorData.detail || 'No se pudo agregar la respuesta')
      }
    } catch (error) {
      console.error("Error al enviar respuesta:", error)
      showAlert('error', 'Error', 'Error al enviar la respuesta')
    }
  }

  const handleDeleteReply = useCallback((reviewId: number, replyId: number) => {
    requireAuth(() => {
      showConfirm(
        '¿Eliminar respuesta?',
        '¿Estás seguro de que deseas eliminar esta respuesta?',
        async () => {
          try {
            const token = localStorage.getItem("token")
            
            if (!token) {
              showAlert('error', 'Sesión expirada', 'Por favor inicia sesión nuevamente')
              setShowAuthDialog(true)
              return
            }
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/${reviewId}/replies/${replyId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.status === 401) {
              // Token inválido o expirado
              localStorage.removeItem("token")
              localStorage.removeItem("user")
              showAlert('error', 'Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
              setTimeout(() => setShowAuthDialog(true), 1500)
              return
            }

            if (response.ok) {
              showAlert('success', 'Respuesta eliminada', 'La respuesta ha sido eliminada exitosamente')
              setTimeout(() => window.location.reload(), 1500)
            } else {
              showAlert('error', 'Error', 'No tienes permiso para eliminar esta respuesta')
            }
          } catch (error) {
            console.error("Error al eliminar respuesta:", error)
            showAlert('error', 'Error', 'Error al eliminar la respuesta')
          }
        }
      )
    })
  }, [requireAuth, showAlert, showConfirm, setShowAuthDialog])

  const handleReplyToReply = useCallback((reviewId: number, replyId: number) => {
    requireAuth(() => {
      setReplyingToReply({ reviewId, replyId })
      setNestedReplyText("")
    })
  }, [requireAuth])

  const handleSubmitNestedReply = useCallback(async () => {
    if (!replyingToReply) return
    
    if (!nestedReplyText.trim()) {
      showAlert('error', 'Error', 'Por favor escribe una respuesta')
      return
    }

    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        showAlert('error', 'Sesión expirada', 'Por favor inicia sesión nuevamente')
        setShowAuthDialog(true)
        return
      }
      
      const { reviewId, replyId } = replyingToReply
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/${reviewId}/replies/${replyId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply_text: nestedReplyText.trim() }),
      })

      if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        showAlert('error', 'Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
        setTimeout(() => {
          setShowAuthDialog(true)
          setReplyingToReply(null)
        }, 1500)
        return
      }

      if (response.ok) {
        showAlert('success', '¡Éxito!', 'Respuesta agregada exitosamente')
        setReplyingToReply(null)
        setNestedReplyText("")
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        showAlert('error', 'Error', errorData.detail || 'No se pudo agregar la respuesta')
      }
    } catch (error) {
      console.error("Error al enviar respuesta anidada:", error)
      showAlert('error', 'Error', 'Error al enviar la respuesta')
    }
  }, [replyingToReply, nestedReplyText, showAlert, setShowAuthDialog])

  const isOwnReview = (review: Review): boolean => {
    const userData = localStorage.getItem("user")
    if (!userData) return false
    
    try {
      const user = JSON.parse(userData)
      // Comparar como strings ya que user_id puede venir como string del backend
      return String(user.id) === String(review.user_id)
    } catch {
      return false
    }
  }

  const isOwnReply = useCallback((reply: Reply): boolean => {
    const userData = localStorage.getItem("user")
    if (!userData) return false
    
    try {
      const user = JSON.parse(userData)
      return String(user.id) === String(reply.user_id)
    } catch {
      return false
    }
  }, [])

  console.log("Render - showAuthDialog:", showAuthDialog)

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <main className={styles.loadingContainer}>
          <Loader2 className={styles.loadingSpinner} />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !activity) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <main className={styles.loadingContainer}>
          <div className={styles.errorContainer}>
            <p className={styles.errorTitle}>Error al cargar el negocio</p>
            <p className={styles.errorText}>{error || "No encontrado"}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.heroSection}
          style={{
            backgroundImage: activity.images && activity.images.length > 0 
              ? `url(${activity.images[0]})` 
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className={styles.heroOverlay} />

          {/* Botón Volver */}
          <div className={styles.backButtonContainer}>
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className={styles.backButton}
            >
              <ArrowLeft className={styles.backIcon} />
              Volver
            </Button>
          </div>

          {/* Contenido inferior (nombre, categoría, etc.) */}
          <div className={styles.heroContent}>
            <div className={styles.heroInner}>
              <Badge className={styles.categoryBadge}>{activity.category}</Badge>
              <h1 className={styles.heroTitle}>{activity.name}</h1>
              <div className={styles.heroInfo}>
                <div className={styles.ratingGroup}>
                  <Star className={styles.starIcon} />
                  <span className={styles.ratingText}>{activity.rating.toFixed(1)}</span>
                  <span className={styles.reviewCount}>({activity.review_count} reseñas)</span>
                </div>
                <div className={styles.priceGroup}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <DollarSign
                      key={i}
                      className={`${styles.dollarIcon} ${i < activity.price_level ? styles.dollarActive : styles.dollarInactive}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contentContainer}>
          <div className={styles.contentGrid}>
            {/* Main Content */}
            <div className={styles.mainColumn}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Acerca de</h2>
                <p className={styles.description}>{activity.description}</p>
                {activity.tags && activity.tags.length > 0 && (
                  <div className={styles.tagsContainer}>
                    {activity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos Section */}
              {activity.images && activity.images.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Fotos ({activity.images.length})</h2>
                  <div className={styles.photosGrid}>
                    {activity.images.map((image, index) => (
                      <div
                        key={index}
                        className={styles.photoItem}
                      >
                        <img
                          src={image}
                          alt={`${activity.name} - Foto ${index + 1}`}
                          className={styles.photoImage}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className={styles.section}>
                <div className={styles.reviewsHeader}>
                  <h2 className={styles.sectionTitle}>Reseñas ({reviews.length})</h2>
                  <Button onClick={handleAddReview} className={styles.addReviewButton}>
                    <Plus className={styles.addReviewIcon} />
                    Agregar Reseña
                  </Button>
                </div>
                
                {reviews.length > 0 ? (
                  <div className={styles.reviewsList}>
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className={styles.reviewCard}>
                          <div className={styles.reviewHeader}>
                            <div>
                              <h4 className={styles.reviewAuthor}>{review.user_name}</h4>
                              <p className={styles.reviewDate}>
                                {new Date(review.created_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className={styles.reviewRating}>
                              <Star className={styles.reviewStarIcon} />
                              <span className={styles.reviewRatingText}>{review.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <h3 className={styles.reviewTitle}>{review.title}</h3>
                          <p className={styles.reviewText}>{review.text}</p>
                          
                          {/* Replies Section */}
                          {review.replies && review.replies.length > 0 && (
                            <div className={styles.repliesContainer}>
                              {review.replies.map((reply) => (
                                <RenderReply 
                                  key={reply.id} 
                                  reply={reply} 
                                  reviewId={review.id}
                                  replyingToReply={replyingToReply}
                                  nestedReplyText={nestedReplyText}
                                  setNestedReplyText={setNestedReplyText}
                                  setReplyingToReply={setReplyingToReply}
                                  handleReplyToReply={handleReplyToReply}
                                  handleSubmitNestedReply={handleSubmitNestedReply}
                                  handleDeleteReply={handleDeleteReply}
                                  isOwnReply={isOwnReply}
                                  styles={styles}
                                />
                              ))}
                            </div>
                          )}

                          {/* Reply Form */}
                          {replyingTo === review.id && (
                            <div className={styles.replyForm}>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Escribe tu respuesta..."
                                className={styles.replyTextarea}
                                rows={3}
                                dir="ltr"
                                style={{ direction: 'ltr', textAlign: 'left' }}
                              />
                              <div className={styles.replyFormActions}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyText("")
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitReply(review.id)}
                                >
                                  Enviar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Review Actions */}
                          <div className={styles.reviewActions}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleReplyReview(review.id)}
                              className={styles.reviewActionButton}
                            >
                              <Reply className={styles.actionIcon} />
                              Responder
                            </Button>
                            
                            {isOwnReview(review) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteReview(review.id)}
                                className={`${styles.reviewActionButton} ${styles.deleteButton}`}
                              >
                                <Trash2 className={styles.actionIcon} />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className={styles.emptyReviews}>
                      <MessageSquare className={styles.emptyIcon} />
                      <p className={styles.emptyText}>
                        Aún no hay reseñas para este lugar.
                      </p>
                      <Button onClick={handleAddReview} variant="outline">
                        Sé el primero en dejar una reseña
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              <Card>
                <CardContent className={styles.sidebarCard}>
                  <div className={styles.sidebarButtons}>
                    <Button onClick={handleReserve} className={styles.buttonFull} size="lg">
                      <Calendar className={styles.buttonIcon} />
                      Reservar Ahora
                    </Button>
                    <Button onClick={handleSaveToTrip} variant="outline" className={styles.buttonFull} size="lg">
                      <Heart className={styles.buttonIcon} />
                      Guardar en Viaje
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className={styles.contactSection}>
                  <h3 className={styles.contactTitle}>Información de Contacto</h3>
                  <div className={styles.contactList}>
                    <div className={styles.contactItem}>
                      <MapPin className={styles.contactIcon} />
                      <span>
                        {activity.location.address}, {activity.location.city}, {activity.location.state}, {activity.location.country}
                      </span>
                    </div>
                    {activity.phone && (
                      <div className={styles.contactItem}>
                        <Phone className={styles.contactIcon} />
                        <span>{activity.phone}</span>
                      </div>
                    )}
                    {activity.website && (
                      <div className={styles.contactItem}>
                        <Globe className={styles.contactIcon} />
                        <a href={activity.website} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                          Visitar Sitio Web
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Reseña</DialogTitle>
          </DialogHeader>
          <ReviewForm
            businessId={id}
            businessName={activity?.name || ""}
            onSubmit={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
            showCard={false}
          />
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <AuthRequiredDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />

      {/* Alert/Confirm Dialog */}
      <Dialog open={alertDialog.open} onOpenChange={closeAlert}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              {alertDialog.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {alertDialog.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {alertDialog.type === 'confirm' && <AlertCircle className="h-5 w-5 text-amber-600" />}
              <DialogTitle>{alertDialog.title}</DialogTitle>
            </div>
            <DialogDescription>
              {alertDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {alertDialog.type === 'confirm' ? (
              <>
                <Button variant="outline" onClick={closeAlert}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    alertDialog.onConfirm?.()
                    closeAlert()
                  }}
                >
                  Confirmar
                </Button>
              </>
            ) : (
              <Button onClick={closeAlert}>
                Aceptar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
