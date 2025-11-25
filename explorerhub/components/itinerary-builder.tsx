"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, X, Plus, Edit2, Save, Image, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { OpenStreetMapLink } from "@/components/openstreetmap-link"
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
  location?: {
    address?: string
    city?: string
  }
  images?: Array<{url: string, notes?: string}>
}

interface ItineraryBuilderProps {
  activities: Activity[]
  onAddActivity: () => void
  onRemoveActivity: (businessId: string) => void
  onUpdateSchedule: (businessId: string, date: Date) => void
  firstActivityMapLink?: React.ReactNode
  onUpdateNotes?: (businessId: string, notes: string) => void
  onAddImage?: (businessId: string, imageUrl: string) => void
  onUpdateImageNotes?: (businessId: string, imageIndex: number, notes: string) => void
  onRemoveImage?: (businessId: string, imageIndex: number) => void
}

export function ItineraryBuilder({
  activities,
  onAddActivity,
  onRemoveActivity,
  onUpdateSchedule,
  firstActivityMapLink,
  onUpdateNotes,
  onAddImage,
  onUpdateImageNotes,
  onRemoveImage,
}: ItineraryBuilderProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState("")
  const [editingImageNotes, setEditingImageNotes] = useState<{businessId: string, imageIndex: number} | null>(null)
  const [tempImageNotes, setTempImageNotes] = useState("")
  const [imageInput, setImageInput] = useState<{[key: string]: string}>({})

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

  const handleEditImageNotes = (businessId: string, imageIndex: number, currentNotes?: string) => {
    setEditingImageNotes({businessId, imageIndex})
    setTempImageNotes(currentNotes || "")
  }

  const handleSaveImageNotes = (businessId: string, imageIndex: number) => {
    if (onUpdateImageNotes) {
      onUpdateImageNotes(businessId, imageIndex, tempImageNotes)
    }
    setEditingImageNotes(null)
    setTempImageNotes("")
  }

  const handleCancelImageEdit = () => {
    setEditingImageNotes(null)
    setTempImageNotes("")
  }

  const handleAddImage = (businessId: string) => {
    const imageUrl = imageInput[businessId]?.trim()
    if (imageUrl && onAddImage) {
      onAddImage(businessId, imageUrl)
      setImageInput(prev => ({...prev, [businessId]: ""}))
    }
  }

  const handleRemoveImage = (businessId: string, imageIndex: number) => {
    if (onRemoveImage) {
      onRemoveImage(businessId, imageIndex)
    }
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
          {sortedActivities.map((activity, index) => (
            <Card key={activity.business_id}>
              <CardContent className={styles.activityCard}>
                {index === 0 && firstActivityMapLink && <div className="mb-3">{firstActivityMapLink}</div>}

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

                    {activity.location?.city && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          📍 {activity.location.address}, {activity.location.city}
                        </p>

                        {/* OpenStreetMap link to next activity or from previous activity */}
                        {index > 0 && sortedActivities[index - 1].location?.city && (
                          <>
                            <OpenStreetMapLink
                              fromAddress={sortedActivities[index - 1].location?.address || ""}
                              fromCity={sortedActivities[index - 1].location?.city || ""}
                              toAddress={activity.location.address || ""}
                              toCity={activity.location.city || ""}
                              activityName={activity.business_name}
                              mode="foot-walking"
                            />

                            {/* Images Section */}
                            {onAddImage && (
                              <div className="space-y-3 mt-4">
                                <div className="flex gap-2">
                                  <Input
                                    type="url"
                                    placeholder="URL de la imagen..."
                                    value={imageInput[activity.business_id] || ""}
                                    onChange={(e) =>
                                      setImageInput((prev) => ({
                                        ...prev,
                                        [activity.business_id]: e.target.value,
                                      }))
                                    }
                                    className="flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddImage(activity.business_id)}
                                    disabled={!imageInput[activity.business_id]?.trim()}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Añadir
                                  </Button>
                                </div>

                                {activity.images && activity.images.length > 0 && (
                                  <div className="space-y-2">
                                    {activity.images.map((image, imageIndex) => (
                                      <div
                                        key={imageIndex}
                                        className="border rounded-lg p-3 bg-gray-50"
                                      >
                                        <div className="flex flex-col gap-3">
                                          <img
                                            src={image.url}
                                            alt={`Imagen ${imageIndex + 1}`}
                                            className="w-full max-w-xs h-48 object-cover rounded mx-auto"
                                          />
                                          <div className="flex-1">
                                            {editingImageNotes?.businessId === activity.business_id &&
                                            editingImageNotes.imageIndex === imageIndex ? (
                                              <div className="space-y-2">
                                                <Textarea
                                                  value={tempImageNotes}
                                                  onChange={(e) => setTempImageNotes(e.target.value)}
                                                  placeholder="Notas de la imagen..."
                                                  className="text-sm"
                                                  rows={2}
                                                />
                                                <div className="flex gap-2">
                                                  <Button
                                                    size="sm"
                                                    onClick={() =>
                                                      handleSaveImageNotes(activity.business_id, imageIndex)
                                                    }
                                                  >
                                                    <Save className="h-3 w-3 mr-1" />
                                                    Guardar
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleCancelImageEdit}
                                                  >
                                                    Cancelar
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                {image.notes && (
                                                  <p className="text-sm text-gray-700">{image.notes}</p>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleEditImageNotes(
                                                        activity.business_id,
                                                        imageIndex,
                                                        image.notes
                                                      )
                                                    }
                                                  >
                                                    <Edit2 className="h-3 w-3 mr-1" />
                                                    {image.notes ? "Editar" : "Añadir notas"}
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleRemoveImage(activity.business_id, imageIndex)
                                                    }
                                                    className="text-red-600 hover:text-red-700"
                                                  >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Eliminar
                                                  </Button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
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
