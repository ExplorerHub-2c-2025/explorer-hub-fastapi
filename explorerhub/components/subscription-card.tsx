"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SubscriptionCardProps {
  businessId: number
  businessName: string
  isSubscribed: boolean
  subscriptionTier?: string | null
  subscriptionEndsAt?: string | null
  onSubscriptionUpdate?: () => void
}

export function SubscriptionCard({
  businessId,
  businessName,
  isSubscribed,
  subscriptionTier,
  subscriptionEndsAt,
  onSubscriptionUpdate,
}: SubscriptionCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState("basic")
  const [selectedDuration, setSelectedDuration] = useState("30")
  const [isLoading, setIsLoading] = useState(false)

  const getDaysRemaining = () => {
    if (!subscriptionEndsAt) return 0
    const now = new Date()
    const endDate = new Date(subscriptionEndsAt)
    const diff = endDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = getDaysRemaining()
  const isActive = isSubscribed && daysRemaining > 0

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/businesses/${businessId}/subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tier: selectedTier,
            duration_days: parseInt(selectedDuration),
          }),
        }
      )

      if (response.ok) {
        alert("¡Suscripción activada exitosamente!")
        setIsDialogOpen(false)
        onSubscriptionUpdate?.()
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || "No se pudo activar la suscripción"}`)
      }
    } catch (error) {
      console.error("Error al activar suscripción:", error)
      alert("Error al activar la suscripción")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar la suscripción?")) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/businesses/${businessId}/subscription`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        alert("Suscripción cancelada")
        onSubscriptionUpdate?.()
      } else {
        alert("Error al cancelar la suscripción")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cancelar la suscripción")
    } finally {
      setIsLoading(false)
    }
  }

  const getTierColor = (tier?: string | null) => {
    switch (tier) {
      case "basic":
        return "bg-blue-100 text-blue-800"
      case "premium":
        return "bg-purple-100 text-purple-800"
      case "enterprise":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTierLabel = (tier?: string | null) => {
    switch (tier) {
      case "basic":
        return "Básico"
      case "premium":
        return "Premium"
      case "enterprise":
        return "Enterprise"
      default:
        return "Sin suscripción"
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Suscripción Premium
        </CardTitle>
        <CardDescription>{businessName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Estado</p>
            <div className="flex items-center gap-2">
              {isActive ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge className={getTierColor(subscriptionTier)}>{getTierLabel(subscriptionTier)}</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <Badge variant="outline">Sin suscripción</Badge>
                </>
              )}
            </div>
          </div>

          {isActive && (
            <div className="text-right">
              <p className="text-sm font-medium">Expira en</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className={daysRemaining <= 7 ? "text-red-600 font-semibold" : ""}>
                  {daysRemaining} día{daysRemaining !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {isActive && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Tu negocio aparece <strong>primero en las búsquedas</strong> relacionadas a tu categoría
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" disabled={isLoading}>
                <Crown className="h-4 w-4 mr-2" />
                {isActive ? "Renovar" : "Activar"} Suscripción
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Activar Suscripción Premium</DialogTitle>
                <DialogDescription>
                  Mejora la visibilidad de tu negocio apareciendo primero en las búsquedas
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Plan de Suscripción</Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger id="tier">
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico - Prioridad en búsquedas</SelectItem>
                      <SelectItem value="premium">Premium - Prioridad + Beneficios extra</SelectItem>
                      <SelectItem value="enterprise">Enterprise - Máxima prioridad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración</Label>
                  <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Selecciona duración" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 días - 1 mes</SelectItem>
                      <SelectItem value="90">90 días - 3 meses</SelectItem>
                      <SelectItem value="180">180 días - 6 meses</SelectItem>
                      <SelectItem value="365">365 días - 1 año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Beneficios de la Suscripción:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Tu negocio aparece primero en búsquedas</li>
                    <li>✓ Mayor visibilidad para usuarios</li>
                    <li>✓ Prioridad sobre competidores</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSubscribe} disabled={isLoading}>
                  {isLoading ? "Procesando..." : "Confirmar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {isActive && (
            <Button variant="outline" onClick={handleCancelSubscription} disabled={isLoading}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
