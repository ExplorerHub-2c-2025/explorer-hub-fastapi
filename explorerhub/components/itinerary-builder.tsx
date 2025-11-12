"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, X, Plus, Edit2, Save } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import styles from "./itinerary-builder.module.css"

interface Activity {
  id: string
  business_id: string
  business_name: string
  categories: string[]
  scheduled_date?: Date
  notes?: string
}

interface ItineraryBuilderProps {
  activities: Activity[]
  onAddActivity: () => void
  onRemoveActivity: (businessId: string) => void
  onUpdateSchedule: (businessId: string, date: Date) => void
  onUpdateNotes?: (businessId: string, notes: string) => void
}

export function ItineraryBuilder({
  activities,
  onAddActivity,
  onRemoveActivity,
  onUpdateSchedule,
  onUpdateNotes,
}: ItineraryBuilderProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState("")

  const handleEditNotes = (businessId: string, currentNotes?: string) => {
    setEditingNotes(businessId)
    setTempNotes(currentNotes || "")
  }

  const handleSaveNotes = (businessId: string) => {
    if (onUpdateNotes) {
      onUpdateNotes(businessId, tempNotes)
    }
    setEditingNotes(null)
    setTempNotes("")
  }

  const handleCancelEdit = () => {
    setEditingNotes(null)
    setTempNotes("")
  }

  const sortedActivities = [...activities].sort((a, b) => {
    // Activities without dates go to the end
    if (!a.scheduled_date && !b.scheduled_date) return 0
    if (!a.scheduled_date) return 1
    if (!b.scheduled_date) return -1
    
    // Sort by date ascending
    return a.scheduled_date.getTime() - b.scheduled_date.getTime()
  })

  return (
    <div className={styles.rootContainer}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Itinerario</h3>
        <Button onClick={onAddActivity} className={styles.addActivityButton}>
          <Plus className={styles.addIcon} />
          Agregar Actividad
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className={styles.emptyState}>
            <Calendar className={styles.emptyIcon} />
            <h4 className={styles.emptyTitle}>No hay actividades todavía</h4>
            <p className={styles.emptyText}>Comienza a construir tu itinerario agregando actividades</p>
            <Button onClick={onAddActivity} className={styles.addActivityButton}>
              <Plus className={styles.addIcon} />
              Agregar Tu Primera Actividad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.spaceY3}>
          {sortedActivities.map((activity) => (
            <Card key={activity.business_id}>
              <CardContent className={styles.activityCard}>
                <div className={styles.activityContent}>
                  <div className={styles.activityMain}>
                    <div className={styles.activityHeader}>
                      <h4 className={styles.activityTitle}>{activity.business_name}</h4>
                      <Badge variant="secondary">
                        {activity.categories && activity.categories.length > 0 ? activity.categories[0] : 'Sin categoría'}
                      </Badge>
                    </div>

                    {/* Date Scheduler */}
                    <div className={styles.timeRow}>
                      <Clock className={styles.timeIcon} />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className={styles.scheduleButton}>
                            {activity.scheduled_date ? format(activity.scheduled_date, "PPP") : "Programar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={activity.scheduled_date}
                            onSelect={(date) => date && onUpdateSchedule(activity.business_id, date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Notes Section */}
                    {editingNotes === activity.business_id ? (
                      <div className="space-y-2 mt-2">
                        <Textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Añade notas sobre esta actividad..."
                          className={styles.notesTextarea}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveNotes(activity.business_id)}>
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {activity.notes && <p className={styles.activityNotes}>{activity.notes}</p>}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNotes(activity.business_id, activity.notes)}
                          className={styles.editNotesButton}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          {activity.notes ? "Editar notas" : "Añadir notas"}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveActivity(activity.business_id)}
                    className={styles.removeButton}
                  >
                    <X className={styles.removeIcon} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ItineraryBuilder
