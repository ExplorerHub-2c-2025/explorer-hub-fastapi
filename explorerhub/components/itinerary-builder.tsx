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
  category: string
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
    <div className="space-y-4">
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Itinerary</h3>
        <Button onClick={onAddActivity} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">No activities yet</h4>
            <p className="text-sm text-muted-foreground mb-4">Start building your itinerary by adding activities</p>
            <Button onClick={onAddActivity}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.business_id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{activity.business_name}</h4>
                      <Badge variant="secondary">{activity.category}</Badge>
                    </div>

                    {activity.scheduled_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{format(activity.scheduled_date, "PPP")}</span>
                      </div>
                    )}

                    {activity.notes && <p className="text-sm text-muted-foreground mt-2">{activity.notes}</p>}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveActivity(activity.business_id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
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
