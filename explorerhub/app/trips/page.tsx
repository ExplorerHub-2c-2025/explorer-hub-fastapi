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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  description?: string
  cover_image?: string
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

  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [genTitle, setGenTitle] = useState("")
  const [genBudget, setGenBudget] = useState<'bajo'|'medio'|'alto'>('medio')
  const [genActivitiesPerDay, setGenActivitiesPerDay] = useState<1|2>(1)
  const [genCities, setGenCities] = useState<Array<{city: string; start_date: string; end_date: string}>>([
    { city: "", start_date: "", end_date: "" }
  ])

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
      const data = await authFetch("https://localhost:8000/api/trips/")
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

  const addCity = () => {
    setGenCities(prev => [...prev, { city: "", start_date: "", end_date: "" }])
  }

  const removeCity = (idx: number) => {
    setGenCities(prev => {
      const next = prev.filter((_, i) => i !== idx)
      return next.length > 0 ? next : [{ city: "", start_date: "", end_date: "" }]
    })
  }

  const updateCity = (idx: number, key: 'city'|'start_date'|'end_date', value: string) => {
    setGenCities(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c))
  }

  const submitGenerate = async () => {
    if (!genTitle.trim()) {
      showAlert('error', 'Falta el título', 'Ingresa un título para el viaje')
      return
    }
    const norm = genCities.filter(c => c.city && c.start_date && c.end_date)
    if (norm.length === 0) {
      showAlert('error', 'Faltan ciudades', 'Ingresa al menos una ciudad con fechas')
      return
    }
    const overallStart = new Date(Math.min(...norm.map(c => new Date(c.start_date).getTime())))
    const overallEnd = new Date(Math.max(...norm.map(c => new Date(c.end_date).getTime())))
    const payload = {
      name: genTitle.trim(),
      budget: genBudget,
      activities_per_day: genActivitiesPerDay,
      cities: norm.map(c => ({
        city: c.city,
        start_date: new Date(c.start_date).toISOString(),
        end_date: new Date(c.end_date).toISOString()
      }))
    }
    try {
      const trip = await authFetch('https://localhost:8000/api/trips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      setGeneratorOpen(false)
      setGenTitle("")
      setGenBudget('medio')
      setGenActivitiesPerDay(1)
      setGenCities([{ city: "", start_date: "", end_date: "" }])
      if (trip && trip.id) {
        router.push(`/trips/${trip.id}`)
        return
      }
      // Fallback: fetch trips and try to locate the one we just created
      const list = await authFetch('https://localhost:8000/api/trips/')
      if (Array.isArray(list) && list.length > 0) {
        const found = list.find((t: any) => {
          try {
            const sd = new Date(t.start_date)
            const ed = new Date(t.end_date)
            return t.name === payload.name && sd.getTime() === overallStart.getTime() && ed.getTime() === overallEnd.getTime()
          } catch {
            return false
          }
        }) || list[0]
        if (found && found.id) {
          router.push(`/trips/${found.id}`)
          return
        }
      }
      // As a last resort, just reload list
      router.push('/trips')
    } catch (e) {
      showAlert('error', 'No se pudo generar', 'Intenta nuevamente más tarde')
    }
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
          await authFetch(`https://localhost:8000/api/trips/${tripId}`, {
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
          <div className="flex gap-2">
            <Link href="/trips/new">
              <Button className={styles.createButton}>
                <Plus className={styles.buttonIcon} />
                Crear Viaje
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setGeneratorOpen(true)}>
              Generar viaje automático
            </Button>
          </div>
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
              <Link key={trip.id} href={`/trips/${trip.id}`} className={styles.tripCardLink}>
                <Card className={styles.tripCard}>
                  <div className={styles.tripImageWrapper}>
                    <img
                      src={trip.cover_image || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop`}
                      alt={trip.name}
                      className={styles.tripImage}
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
            ))}
          </div>
        )}
      </main>

      {/* Generator Dialog */}
      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar viaje automático</DialogTitle>
            <DialogDescription>Completa los datos para crear un itinerario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título del viaje</Label>
              <Input value={genTitle} onChange={e => setGenTitle(e.target.value)} placeholder="Ej: Europa en 10 días" />
            </div>
            <div className="space-y-2">
              <Label>Preferencia de presupuesto</Label>
              <select
                className="w-full border rounded h-10 px-3"
                value={genBudget}
                onChange={e => setGenBudget(e.target.value as any)}
              >
                <option value="bajo">Económico</option>
                <option value="medio">Estándar</option>
                <option value="alto">Premium</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Actividades por día</Label>
              <select
                className="w-full border rounded h-10 px-3"
                value={genActivitiesPerDay}
                onChange={e => setGenActivitiesPerDay(Number(e.target.value) as 1|2)}
              >
                <option value="1">1 actividad</option>
                <option value="2">2 actividades</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label>Ciudades</Label>
              {genCities.map((c, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="md:col-span-2">
                    <Label className="text-xs">Ciudad</Label>
                    <Input value={c.city} onChange={e => updateCity(idx, 'city', e.target.value)} placeholder="Ciudad" />
                  </div>
                  <div>
                    <Label className="text-xs">Inicio</Label>
                    <Input type="date" value={c.start_date} onChange={e => updateCity(idx, 'start_date', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Fin</Label>
                    <Input type="date" value={c.end_date} onChange={e => updateCity(idx, 'end_date', e.target.value)} />
                  </div>
                  <Button
                    variant="destructive"
                    title="Eliminar ciudad"
                    onClick={() => removeCity(idx)}
                    disabled={genCities.length === 1}
                    className={genCities.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-1 flex md:justify-end">
            <Button variant="outline" className="w-auto" onClick={addCity}>Agregar ciudad</Button>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={submitGenerate}>Generar viaje</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  className="destructiveButton hover:bg-[#dc2626]! hover:border-[#dc2626]!"
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
