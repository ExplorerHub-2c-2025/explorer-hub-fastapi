"use client"
import { Card, CardContent } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, X, Plus } from "lucide-react"
import { format } from "date-fns"
import { GoogleMapsLink } from "@/components/google-maps-link"
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
}

interface ItineraryBuilderProps {
  activities: Activity[]
  onAddActivity: () => void
  onRemoveActivity: (businessId: string) => void
  onUpdateSchedule: (businessId: string, date: Date) => void
  firstActivityMapLink?: React.ReactNode
}

export function ItineraryBuilder({
  activities,
  onAddActivity,
  onRemoveActivity,
  onUpdateSchedule,
  firstActivityMapLink,
}: ItineraryBuilderProps) {
  return (
    <div className={styles.rootContainer}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Itinerario</h3>
        <Button onClick={onAddActivity} size="sm">
          <Plus className={styles.addIcon} />
          Agregar Actividad
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className={styles.emptyState}>
            <Calendar className={styles.emptyIcon} />
            <h4 className={styles.emptyTitle}>Sin actividades aún</h4>
            <p className={styles.emptyText}>Comienza a construir tu itinerario agregando actividades</p>
            <Button onClick={onAddActivity}>
              <Plus className={styles.addIcon} />
              Agregar tu primera actividad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.spaceY3}>
          {activities.map((activity, index) => (
            <Card key={activity.business_id}>
              <CardContent className={styles.activityCard}>
                {index === 0 && firstActivityMapLink && <div className="mb-3">{firstActivityMapLink}</div>}

                <div className={styles.activityContent}>
                  <div className={styles.activityMain}>
                    <div className={styles.activityHeader}>
                      <h4 className={styles.activityTitle}>{activity.business_name}</h4>
                      <Badge variant="secondary">
                        {activity.categories && activity.categories.length > 0
                          ? activity.categories[0]
                          : "Sin categoría"}
                      </Badge>
                    </div>

                    {activity.scheduled_date && (
                      <div className={styles.timeRow}>
                        <Clock className={styles.timeIcon} />
                        <span>{format(activity.scheduled_date, "PPP")}</span>
                      </div>
                    )}

                    {activity.notes && <p className={styles.activityNotes}>{activity.notes}</p>}

                    {activity.location?.city && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          📍 {activity.location.address}, {activity.location.city}
                        </p>

                        {/* Google Maps link to next activity or from previous activity */}
                        {index > 0 && activities[index - 1].location?.city && (
                          <GoogleMapsLink
                            fromAddress={activities[index - 1].location?.address || ""}
                            fromCity={activities[index - 1].location?.city || ""}
                            toAddress={activity.location.address || ""}
                            toCity={activity.location.city || ""}
                            activityName={activity.business_name}
                          />
                        )}
                      </div>
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
