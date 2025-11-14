"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import styles from "./page.module.css"
import { authFetch } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  description?: string
  activities: any[]
}

export default function TripsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
    loadTrips()
  }, [router])

  const loadTrips = async () => {
    try {
      const data = await authFetch("http://localhost:8000/api/trips/")
      setTrips(data)
    } catch (error) {
      console.error("Error loading trips:", error)
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

  const handleDeleteTrip = async (tripId: string, event: React.MouseEvent) => {
    event.preventDefault() // Prevent navigation to trip detail page
    
    setAlertDialog({
      open: true,
      type: 'confirm',
      title: 'Eliminar viaje',
      message: '¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await authFetch(`http://localhost:8000/api/trips/${tripId}`, {
            method: "DELETE",
          })
          
          // Reload trips list
          loadTrips()
          showAlert('success', 'Viaje eliminado', 'El viaje ha sido eliminado exitosamente')
        } catch (error) {
          console.error("Error deleting trip:", error)
          showAlert('error', 'Error', 'No se pudo eliminar el viaje')
        }
      }
    })
  }

  if (!isAuthorized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.headerSection}>
          <div className={styles.headerText}>
            <h1>Viajes</h1>
            <p>Planifica y organiza tus aventuras de viaje</p>
          </div>
          <Link href="/trips/new">
            <Button className={styles.createButton}>
              <Plus className={styles.buttonIcon} />
              Crear Viaje
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : trips.length === 0 ? (
          <Card className={styles.emptyState}>
            <CardContent>
              <div className={styles.emptyStateContent}>
                <MapPin className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Aún no tienes viajes</h3>
                <p className={styles.emptyText}>
                  Comienza a planificar tu próxima aventura creando tu primer viaje
                </p>
                <Link href="/trips/new">
                  <Button className={styles.createFirstTripButton}>
                    <Plus className={styles.buttonIcon} />
                    Crear Tu Primer Viaje
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.tripsGrid}>
            {trips.map((trip) => (
              <div key={trip.id} className={styles.tripCardContainer}>
                <Link href={`/trips/${trip.id}`}>
                  <Card className={styles.tripCard}>
                    <div className={styles.tripImage}>
                      <img
                        src="/placeholder.svg"
                        alt={trip.name}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteTrip(trip.id, e)
                        }}
                      >
                        <Trash2 className={styles.deleteIcon} />
                      </Button>
                    </div>
                    <CardHeader>
                      <CardTitle>{trip.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={styles.tripContent}>
                        <div className={styles.tripInfo}>
                          <MapPin className={styles.infoIcon} />
                          <span>{trip.destination}</span>
                        </div>
                        <div className={styles.tripInfo}>
                          <Calendar className={styles.infoIcon} />
                          <span>
                            {format(new Date(trip.start_date), "d 'de' MMM", { locale: es })} -{" "}
                            {format(new Date(trip.end_date), "d 'de' MMM, yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className={styles.tripActivities}>
                          <span className={styles.activitiesText}>
                            {trip.activities.length} actividades planeadas
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Alert Dialog */}
      <Dialog open={alertDialog.open} onOpenChange={closeAlert}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              {alertDialog.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {alertDialog.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {alertDialog.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
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
                  variant="destructive" 
                  className="destructiveButton hover:!bg-[#dc2626] hover:!border-[#dc2626]"
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
