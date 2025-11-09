"use client"

import { use, useEffect, useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Star, MapPin, Phone, Globe, DollarSign, Calendar, Heart, Loader2, ArrowLeft, Plus, MessageSquare, Trash2, Reply, AlertCircle, CheckCircle2, Tag } from "lucide-react"
import { AuthRequiredDialog } from "@/components/auth-required-dialog"
import { ReviewForm } from "@/components/review-form"
import { PromotionCard } from "@/components/promotion-card"
import { useAuthRequired } from "@/lib/hooks/use-auth-required"
import styles from "./page.module.css"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Business {
  id: number
  name: string
  description: string
  categories: string[]  // Cambiado de category: string a categories: string[]
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
  allows_bookings: boolean
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

interface Promotion {
  id: number
  title: string
  description: string
  discount_percentage?: number
  discount_amount?: number
  code?: string
  start_date: string
  end_date: string
  terms_conditions?: string
  current_uses: number
  max_uses?: number
  min_purchase?: number
  is_active: boolean
  business_id: number
}

// Componente recursivo para renderizar respuestas (fuera del componente principal)
const RenderReply = memo(({ 
  reply, 
  reviewId, 
  depth = 0,
  parentKey = '',
  replyingToReply,
  nestedReplyTexts,
  setNestedReplyTexts,
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
  parentKey?: string
  replyingToReply: string | null
  nestedReplyTexts: Record<string, string>
  setNestedReplyTexts: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
  setReplyingToReply: (value: string | null) => void
  handleReplyToReply: (reviewId: number, replyId: number, uniqueKey: string) => void
  handleSubmitNestedReply: (uniqueKey: string, reviewId: number, replyId: number) => void
  handleDeleteReply: (reviewId: number, replyId: number) => void
  isOwnReply: (reply: Reply) => boolean
  styles: any
}) => {
  const uniqueKey = parentKey ? `${parentKey}-${reply.id}` : `${reviewId}-${reply.id}`
  // Usar uniqueKey en lugar de replyKey simple para evitar colisiones
  const replyKey = uniqueKey
  const currentText = nestedReplyTexts[replyKey] || ""
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
          onClick={() => handleReplyToReply(reviewId, reply.id, uniqueKey)}
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
      {replyingToReply === uniqueKey && (
        <div className={styles.replyForm} style={{ marginTop: '10px' }}>
          <textarea
            key={uniqueKey}
            value={currentText}
            onChange={(e) => setNestedReplyTexts(prev => ({
              ...prev,
              [replyKey]: e.target.value
            }))}
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
                setNestedReplyTexts(prev => {
                  const newTexts = { ...prev }
                  delete newTexts[replyKey]
                  return newTexts
                })
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmitNestedReply(uniqueKey, reviewId, reply.id)}
            >
              Enviar
            </Button>
          </div>
        </div>
      )}

      {/* Render nested replies recursively */}
      {reply.replies && reply.replies.length > 0 && (
        <div className={styles.nestedRepliesContainer}>
          {reply.replies.map((nestedReply, index) => (
            <RenderReply 
              key={`${uniqueKey}-${index}-${nestedReply.id}`}
              reply={nestedReply} 
              reviewId={reviewId}
              depth={depth + 1}
              parentKey={`${uniqueKey}-${index}`}
              replyingToReply={replyingToReply}
              nestedReplyTexts={nestedReplyTexts}
              setNestedReplyTexts={setNestedReplyTexts}
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
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const { showAuthDialog, setShowAuthDialog, requireAuth } = useAuthRequired()
  
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyingToReply, setReplyingToReply] = useState<string | null>(null)
  const [nestedReplyTexts, setNestedReplyTexts] = useState<Record<string, string>>({})
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set())
  const [openBookingDialog, setOpenBookingDialog] = useState(false)
  const [bookingName, setBookingName] = useState("")
  const [bookingAmount, setBookingAmount] = useState("1") // Default 1 person
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("")
  const [bookingPromoCode, setBookingPromoCode] = useState("")
  const [availablePromoCodes, setAvailablePromoCodes] = useState<any[]>([])
  const [isLoadingPromoCodes, setIsLoadingPromoCodes] = useState(false)
  
  // Save to Trip dialog
  const [openSaveToTripDialog, setOpenSaveToTripDialog] = useState(false)
  const [userTrips, setUserTrips] = useState<any[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [tripNotes, setTripNotes] = useState("")
  const [tripScheduledDate, setTripScheduledDate] = useState("")
  const [isLoadingTrips, setIsLoadingTrips] = useState(false)
  const [isSavingToTrip, setIsSavingToTrip] = useState(false)
  
  // Favorites
  const [isFavorite, setIsFavorite] = useState(false)
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  
  // Promotion creation dialog
  const [openPromotionDialog, setOpenPromotionDialog] = useState(false)
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isBusinessUser, setIsBusinessUser] = useState(false)
  const [promotionForm, setPromotionForm] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    code: "",
    startDate: "",
    endDate: "",
    termsConditions: "",
    maxUses: "",
    minPurchase: "",
  })

  // Minimum booking date (local timezone) formatted as YYYY-MM-DD for the date input
  const minBookingDate = (() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })()

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
        
        // Check if current user is the owner
        const userData = localStorage.getItem("user")
        if (userData) {
          try {
            const user = JSON.parse(userData)
            if (user.role === "business") {
              setIsBusinessUser(true)
              if (String(user.id) === String(data.owner_id)) {
                setIsOwner(true)
              }
            }
          } catch (e) {
            console.error("Error parsing user data:", e)
          }
        }

        // Fetch reviews - ruta correcta
        const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/business/${resolvedParams.id}`)
        console.log("Fetching reviews from:", `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/business/${resolvedParams.id}`)

        // Fetch promotions
        const promotionsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/promotions?business_id=${resolvedParams.id}&active_only=true`)
        console.log("Fetching promotions from:", `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/promotions?business_id=${resolvedParams.id}&active_only=true`)
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          console.log("Reviews recibidas:", reviewsData)
          setReviews(reviewsData)
        } else {
          console.error("Error al obtener reseñas:", reviewsResponse.status)
        }

        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json()
          console.log("Promociones recibidas:", promotionsData)
          setPromotions(promotionsData)
        } else {
          console.error("Error al obtener promociones:", promotionsResponse.status)
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

  // Check if business is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      const token = localStorage.getItem("token")
      if (!token || !activity) return

      setIsCheckingFavorite(true)
      try {
        const response = await fetch(`/api/favorites/check/${activity.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setIsFavorite(data.is_favorite)
        }
      } catch (err) {
        console.error("Error checking favorite:", err)
      } finally {
        setIsCheckingFavorite(false)
      }
    }

    checkFavorite()
  }, [activity])

  const handleToggleFavorite = async () => {
    requireAuth(async () => {
      if (!activity) return

      setIsTogglingFavorite(true)
      try {
        const token = localStorage.getItem("token")
        
        if (isFavorite) {
          // Remove from favorites
          const response = await fetch(`/api/favorites/${activity.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok || response.status === 204) {
            setIsFavorite(false)
            showAlert('success', 'Eliminado', 'Se eliminó de tus destinos de interés')
          } else {
            const error = await response.json()
            showAlert('error', 'Error', error.detail || 'No se pudo eliminar de favoritos')
          }
        } else {
          // Add to favorites
          const response = await fetch(`/api/favorites`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              business_id: activity.id,
            }),
          })

          if (response.ok) {
            setIsFavorite(true)
            showAlert('success', '¡Guardado!', 'Se agregó a tus destinos de interés')
          } else {
            const error = await response.json()
            showAlert('error', 'Error', error.detail || 'No se pudo agregar a favoritos')
          }
        }
      } catch (err) {
        console.error("Error toggling favorite:", err)
        showAlert('error', 'Error', 'Error al actualizar favoritos')
      } finally {
        setIsTogglingFavorite(false)
      }
    })
  }

  const handleBook = () => {
    console.log("handleBook clicked")
    requireAuth(async () => {
      // Load available promo codes when opening booking dialog
      await fetchAvailablePromoCodes()
      setOpenBookingDialog(true);
    })
  }

  const fetchAvailablePromoCodes = async () => {
    try {
      setIsLoadingPromoCodes(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        console.log("No token found, skipping promo code fetch")
        setAvailablePromoCodes([])
        return
      }
      
      const response = await fetch(`/api/promotions/available/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Available promo codes fetched:", data.length, "codes")
        setAvailablePromoCodes(data)
      } else {
        // Don't log error for 404 or when user simply has no codes
        if (response.status !== 404 && response.status !== 401) {
          const errorData = await response.json().catch(() => ({}))
          console.warn("Could not fetch promo codes:", response.status, errorData)
        }
        setAvailablePromoCodes([])
      }
    } catch (err) {
      console.error("Error fetching available promo codes:", err)
      setAvailablePromoCodes([])
    } finally {
      setIsLoadingPromoCodes(false)
    }
  }

  const closeReserve = () => {
    setOpenBookingDialog(false)
    setBookingPromoCode("")
  }

  const handleSaveToTrip = () => {
    console.log("handleSaveToTrip clicked")
    requireAuth(async () => {
      // Fetch user's trips
      setIsLoadingTrips(true)
      setOpenSaveToTripDialog(true)
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/trips/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        
        if (response.ok) {
          const trips = await response.json()
          setUserTrips(trips)
        } else {
          showAlert('error', 'Error', 'No se pudieron cargar tus viajes')
          setUserTrips([])
        }
      } catch (err) {
        console.error("Error fetching trips:", err)
        showAlert('error', 'Error', 'Error al cargar los viajes')
        setUserTrips([])
      } finally {
        setIsLoadingTrips(false)
      }
    })
  }

  const handleConfirmSaveToTrip = async () => {
    if (!selectedTripId) {
      showAlert('error', 'Selecciona un viaje', 'Por favor selecciona un viaje')
      return
    }

    if (!activity) return

    setIsSavingToTrip(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/trips/${selectedTripId}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            business_id: activity.id.toString(),
            business_name: activity.name,
            scheduled_date: tripScheduledDate || null,
            notes: tripNotes || null,
          }),
        }
      )

      if (response.ok) {
        showAlert('success', '¡Guardado!', 'La actividad se guardó en tu viaje')
        setOpenSaveToTripDialog(false)
        setSelectedTripId("")
        setTripNotes("")
        setTripScheduledDate("")
      } else {
        const error = await response.json()
        showAlert('error', 'Error', error.detail || 'No se pudo guardar en el viaje')
      }
    } catch (err) {
      console.error("Error saving to trip:", err)
      showAlert('error', 'Error', 'Error al guardar en el viaje')
    } finally {
      setIsSavingToTrip(false)
    }
  }

  const handleAddReview = () => {
    console.log("handleAddReview clicked")
    requireAuth(() => {
      console.log("Agregar reseña - Usuario autenticado")
      setShowReviewForm(true)
    })
  }

  const handleClaimPromotion = async (promotionId: number) => {
    console.log("handleClaimPromotion clicked for promotion:", promotionId)
    requireAuth(async () => {
      try {
        const token = localStorage.getItem("token")
        
        if (!token) {
          showAlert('error', 'Sesión requerida', 'Debes iniciar sesión para reclamar una promoción')
          setShowAuthDialog(true)
          return
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/promotions/${promotionId}/claim`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          showAlert('error', 'Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
          setTimeout(() => setShowAuthDialog(true), 1500)
          return
        }

        if (response.ok) {
          const data = await response.json()
          showAlert('success', '¡Promoción reclamada!', 'La promoción ha sido agregada a tu cuenta. Puedes verla en tu perfil.')
          
          // Actualizar el conteo de usos
          setPromotions(prev => prev.map(p => 
            p.id === promotionId 
              ? { ...p, current_uses: p.current_uses + 1 }
              : p
          ))
        } else {
          const errorData = await response.json()
          showAlert('error', 'Error', errorData.detail || 'No se pudo reclamar la promoción')
        }
      } catch (error) {
        console.error("Error al reclamar promoción:", error)
        showAlert('error', 'Error', 'Error al reclamar la promoción')
      }
    })
  }

  const handleCreatePromotion = async () => {
    if (!activity) return
    
    setIsCreatingPromotion(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        showAlert('error', 'Sesión requerida', 'Debes iniciar sesión para crear una promoción')
        setShowAuthDialog(true)
        return
      }

      const promotionData: any = {
        title: promotionForm.title,
        description: promotionForm.description || undefined,
        start_date: promotionForm.startDate,
        end_date: promotionForm.endDate,
        terms_conditions: promotionForm.termsConditions || undefined,
        code: promotionForm.code || undefined,
        max_uses: promotionForm.maxUses ? parseInt(promotionForm.maxUses) : undefined,
        min_purchase: promotionForm.minPurchase ? parseFloat(promotionForm.minPurchase) : undefined,
      }

      if (promotionForm.discountType === "percentage") {
        promotionData.discount_percentage = parseInt(promotionForm.discountValue)
      } else {
        promotionData.discount_amount = parseFloat(promotionForm.discountValue)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/promotions?business_id=${activity.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(promotionData),
        }
      )

      if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        showAlert('error', 'Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
        setTimeout(() => setShowAuthDialog(true), 1500)
        return
      }

      if (response.ok) {
        const newPromotion = await response.json()
        showAlert('success', '¡Promoción creada!', 'La promoción ha sido creada exitosamente.')
        setOpenPromotionDialog(false)
        setPromotionForm({
          title: "",
          description: "",
          discountType: "percentage",
          discountValue: "",
          code: "",
          startDate: "",
          endDate: "",
          termsConditions: "",
          maxUses: "",
          minPurchase: "",
        })
        // Agregar la nueva promoción a la lista
        setPromotions(prev => [...prev, newPromotion])
      } else {
        const errorData = await response.json()
        showAlert('error', 'Error', errorData.detail || 'Error al crear la promoción')
      }
    } catch (error) {
      console.error("Error creating promotion:", error)
      showAlert('error', 'Error', 'Error al crear la promoción')
    } finally {
      setIsCreatingPromotion(false)
    }
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

  const handleReplyToReply = useCallback((reviewId: number, replyId: number, uniqueKey: string) => {
    requireAuth(() => {
      setReplyingToReply(uniqueKey)
    })
  }, [requireAuth])

  const handleSubmitNestedReply = useCallback(async (uniqueKey: string, reviewId: number, replyId: number) => {
    if (!replyingToReply) return
    
    const currentText = nestedReplyTexts[uniqueKey] || ""
    
    if (!currentText.trim()) {
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/reviews/${reviewId}/replies/${replyId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply_text: currentText.trim() }),
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
        // Limpiar solo el texto de esta respuesta específica
        setNestedReplyTexts(prev => {
          const newTexts = { ...prev }
          delete newTexts[uniqueKey]
          return newTexts
        })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        showAlert('error', 'Error', errorData.detail || 'No se pudo agregar la respuesta')
      }
    } catch (error) {
      console.error("Error al enviar respuesta anidada:", error)
      showAlert('error', 'Error', 'Error al enviar la respuesta')
    }
  }, [replyingToReply, nestedReplyTexts, showAlert, setShowAuthDialog])

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

  const toggleRepliesExpanded = (reviewId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const getTotalReplyCount = (replies: Reply[]): number => {
    let count = replies.length
    replies.forEach(reply => {
      if (reply.replies && reply.replies.length > 0) {
        count += getTotalReplyCount(reply.replies)
      }
    })
    return count
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        showAlert('error', 'Sesión expirada', 'Por favor inicia sesión nuevamente')
        setShowAuthDialog(true)
        return
      }

      const bookingPayload = {
        name: bookingName,
        amount: parseInt(bookingAmount) || 1, // Default to 1 if empty
        date: bookingDate,
        time: bookingTime.includes(':') && bookingTime.split(':').length === 2 
          ? `${bookingTime}:00` 
          : bookingTime, // Add seconds if not present
        ...(bookingPromoCode && { promotion_code: bookingPromoCode })
      }

      console.log('Booking payload:', JSON.stringify(bookingPayload, null, 2))
      
      const response = await fetch(`/api/businesses/${id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Error al realizar reserva")
      }

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
        showAlert('success', '¡Éxito!', 'La reserva se ha realizado correctamente')
        closeReserve()
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        showAlert('error', 'Error', errorData.detail || 'No se pudo realizar la reserva')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

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
              <Badge className={styles.categoryBadge}>{activity.categories && activity.categories.length > 0 ? activity.categories[0] : 'Sin categoría'}</Badge>
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
                          {review.replies && review.replies.length >= 2 && (
                            <div className={styles.repliesToggleContainer}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRepliesExpanded(review.id)}
                                className={styles.repliesToggleButton}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {expandedReplies.has(review.id) 
                                  ? 'Ocultar respuestas' 
                                  : `Ver ${getTotalReplyCount(review.replies)} respuestas`
                                }
                              </Button>
                            </div>
                          )}

                          {review.replies && review.replies.length > 0 && (review.replies.length < 2 || expandedReplies.has(review.id)) && (
                            <div className={styles.repliesContainer}>
                              {review.replies.map((reply, index) => (
                                <RenderReply 
                                  key={`review-${review.id}-reply-${index}-${reply.id}`}
                                  reply={reply} 
                                  reviewId={review.id}
                                  parentKey={`review-${review.id}-${index}`}
                                  replyingToReply={replyingToReply}
                                  nestedReplyTexts={nestedReplyTexts}
                                  setNestedReplyTexts={setNestedReplyTexts}
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
                    {activity.allows_bookings && (
                      <Button onClick={handleBook} className={styles.buttonFull} size="lg">
                        <Calendar className={styles.buttonIcon} />
                        Reservar Ahora
                      </Button>
                    )}
                    <Button 
                      onClick={handleSaveToTrip} 
                      variant="outline" 
                      className={styles.buttonFull} 
                      size="lg"
                    >
                      <Plus className={styles.buttonIcon} />
                      Guardar en Viaje
                    </Button>
                    <Button 
                      onClick={handleToggleFavorite} 
                      variant={isFavorite ? "default" : "outline"}
                      className={styles.buttonFull} 
                      size="lg"
                      disabled={isTogglingFavorite || isCheckingFavorite}
                    >
                      {isTogglingFavorite || isCheckingFavorite ? (
                        <>
                          <Loader2 className={`${styles.buttonIcon} animate-spin`} />
                          {isFavorite ? "Guardando..." : "Guardando..."}
                        </>
                      ) : (
                        <>
                          <Heart className={`${styles.buttonIcon} ${isFavorite ? 'fill-current' : ''}`} />
                          {isFavorite ? "Guardado en Favoritos" : "Guardar como Favorito"}
                        </>
                      )}
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

              {/* Promotions Section */}
              <Card>
                <CardContent className={styles.contactSection}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 className={styles.contactTitle}>
                        Promociones ({promotions.length})
                      </h3>
                    </div>
                    {isOwner && (
                      <Button onClick={() => setOpenPromotionDialog(true)} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Crear
                      </Button>
                    )}
                  </div>
                  {promotions.length > 0 ? (
                    <div className="space-y-4">
                      {promotions.map((promotion) => (
                        <PromotionCard
                          key={promotion.id}
                          id={promotion.id}
                          title={promotion.title}
                          description={promotion.description}
                          discountPercentage={promotion.discount_percentage}
                          discountAmount={promotion.discount_amount}
                          code={promotion.code}
                          startDate={promotion.start_date}
                          endDate={promotion.end_date}
                          termsConditions={promotion.terms_conditions}
                          currentUses={promotion.current_uses}
                          maxUses={promotion.max_uses}
                          minPurchase={promotion.min_purchase}
                          isActive={promotion.is_active}
                          onClaim={isBusinessUser ? undefined : handleClaimPromotion}
                          showActions={true}
                          compact={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {isOwner 
                        ? "No hay promociones. ¡Crea una para atraer clientes!"
                        : "Sin promociones activas."
                      }
                    </div>
                  )}
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

      {/* Create Promotion Dialog */}
      <Dialog open={openPromotionDialog} onOpenChange={setOpenPromotionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Promoción</DialogTitle>
            <DialogDescription>
              Completa los detalles de la promoción que deseas ofrecer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="promo-title">Título de la Promoción *</Label>
              <Input
                id="promo-title"
                value={promotionForm.title}
                onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                placeholder="Ej: Descuento de Verano"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-description">Descripción (opcional)</Label>
              <Textarea
                id="promo-description"
                value={promotionForm.description}
                onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                placeholder="Describe los detalles de la promoción"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-discountType">Tipo de Descuento *</Label>
                <Select
                  value={promotionForm.discountType}
                  onValueChange={(value) => setPromotionForm({ ...promotionForm, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="amount">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-discountValue">
                  Valor del Descuento * {promotionForm.discountType === "percentage" ? "(%)" : "($)"}
                </Label>
                <Input
                  id="promo-discountValue"
                  type="number"
                  value={promotionForm.discountValue}
                  onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: e.target.value })}
                  placeholder={promotionForm.discountType === "percentage" ? "10" : "50"}
                  min="0"
                  max={promotionForm.discountType === "percentage" ? "100" : undefined}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-code">Código Promocional (opcional)</Label>
              <Input
                id="promo-code"
                value={promotionForm.code}
                onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value.toUpperCase() })}
                placeholder="VERANO2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-startDate">Fecha de Inicio *</Label>
                <Input
                  id="promo-startDate"
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                  min={minBookingDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-endDate">Fecha de Fin *</Label>
                <Input
                  id="promo-endDate"
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                  min={promotionForm.startDate || minBookingDate}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-maxUses">Máximo de Usos (opcional)</Label>
                <Input
                  id="promo-maxUses"
                  type="number"
                  value={promotionForm.maxUses}
                  onChange={(e) => setPromotionForm({ ...promotionForm, maxUses: e.target.value })}
                  placeholder="100"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-minPurchase">Compra Mínima $ (opcional)</Label>
                <Input
                  id="promo-minPurchase"
                  type="number"
                  value={promotionForm.minPurchase}
                  onChange={(e) => setPromotionForm({ ...promotionForm, minPurchase: e.target.value })}
                  placeholder="50.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-termsConditions">Términos y Condiciones (opcional)</Label>
              <Textarea
                id="promo-termsConditions"
                value={promotionForm.termsConditions}
                onChange={(e) => setPromotionForm({ ...promotionForm, termsConditions: e.target.value })}
                placeholder="Especifica las condiciones de uso de la promoción"
                rows={3}
              />
            </div>

            <Button 
              onClick={handleCreatePromotion} 
              disabled={
                isCreatingPromotion || 
                !promotionForm.title || 
                !promotionForm.discountValue || 
                !promotionForm.startDate || 
                !promotionForm.endDate
              } 
              className="w-full"
            >
              {isCreatingPromotion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Promoción"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={openBookingDialog} onOpenChange={closeReserve}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservar en {activity.name}</DialogTitle>
            <DialogDescription>Ingrese los datos para realizar la reserva</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan"
                value={bookingName}
                onChange={(e) => setBookingName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Cantidad de Personas</Label>
              <Input
                id="amount"
                type="number"
                placeholder="2"
                value={bookingAmount}
                onChange={(e) => setBookingAmount(e.target.value)}
                required
                min={1}
                max={12}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={minBookingDate} // fecha mínima hoy
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                min="09:00" // fecha mínima hoy (zona horaria local)
                max="21:00"
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promoCode">Código Promocional (opcional)</Label>
              {isLoadingPromoCodes ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Cargando códigos...</span>
                </div>
              ) : availablePromoCodes.length > 0 ? (
                <>
                  <Select
                    value={bookingPromoCode || "NONE"}
                    onValueChange={(value) => setBookingPromoCode(value === "NONE" ? "" : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="promoCode" className="w-full">
                      <SelectValue placeholder="Selecciona un código promocional" />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start" sideOffset={5} className="w-full">
                      <SelectItem value="NONE">Sin código promocional</SelectItem>
                      {availablePromoCodes.map((promo) => (
                        <SelectItem key={promo.id} value={promo.code}>
                          {promo.code} - {promo.discount_percentage}% OFF
                          {promo.title && ` (${promo.title})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecciona uno de tus códigos promocionales disponibles
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No tienes códigos promocionales disponibles para este negocio.
                  {promotions.length > 0 && " Reclama uno en la sección de promociones."}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            onClick={handleBookingSubmit}
          >
            Reservar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Save to Trip Dialog */}
      <Dialog open={openSaveToTripDialog} onOpenChange={setOpenSaveToTripDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar en Viaje</DialogTitle>
            <DialogDescription>
              Agrega esta actividad a uno de tus viajes planificados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoadingTrips ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userTrips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No tienes viajes creados aún
                </p>
                <Button
                  onClick={() => {
                    setOpenSaveToTripDialog(false)
                    router.push("/trips/new")
                  }}
                  variant="outline"
                >
                  Crear mi primer viaje
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="trip-select">Selecciona un viaje *</Label>
                  <Select
                    value={selectedTripId}
                    onValueChange={setSelectedTripId}
                  >
                    <SelectTrigger id="trip-select">
                      <SelectValue placeholder="Elige un viaje" />
                    </SelectTrigger>
                    <SelectContent>
                      {userTrips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id.toString()}>
                          {trip.name} - {trip.destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trip-date">Fecha programada (opcional)</Label>
                  <Input
                    id="trip-date"
                    type="date"
                    value={tripScheduledDate}
                    onChange={(e) => setTripScheduledDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trip-notes">Notas (opcional)</Label>
                  <Textarea
                    id="trip-notes"
                    value={tripNotes}
                    onChange={(e) => setTripNotes(e.target.value)}
                    placeholder="Ej: Reservar con anticipación, ir temprano..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          {userTrips.length > 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenSaveToTripDialog(false)
                  setSelectedTripId("")
                  setTripNotes("")
                  setTripScheduledDate("")
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSaveToTrip}
                disabled={!selectedTripId || isSavingToTrip}
              >
                {isSavingToTrip ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
