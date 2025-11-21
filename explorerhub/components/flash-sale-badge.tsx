"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Clock, Zap } from "lucide-react"

interface FlashSaleBadgeProps {
  startDate: string
  durationHours: number
  remainingUses?: number
  maxUses?: number
  discountPercentage?: number
  className?: string
  showCountdown?: boolean
}

export const FlashSaleBadge = ({
  startDate,
  durationHours,
  remainingUses,
  maxUses,
  discountPercentage,
  className,
  showCountdown = true,
}: FlashSaleBadgeProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startDate)
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)
      const now = new Date()

      // Verificar si la oferta está activa
      if (now < start || now > end) {
        setIsActive(false)
        return
      }

      setIsActive(true)

      // Calcular tiempo restante
      const diff = end.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (diff > 0) {
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`)
        }
      } else {
        setTimeLeft("Finalizada")
        setIsActive(false)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [startDate, durationHours])

  if (!isActive) return null

  const remainingStock = maxUses && remainingUses !== undefined 
    ? maxUses - remainingUses 
    : undefined

  return (
    <div className={cn("space-y-2", className)}>
      {/* Badge Principal - Estilo Mercado Libre */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md shadow-lg animate-pulse">
        <Zap className="h-4 w-4 fill-white" />
        <span className="font-bold text-sm uppercase tracking-wide">
          POR {durationHours} HS
        </span>
      </div>

      {/* Contador Regresivo */}
      {showCountdown && timeLeft && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded-md text-xs font-semibold">
          <Clock className="h-3 w-3" />
          <span>Quedan {timeLeft}</span>
        </div>
      )}

      {/* Stock Disponible */}
      {remainingStock !== undefined && remainingStock > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold border border-green-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span>
            {remainingStock === 1 
              ? "¡Último disponible!" 
              : `${remainingStock} disponibles`
            }
          </span>
        </div>
      )}

      {remainingStock === 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold border border-red-300">
          <span>⚠️ Agotado</span>
        </div>
      )}
    </div>
  )
}

// Componente compacto para usar en cards
export const FlashSaleBadgeCompact = ({
  durationHours,
  discountPercentage,
}: {
  durationHours: number
  discountPercentage?: number
}) => {
  return (
    <div className="absolute top-0 right-0 z-10">
      {/* Badge de oferta relámpago */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white px-3 py-1.5 rounded-bl-lg rounded-tr-lg shadow-lg">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 fill-white" />
            <span className="text-xs font-bold uppercase">Oferta</span>
          </div>
          {discountPercentage && (
            <span className="text-lg font-black leading-none">
              -{discountPercentage}%
            </span>
          )}
          <span className="text-[10px] font-semibold opacity-90">
            POR {durationHours}HS
          </span>
        </div>
      </div>
    </div>
  )
}

// Barra de progreso para mostrar cuántos quedan
export const FlashSaleProgress = ({
  currentUses,
  maxUses,
}: {
  currentUses: number
  maxUses: number
}) => {
  const percentage = (currentUses / maxUses) * 100
  const remaining = maxUses - currentUses

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">Disponibilidad</span>
        <span className="text-gray-900 font-bold">
          {remaining} de {maxUses}
        </span>
      </div>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
            percentage < 30 ? "bg-red-500" : 
            percentage < 60 ? "bg-orange-500" : 
            "bg-green-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {percentage < 30 && "¡Quedan pocos!"}
        {percentage >= 30 && percentage < 60 && "Disponibilidad limitada"}
        {percentage >= 60 && "Aún hay disponibles"}
      </p>
    </div>
  )
}
