"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PromotionCard } from "@/components/promotion-card"
import { EstadoSwitch } from "@/components/estado-switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, Tag, TrendingUp, Gift } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Promotion {
  id: number
  title: string
  description: string
  promotion_type?: string
  discount_percentage?: number
  discount_amount?: number
  code?: string
  start_date: string
  end_date: string
  terms_conditions?: string
  current_uses: number
  max_uses?: number
  min_purchase?: number
  is_active: boolean
  business_id: number
  is_flash_sale?: boolean  // Oferta relámpago
  flash_duration_hours?: number  // Duración en horas
}

interface Business {
  id: number
  name: string
}

export default function PromotionsManagementPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    promotionType: "automatic", // "automatic" | "code"
    discountType: "percentage",
    discountValue: "",
    code: "",
    startDate: "",
    endDate: "",
    termsConditions: "",
    maxUses: "",
    minPurchase: "",
    isActive: true,
    isFlashSale: false,
    flashDurationHours: "6",
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "business") {
      router.push("/explore")
      return
    }

    fetchBusinesses()
  }, [router])

  useEffect(() => {
    if (selectedBusinessId) {
      fetchPromotions(selectedBusinessId)
    }
  }, [selectedBusinessId])

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        router.push("/sign-in")
        return
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"}/api/businesses/owner/my-businesses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/sign-in")
        return
      }

      if (response.ok) {
        const data = await response.json()
        setBusinesses(data)
        if (data.length > 0) {
          setSelectedBusinessId(data[0].id)
        }
      } else {
        setError("Error al cargar los negocios")
      }
    } catch (err) {
      console.error("Error fetching businesses:", err)
      setError("Error al cargar los negocios")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPromotions = async (businessId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"}/api/promotions?business_id=${businessId}&active_only=false`
      )

      if (response.ok) {
        const data = await response.json()
        setPromotions(data)
      } else {
        setError("Error al cargar las promociones")
      }
    } catch (err) {
      console.error("Error fetching promotions:", err)
      setError("Error al cargar las promociones")
    }
  }

  const handleCreatePromotion = async () => {
    if (!selectedBusinessId) return

    setIsCreating(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const promotionData: any = {
        title: formData.title,
        description: formData.description || undefined,
        promotion_type: formData.promotionType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        terms_conditions: formData.termsConditions || undefined,
        code: formData.promotionType === "code" ? formData.code : undefined,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        min_purchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        is_active: formData.isActive,
        is_flash_sale: formData.isFlashSale,
        flash_duration_hours: formData.isFlashSale ? parseInt(formData.flashDurationHours) : undefined,
      }

      if (formData.discountType === "percentage") {
        promotionData.discount_percentage = parseInt(formData.discountValue)
      } else {
        promotionData.discount_amount = parseFloat(formData.discountValue)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"}/api/promotions?business_id=${selectedBusinessId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(promotionData),
        }
      )

      if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/sign-in")
        return
      }

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          title: "",
          description: "",
          promotionType: "automatic",
          discountType: "percentage",
          discountValue: "",
          code: "",
          startDate: "",
          endDate: "",
          termsConditions: "",
          maxUses: "",
          minPurchase: "",
          isActive: true,
          isFlashSale: false,
          flashDurationHours: "6",
        })
        fetchPromotions(selectedBusinessId)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Error al crear la promoción")
      }
    } catch (err) {
      console.error("Error creating promotion:", err)
      setError("Error al crear la promoción")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeletePromotion = async (promotionId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta promoción?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"}/api/promotions/${promotionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/sign-in")
        return
      }

      if (response.ok && selectedBusinessId) {
        fetchPromotions(selectedBusinessId)
      }
    } catch (err) {
      console.error("Error deleting promotion:", err)
      setError("Error al eliminar la promoción")
    }
  }

  const handleEditPromotion = (promotionId: number) => {
    const promotion = promotions.find(p => p.id === promotionId)
    if (!promotion) return

    setEditingPromotionId(promotionId)
    setFormData({
      title: promotion.title,
      description: promotion.description || "",
      promotionType: (promotion as any).promotion_type || "code",
      discountType: promotion.discount_percentage ? "percentage" : "amount",
      discountValue: promotion.discount_percentage 
        ? String(promotion.discount_percentage) 
        : String(promotion.discount_amount),
      code: promotion.code || "",
      startDate: promotion.start_date,
      endDate: promotion.end_date,
      termsConditions: promotion.terms_conditions || "",
      maxUses: promotion.max_uses ? String(promotion.max_uses) : "",
      minPurchase: promotion.min_purchase ? String(promotion.min_purchase) : "",
      isActive: promotion.is_active,
      isFlashSale: promotion.is_flash_sale || false,
      flashDurationHours: promotion.flash_duration_hours ? String(promotion.flash_duration_hours) : "6",
    })
    setIsDialogOpen(true)
  }

  const handleUpdatePromotion = async () => {
    if (!selectedBusinessId || !editingPromotionId) return

    setIsCreating(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const promotionData: any = {
        title: formData.title,
        description: formData.description || undefined,
        promotion_type: formData.promotionType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        terms_conditions: formData.termsConditions || undefined,
        code: formData.promotionType === "code" ? formData.code : undefined,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        min_purchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        is_active: formData.isActive,
        is_flash_sale: formData.isFlashSale,
        flash_duration_hours: formData.isFlashSale ? parseInt(formData.flashDurationHours) : undefined,
      }

      if (formData.discountType === "percentage") {
        promotionData.discount_percentage = parseInt(formData.discountValue)
        promotionData.discount_amount = null
      } else {
        promotionData.discount_amount = parseFloat(formData.discountValue)
        promotionData.discount_percentage = null
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"}/api/promotions/${editingPromotionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(promotionData),
        }
      )

      if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/sign-in")
        return
      }

      if (response.ok) {
        setIsDialogOpen(false)
        setEditingPromotionId(null)
        setFormData({
          title: "",
          description: "",
          promotionType: "automatic",
          discountType: "percentage",
          discountValue: "",
          code: "",
          startDate: "",
          endDate: "",
          termsConditions: "",
          maxUses: "",
          minPurchase: "",
          isActive: true,
          isFlashSale: false,
          flashDurationHours: "6",
        })
        fetchPromotions(selectedBusinessId)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Error al actualizar la promoción")
      }
    } catch (err) {
      console.error("Error updating promotion:", err)
      setError("Error al actualizar la promoción")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingPromotionId(null)
      setFormData({
        title: "",
        description: "",
        promotionType: "automatic",
        discountType: "percentage",
        discountValue: "",
        code: "",
        startDate: "",
        endDate: "",
        termsConditions: "",
        maxUses: "",
        minPurchase: "",
        isActive: true,
        isFlashSale: false,
        flashDurationHours: "6",
      })
    }
  }

  const [showActivePromotions, setShowActivePromotions] = useState(true)
  
  const activePromotions = promotions.filter((p) => p.is_active && new Date(p.end_date) >= new Date())
  const expiredPromotions = promotions.filter((p) => !p.is_active || new Date(p.end_date) < new Date())
  
  const displayedPromotions = showActivePromotions ? activePromotions : expiredPromotions

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestión de Promociones</h1>
          <p className="text-muted-foreground">Crea y administra promociones exclusivas para tus clientes</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Business Selector & Stats Grid - Compact Layout 
            Ajuste de tamaños: 
            - Selector: cambia md:w-[40%] para ajustar el ancho del selector
            - Mini-cards: cambia h-36 para ajustar tamaño (ej: h-32 más chicas, h-40 más grandes)
        */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          {/* Business Selector Card - Left Side (40% width on tablet/desktop) */}
          <Card className="w-full md:w-[40%] bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Seleccionar Negocio</CardTitle>
              <CardDescription className="text-sm">Elige el negocio para gestionar promociones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedBusinessId?.toString()}
                onValueChange={(value) => setSelectedBusinessId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedBusinessId} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Promoción
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPromotionId ? "Editar Promoción" : "Crear Nueva Promoción"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPromotionId 
                        ? "Modifica los detalles de la promoción" 
                        : "Completa los detalles de la promoción que deseas ofrecer"
                      }
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título de la Promoción *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ej: Descuento de Verano"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción (opcional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe los detalles de la promoción"
                        rows={3}
                      />
                    </div>

                    {/* Tipo de Promoción */}
                    <div className="space-y-2">
                      <Label htmlFor="promotionType">Tipo de Promoción *</Label>
                      <Select
                        value={formData.promotionType}
                        onValueChange={(value) => setFormData({ ...formData, promotionType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatic">
                            <div className="flex flex-col">
                              <span className="font-medium">Descuento Automático</span>
                              <span className="text-xs text-muted-foreground">Se aplica automáticamente al precio</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="code">
                            <div className="flex flex-col">
                              <span className="font-medium">Código Promocional</span>
                              <span className="text-xs text-muted-foreground">Requiere código para aplicar</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.promotionType === "automatic" && (
                        <p className="text-xs text-muted-foreground">
                          ℹ️ Este descuento se aplicará automáticamente al hacer una reserva
                        </p>
                      )}
                    </div>

                    {/* Oferta Relámpago (Solo para tipo automático) */}
                    {formData.promotionType === "automatic" && (
                      <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isFlashSale"
                            checked={formData.isFlashSale}
                            onCheckedChange={(checked) => setFormData({ ...formData, isFlashSale: checked as boolean })}
                          />
                          <Label 
                            htmlFor="isFlashSale" 
                            className="text-sm font-semibold text-orange-700 cursor-pointer"
                          >
                            ⚡ Oferta Relámpago (estilo Mercado Libre)
                          </Label>
                        </div>
                        
                        {formData.isFlashSale && (
                          <div className="space-y-2 pl-6">
                            <Label htmlFor="flashDurationHours" className="text-sm">
                              Duración en horas *
                            </Label>
                            <Select
                              value={formData.flashDurationHours}
                              onValueChange={(value) => setFormData({ ...formData, flashDurationHours: value })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 hora ⏱️</SelectItem>
                                <SelectItem value="2">2 horas ⏱️</SelectItem>
                                <SelectItem value="3">3 horas ⏱️</SelectItem>
                                <SelectItem value="6">6 horas ⚡ (Recomendado)</SelectItem>
                                <SelectItem value="12">12 horas ⏰</SelectItem>
                                <SelectItem value="24">24 horas 🕐</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-orange-600">
                              ⚡ La oferta se mostrará con contador regresivo y badge "POR {formData.flashDurationHours} HS"
                            </p>
                            <p className="text-xs text-muted-foreground">
                              💡 Tip: Define "Máximo de Usos" para limitar cupos (ej: "Quedan 5 disponibles")
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountType">Tipo de Descuento *</Label>
                        <Select
                          value={formData.discountType}
                          onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="amount">Monto Fijo ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discountValue">
                          Valor del Descuento * {formData.discountType === "percentage" ? "(%)" : "($)"}
                        </Label>
                        <Input
                          id="discountValue"
                          type="number"
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                          placeholder={formData.discountType === "percentage" ? "10" : "50"}
                          min="0"
                          max={formData.discountType === "percentage" ? "100" : undefined}
                        />
                      </div>
                    </div>

                    {/* Código Promocional - Solo para tipo "code" */}
                    {formData.promotionType === "code" && (
                      <div className="space-y-2">
                        <Label htmlFor="code">Código Promocional *</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          placeholder="VERANO2025"
                        />
                        <p className="text-xs text-muted-foreground">
                          Los clientes deberán ingresar este código para aplicar el descuento
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Fecha de Inicio *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Fecha de Fin *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxUses">Máximo de Usos (opcional)</Label>
                        <Input
                          id="maxUses"
                          type="number"
                          value={formData.maxUses}
                          onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                          placeholder="100"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minPurchase">Compra Mínima $ (opcional)</Label>
                        <Input
                          id="minPurchase"
                          type="number"
                          value={formData.minPurchase}
                          onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                          placeholder="50.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="termsConditions">Términos y Condiciones (opcional)</Label>
                      <Textarea
                        id="termsConditions"
                        value={formData.termsConditions}
                        onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                        placeholder="Especifica las condiciones de uso de la promoción"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                      />
                      <Label 
                        htmlFor="isActive" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Promoción Activa
                      </Label>
                    </div>

                    <Button 
                      onClick={editingPromotionId ? handleUpdatePromotion : handleCreatePromotion} 
                      disabled={
                        isCreating || 
                        !formData.title || 
                        !formData.discountValue || 
                        !formData.startDate || 
                        !formData.endDate ||
                        (formData.promotionType === "code" && !formData.code)
                      } 
                      className="w-full"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingPromotionId ? "Actualizando..." : "Creando..."}
                        </>
                      ) : (
                        editingPromotionId ? "Actualizar Promoción" : "Crear Promoción"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Stats Mini-Cards - Right Side (60% width, 3 equal square cards on tablet/desktop) */}
          {selectedBusinessId && (
            <div className="w-full md:w-[60%] flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Card 1: Promociones Activas */}
              <Card className="flex-1 aspect-square max-h-36 bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow flex items-center justify-center p-4 border-0">
                <div className="flex flex-col items-center justify-center space-y-2 w-full text-center">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Promociones Activas</p>
                  <p className="text-2xl font-bold text-primary">{activePromotions.length}</p>
                </div>
              </Card>

              {/* Card 2: Total Promociones */}
              <Card className="flex-1 aspect-square max-h-36 bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow flex items-center justify-center p-4 border-0">
                <div className="flex flex-col items-center justify-center space-y-2 w-full text-center">
                  <div className="rounded-full bg-blue-500/10 p-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Total Promociones</p>
                  <p className="text-2xl font-bold text-blue-500">{promotions.length}</p>
                </div>
              </Card>

              {/* Card 3: Total Usos */}
              <Card className="flex-1 aspect-square max-h-36 bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow flex items-center justify-center p-4 border-0">
                <div className="flex flex-col items-center justify-center space-y-2 w-full text-center">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <Gift className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Total Usos</p>
                  <p className="text-2xl font-bold text-green-500">
                    {promotions.reduce((sum, p) => sum + p.current_uses, 0)}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Promotions Section with Toggle */}
        {selectedBusinessId && promotions.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {showActivePromotions ? "Promociones Activas" : "Promociones Inactivas"}
              </h2>
              <EstadoSwitch 
                initialState={showActivePromotions}
                onToggle={(isActive) => setShowActivePromotions(isActive)}
                showLabel={true}
                size="md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPromotions.map((promotion) => (
                <PromotionCard
                  key={promotion.id}
                  id={promotion.id}
                  title={promotion.title}
                  description={promotion.description}
                  discountPercentage={promotion.discount_percentage}
                  discountAmount={promotion.discount_amount}
                  code={promotion.code}
                  promotionType={promotion.promotion_type}
                  startDate={promotion.start_date}
                  endDate={promotion.end_date}
                  termsConditions={promotion.terms_conditions}
                  currentUses={promotion.current_uses}
                  maxUses={promotion.max_uses}
                  minPurchase={promotion.min_purchase}
                  isActive={promotion.is_active}
                  isFlashSale={promotion.is_flash_sale}
                  flashDurationHours={promotion.flash_duration_hours}
                  onEdit={handleEditPromotion}
                  onDelete={handleDeletePromotion}
                  showActions={true}
                  compact={!showActivePromotions}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedBusinessId && promotions.length === 0 && !isLoading && (
          <Card className="bg-white shadow-md rounded-xl border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay promociones</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Comienza creando tu primera promoción para atraer más clientes
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
