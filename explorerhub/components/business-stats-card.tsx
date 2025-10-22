import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import styles from "./business-stats-card.module.css"
import type { LucideIcon } from "lucide-react"

interface BusinessStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function BusinessStatsCard({ title, value, icon: Icon, description, trend }: BusinessStatsCardProps) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle className={styles.titleSmall}>{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={styles.valueLarge}>{value}</div>
        {description && <p className={styles.descSmall}>{description}</p>}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? styles.trendPositive : styles.trendNegative}`}>
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}
