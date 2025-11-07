"use client"

import { Badge, Calendar, Clock, Tag, Percent, DollarSign, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import styles from "./promotion-card.module.css"

interface PromotionCardProps {
  id: number
  title: string
  description?: string
  discountPercentage?: number
  discountAmount?: number
  code?: string
  startDate: string
  endDate: string
  termsConditions?: string
  currentUses?: number
  maxUses?: number
  minPurchase?: number
  isActive: boolean
  onClaim?: (id: number) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  showActions?: boolean
  compact?: boolean
}

export function PromotionCard({
  id,
  title,
  description,
  discountPercentage,
  discountAmount,
  code,
  startDate,
  endDate,
  termsConditions,
  currentUses = 0,
  maxUses,
  minPurchase,
  isActive,
  onClaim,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
}: PromotionCardProps) {
  const isExpired = new Date(endDate) < new Date()
  const isAvailable = isActive && !isExpired

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const usagePercentage = maxUses ? (currentUses / maxUses) * 100 : 0

  return (
    <div className={`${styles.promotionCard} ${compact ? styles.compact : ""}`}>
      <div className={styles.content}>

        {/* Title & Description with Status Indicator */}
        <div className={styles.header}>
          <div className="flex items-center gap-2">
            <h3 className={styles.title}>{title}</h3>
            <div 
              className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}
              title={isAvailable ? "Activa" : "Inactiva"}
            />
          </div>
          {description && <p className={styles.description}>{description}</p>}
        </div>

        {/* Details */}
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <Calendar className={styles.detailIcon} />
            <span>
              Válido: {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>

          {minPurchase && (
            <div className={styles.detailItem}>
              <DollarSign className={styles.detailIcon} />
              <span>Compra mínima: ${minPurchase}</span>
            </div>
          )}

          {maxUses && (
            <div className={styles.detailItem}>
              <Gift className={styles.detailIcon} />
              <span>
                Usos: {currentUses} / {maxUses} ({usagePercentage.toFixed(0)}%)
              </span>
            </div>
          )}
        </div>

        {/* Promo Code */}
        {code && (
          <div className={styles.code}>
            <div>
              <div className={styles.codeLabel}>Código</div>
              <div className={styles.codeValue}>{code}</div>
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        {termsConditions && !compact && (
          <div className={styles.terms}>
            <h4 className={styles.termsTitle}>Términos y Condiciones</h4>
            <p className={styles.termsText}>{termsConditions}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className={styles.actions}>
            {onClaim && isAvailable && (
              <Button onClick={() => onClaim(id)} className="flex-1">
                <Tag className="h-4 w-4 mr-2" />
                Reclamar Promoción
              </Button>
            )}
            {onEdit && (
              <Button onClick={() => onEdit(id)} variant="outline" className="flex-1">
                Editar
              </Button>
            )}
            {onDelete && (
              <Button onClick={() => onDelete(id)} variant="destructive" className="flex-1">
                Eliminar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
