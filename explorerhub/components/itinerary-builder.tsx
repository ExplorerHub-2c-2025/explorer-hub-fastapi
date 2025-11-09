"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, X, Plus } from "lucide-react"
import { format } from "date-fns"
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
}

export function ItineraryBuilder({
  activities,
  onAddActivity,
  onRemoveActivity,
  onUpdateSchedule,
}: ItineraryBuilderProps) {
  return (
    <div className={styles.rootContainer}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Itinerary</h3>
        <Button onClick={onAddActivity} size="sm">
          <Plus className={styles.addIcon} />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className={styles.emptyState}>
            <Calendar className={styles.emptyIcon} />
            <h4 className={styles.emptyTitle}>No activities yet</h4>
            <p className={styles.emptyText}>Start building your itinerary by adding activities</p>
            <Button onClick={onAddActivity}>
              <Plus className={styles.addIcon} />
              Add Your First Activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.spaceY3}>
          {activities.map((activity) => (
            <Card key={activity.business_id}>
              <CardContent className={styles.activityCard}>
                <div className={styles.activityContent}>
                  <div className={styles.activityMain}>
                    <div className={styles.activityHeader}>
                      <h4 className={styles.activityTitle}>{activity.business_name}</h4>
                      <Badge variant="secondary">{activity.categories && activity.categories.length > 0 ? activity.categories[0] : 'Sin categoría'}</Badge>
                    </div>

                    {activity.scheduled_date && (
                      <div className={styles.timeRow}>
                        <Clock className={styles.timeIcon} />
                        <span>{format(activity.scheduled_date, "PPP")}</span>
                      </div>
                    )}

                    {activity.notes && <p className={styles.activityNotes}>{activity.notes}</p>}
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
