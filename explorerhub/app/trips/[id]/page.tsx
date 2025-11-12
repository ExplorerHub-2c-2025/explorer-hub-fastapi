"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Calendar, Edit, Share2, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import ItineraryBuilder from "@/components/itinerary-builder"
import { ActivitySearchModal } from "@/components/activity-search-modal"
import { authFetch } from "@/lib/api"
import styles from "./page.module.css"

interface TripActivity {
  business_id: string
  business_name: string
  scheduled_date?: string
  notes?: string
}

interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  description?: string
  activities: TripActivity[]
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showActivitySearch, setShowActivitySearch] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    type: 'success' | 'error' | 'confirm' | 'info'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    open: false,
    type: 'success',
    title: '',
    message: ''
  })

  useEffect(() => {
    loadTrip()
  }, [resolvedParams.id])

  const loadTrip = async () => {
    try {
      const data = await authFetch(`http://localhost:8000/api/trips/${resolvedParams.id}`)
      setTrip(data)
    } catch (error) {
      console.error("Error loading trip:", error)
      showAlert('error', 'Error', 'Error al cargar el viaje')
      router.push("/trips")
    } finally {
      setIsLoading(false)
    }
  }

  const showAlert = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setAlertDialog({ open: true, type, title, message })
  }

  const closeAlert = () => {
    setAlertDialog({ ...alertDialog, open: false })
  }

  const handleAddActivity = () => {
    // Show activity search modal instead of navigating away
    setShowActivitySearch(true)
  }

  const handleActivityAdded = (business: any) => {
    // Reload trip data
    loadTrip()
    setShowActivitySearch(false)
  }

  const handleRemoveActivity = async (businessId: string) => {
    if (!trip) return
    
    try {
      await authFetch(`http://localhost:8000/api/trips/${trip.id}/activities/${businessId}`, {
        method: "DELETE",
      })
      
      // Reload trip data
      loadTrip()
    } catch (error) {
      console.error("Error removing activity:", error)
      showAlert('error', 'Error', 'Error al eliminar la actividad')
    }
  }

  const handleDeleteTrip = async () => {
    if (!trip) return
    
    setAlertDialog({
      open: true,
      type: 'confirm',
      title: 'Eliminar viaje',
      message: '¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await authFetch(`http://localhost:8000/api/trips/${trip.id}`, {
            method: "DELETE",
          })
          
          showAlert('success', 'Viaje eliminado', 'El viaje ha sido eliminado exitosamente')
          router.push("/trips")
        } catch (error) {
          console.error("Error deleting trip:", error)
          showAlert('error', 'Error', 'No se pudo eliminar el viaje')
        }
      }
    })
  }

  const handleUpdateSchedule = (businessId: string, date: Date) => {
    // This would require a backend endpoint to update individual activities
    console.log("Update schedule:", businessId, date)
    // For now, we'll just update locally
    if (!trip) return
    
    setTrip({
      ...trip,
      activities: trip.activities.map((a) =>
        a.business_id === businessId ? { ...a, scheduled_date: date.toISOString() } : a
      ),
    })
  }

  const handleUpdateNotes = (businessId: string, notes: string) => {
    if (!trip) return
    
    setTrip({
      ...trip,
      activities: trip.activities.map((a) =>
        a.business_id === businessId ? { ...a, notes } : a
      ),
    })
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    )
  }

  if (!trip) {
    return null
  }

  const formattedActivities = trip.activities.map((activity) => ({
    id: activity.business_id,
    business_id: activity.business_id,
    business_name: activity.business_name,
    categories: [], // Categories would come from business data
    scheduled_date: activity.scheduled_date ? new Date(activity.scheduled_date) : undefined,
    notes: activity.notes,
  }))

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <Link href="/trips">
          <Button variant="ghost" className={styles.backButton}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Viajes
          </Button>
        </Link>

        <div className={styles.contentGrid}>
          {/* Main Content */}
          <div className={styles.mainSection}>
            <div>
              <div className={styles.tripHeader}>
                <div className={styles.tripInfo}>
                  <h1 className={styles.tripTitle}>{trip.name}</h1>
                  <div className={styles.tripMeta}>
                    <div className={styles.tripMetaItem}>
                      <MapPin className="h-4 w-4" />
                      <span>{trip.destination}</span>
                    </div>
                    <div className={styles.tripMetaItem}>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(trip.start_date), "MMM d")} - {format(new Date(trip.end_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.actionButtons}>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/trips/${trip.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => showAlert('info', 'Próximamente', 'Función de compartir próximamente')}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteTrip} className="hover:bg-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>

              {trip.description && <p className={styles.tripDescription}>{trip.description}</p>}
            </div>

            <ItineraryBuilder
              activities={formattedActivities}
              onAddActivity={handleAddActivity}
              onRemoveActivity={handleRemoveActivity}
              onUpdateSchedule={handleUpdateSchedule}
              onUpdateNotes={handleUpdateNotes}
            />
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <Card>
              <CardContent className={styles.cardContent}>
                <h3 className={styles.sectionTitle}>Resumen del Viaje</h3>
                <div className={styles.tripSummary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Duración</span>
                    <span className={styles.summaryValue}>
                      {Math.ceil(
                        (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      días
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Actividades</span>
                    <span className={styles.summaryValue}>{trip.activities.length}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Destino</span>
                    <span className={styles.summaryValue}>{trip.destination}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={styles.cardContent}>
                <h3 className={styles.sectionTitle}>Recomendaciones</h3>
                <p className={styles.recommendationsText}>
                  Basado en tu itinerario, también te podrían gustar estas experiencias:
                </p>
                <div className={styles.recommendationsList}>
                  <Link href="/explore">
                    <div className={styles.recommendationItem}>
                      <h4 className={styles.recommendationTitle}>Explorar más actividades</h4>
                      <p className={styles.recommendationDescription}>Descubre nuevas experiencias</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Activity Search Modal */}
      <ActivitySearchModal
        isOpen={showActivitySearch}
        onClose={() => setShowActivitySearch(false)}
        onAddActivity={handleActivityAdded}
        tripId={trip?.id || ""}
      />

      {/* Alert Dialog */}
      <Dialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {alertDialog.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {alertDialog.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {alertDialog.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
              {alertDialog.title}
            </DialogTitle>
            <DialogDescription>
              {alertDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {alertDialog.type === 'confirm' ? (
              <>
                <Button variant="outline" onClick={() => setAlertDialog(prev => ({ ...prev, open: false }))}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  className="destructiveButton hover:!bg-[#dc2626] hover:!border-[#dc2626]"
                  onClick={() => {
                    alertDialog.onConfirm?.()
                    setAlertDialog(prev => ({ ...prev, open: false }))
                  }}
                >
                  Confirmar
                </Button>
              </>
            ) : (
              <Button onClick={() => setAlertDialog(prev => ({ ...prev, open: false }))}>
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
