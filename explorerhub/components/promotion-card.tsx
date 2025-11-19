"use client"

import { Calendar, Clock, Tag, Percent, DollarSign, Gift, Zap, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FlashSaleBadge, FlashSaleProgress } from "@/components/flash-sale-badge"
import styles from "./promotion-card.module.css"

interface PromotionCardProps {
  id: number
  title: string
  description?: string
  discountPercentage?: number
  discountAmount?: number
  code?: string
  promotionType?: string  // "code" | "automatic"
  startDate: string
  endDate: string
  termsConditions?: string
  currentUses?: number
  maxUses?: number
  minPurchase?: number
  isActive: boolean
  isFlashSale?: boolean
  flashDurationHours?: number
  onClaim?: (id: number) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  showActions?: boolean
  compact?: boolean
  showBadge?: boolean  // Para mostrar en tarjetas de negocio
}

export function PromotionCard({
  id,
  title,
  description,
  discountPercentage,
  discountAmount,
  code,
  promotionType = "code",
  startDate,
  endDate,
  termsConditions,
  currentUses = 0,
  maxUses,
  minPurchase,
  isActive,
  isFlashSale = false,
  flashDurationHours,
  onClaim,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
  showBadge = false,
}: PromotionCardProps) {
  const isExpired = new Date(endDate) < new Date()
  const isAvailable = isActive && !isExpired
  const isAutomatic = promotionType === "automatic"

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const usagePercentage = maxUses ? (currentUses / maxUses) * 100 : 0

  // Calcular si está por agotarse
  const isRunningOut = maxUses && usagePercentage >= 80

  // Para mostrar solo el badge en tarjetas de negocio
  if (showBadge) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-md">
        <Zap className="h-4 w-4" />
        <span>
          {discountPercentage ? `-${discountPercentage}%` : `-$${discountAmount}`}
          {isAutomatic ? " automático" : " con código"}
        </span>
      </div>
    )
  }

  return (
    <div className={`${styles.promotionCard} ${compact ? styles.compact : ""} ${isAutomatic ? styles.automatic : styles.code}`}>
      <div className={styles.content}>

        {/* Title & Description with Status Indicator */}
        <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>

        {/* Discount Badge - Destacado */}
        <div className={`${styles.discountBadge} ${isAutomatic ? styles.automaticDiscount : styles.codeDiscount}`}>
          <div className={styles.discountValue}>
            {discountPercentage ? (
              <>
                <Percent className="h-4 w-4" />
                <span>{discountPercentage}%</span>
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                <span>${discountAmount}</span>
              </>
            )}
          </div>
          <div className={styles.discountLabel}>
            de descuento
          </div>
        </div>

        {/* Condiciones Importantes */}
        {(minPurchase || termsConditions) && (
          <Alert className="my-3">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm space-y-1">
                <p className="font-semibold">Condiciones:</p>
                {minPurchase && (
                  <p>• Compra mínima: ${minPurchase.toFixed(2)}</p>
                )}
                {isAutomatic && (
                  <p>• Se aplica automáticamente en la reserva</p>
                )}
                {!isAutomatic && code && (
                  <p>• Debes reclamar y usar el código antes de reservar</p>
                )}
                {termsConditions && (
                  <p>• {termsConditions}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Details */}
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <Calendar className={styles.detailIcon} />
            <span>
              Válido: {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>

          {maxUses && (
            <div className={styles.detailItem}>
              <Gift className={styles.detailIcon} />
              {isFlashSale ? (
                <div className="w-full">
                  <FlashSaleProgress currentUses={currentUses} maxUses={maxUses} />
                </div>
              ) : (
                <>
                  <span>
                    Usos: {currentUses} / {maxUses} ({usagePercentage.toFixed(0)}%)
                  </span>
                  {usagePercentage > 0 && (
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className={`h-full rounded-full ${isRunningOut ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Promo Code - Solo para tipo "code" */}
        {code && !isAutomatic && (
          <div className={styles.code}>
            <div>
              <div className={styles.codeLabel}>Código Promocional</div>
              <div className={styles.codeValue}>{code}</div>
            </div>
          </div>
        )}

        {/* Mensaje para promociones automáticas */}
        {isAutomatic && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-semibold mb-1">Descuento Automático</p>
                <p>Este descuento se aplicará automáticamente al precio cuando hagas tu reserva. No necesitas código.</p>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions - Expandido */}
        {termsConditions && !compact && (
          <div className={styles.terms}>
            <h4 className={styles.termsTitle}>Términos y Condiciones Completos</h4>
            <p className={styles.termsText}>{termsConditions}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className={styles.actions}>
            {onClaim && isAvailable && !isAutomatic && (
              <Button onClick={() => onClaim(id)} className="flex-1">
                <Tag className="h-4 w-4 mr-2" />
                Reclamar Código
              </Button>
            )}
            {isAutomatic && isAvailable && (
              <div className="flex-1 p-2 text-center text-sm text-muted-foreground border rounded">
                Disponible en tu próxima reserva
              </div>
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
