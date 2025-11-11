"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Upload, Image as ImageIcon, ChevronDown } from "lucide-react"
import styles from "./business-form.module.css"

interface BusinessFormProps {
  onSubmit: (data: any) => void
  initialData?: any
  isLoading?: boolean
}

export function BusinessForm({ onSubmit, initialData, isLoading }: BusinessFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    categories: initialData?.categories || [], // Cambiado de category a categories
    address: initialData?.location?.address || "",
    city: initialData?.location?.city || "",
    state: initialData?.location?.state || "",
    country: initialData?.location?.country || "",
    phone: initialData?.phone || "",
    website: initialData?.website || "",
    price_level: initialData?.price_level || 2,
    tags: initialData?.tags ? initialData.tags.join(", ") : "",
    images: initialData?.images || [],
    allows_bookings: initialData?.allows_bookings !== undefined ? initialData.allows_bookings : true,
    max_capacity: initialData?.max_capacity || "", // Nuevo campo para cupo máximo
  })
  
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.images || [])
  const [newImageUrl, setNewImageUrl] = useState("")

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        categories: initialData.categories || [],
        address: initialData.location?.address || "",
        city: initialData.location?.city || "",
        state: initialData.location?.state || "",
        country: initialData.location?.country || "",
        phone: initialData.phone || "",
        website: initialData.website || "",
        price_level: initialData.price_level || 2,
        tags: initialData.tags ? initialData.tags.join(", ") : "",
        images: initialData.images || [],
        allows_bookings: initialData.allows_bookings !== undefined ? initialData.allows_bookings : true,
        max_capacity: initialData.max_capacity || "",
      })
      setImageUrls(initialData.images || [])
    }
  }, [initialData])

  // Lista de categorías disponibles
  const availableCategories = [
    { value: "Restaurante", label: "Restaurante" },
    { value: "Actividad", label: "Actividad" },
    { value: "Atracción", label: "Atracción" },
    { value: "Naturaleza", label: "Naturaleza" },
    { value: "Cultural", label: "Cultural" },
    { value: "Entretenimiento", label: "Entretenimiento" },
    { value: "Compras", label: "Compras" },
    { value: "Vida Nocturna", label: "Vida Nocturna" },
    { value: "Alojamiento", label: "Alojamiento" },
    { value: "Bienestar", label: "Bienestar" },
    { value: "Histórico", label: "Histórico" },
    { value: "Familiar", label: "Familiar" },
  ]

  const handleCategoryToggle = (categoryValue: string) => {
    const currentCategories = formData.categories
    const isSelected = currentCategories.includes(categoryValue)
    
    if (isSelected) {
      setFormData({
        ...formData,
        categories: currentCategories.filter((cat: string) => cat !== categoryValue)
      })
    } else {
      setFormData({
        ...formData,
        categories: [...currentCategories, categoryValue]
      })
    }
  }

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      const updatedImages = [...imageUrls, newImageUrl.trim()]
      setImageUrls(updatedImages)
      setFormData({ ...formData, images: updatedImages })
      setNewImageUrl("")
    }
  }

  const handleRemoveImage = (index: number) => {
    const updatedImages = imageUrls.filter((_, i) => i !== index)
    setImageUrls(updatedImages)
    setFormData({ ...formData, images: updatedImages })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que al menos una categoría esté seleccionada
    if (formData.categories.length === 0) {
      alert("Debes seleccionar al menos una categoría")
      return
    }
    
    const submitData = {
      ...formData,
      location: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      },
      tags: Array.isArray(formData.tags) 
        ? formData.tags 
        : formData.tags.split(",").map((tag: string) => tag.trim()).filter((tag: string) => tag),
      images: imageUrls,
      allows_bookings: formData.allows_bookings,
      max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Editar Negocio" : "Agregar Nuevo Negocio"}</CardTitle>
        </CardHeader>
        <CardContent className={styles.contentSpace}>
          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="name">Nombre del Negocio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.spaceY2}>
              <Label>Categorías *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={`${styles.multiSelectTrigger} justify-between`}
                  >
                    <span className={styles.multiSelectText}>
                      {formData.categories.length > 0
                        ? formData.categories.length <= 2
                          ? formData.categories.map((cat: string) => 
                              availableCategories.find(c => c.value === cat)?.label
                            ).join(", ")
                          : `${formData.categories.length} categorías seleccionadas`
                        : "Seleccionar categorías..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`${styles.multiSelectContent} w-full p-0`} align="start">
                  <div className="p-2">
                    {availableCategories.map((cat) => (
                      <div key={cat.value} className={styles.multiSelectItem}>
                        <Checkbox
                          id={`category-${cat.value}`}
                          checked={formData.categories.includes(cat.value)}
                          onCheckedChange={() => handleCategoryToggle(cat.value)}
                        />
                        <Label 
                          htmlFor={`category-${cat.value}`}
                          className={`${styles.multiSelectLabel} text-sm font-normal cursor-pointer`}
                        >
                          {cat.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {formData.categories.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Selecciona al menos una categoría</p>
              )}
            </div>
          </div>

          <div className={styles.spaceY2}>
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="state">Provincia/Estado *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.spaceY2}>
              <Label htmlFor="price_level">Nivel de Precio *</Label>
              <Select
                value={formData.price_level.toString()}
                onValueChange={(value) => setFormData({ ...formData, price_level: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">$ - Económico</SelectItem>
                  <SelectItem value="2">$$ - Moderado</SelectItem>
                  <SelectItem value="3">$$$ - Costoso</SelectItem>
                  <SelectItem value="4">$$$$ - Lujo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.spaceY2}>
              <Label htmlFor="max_capacity">Cupo Máximo (opcional)</Label>
              <Input
                id="max_capacity"
                type="number"
                min="1"
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                placeholder="ej: 50 personas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Límite de personas que pueden reservar al mismo tiempo
              </p>
            </div>
          </div>

          <div className={styles.spaceY2}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allows_bookings"
                checked={formData.allows_bookings}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, allows_bookings: checked as boolean })
                }
              />
              <Label 
                htmlFor="allows_bookings" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Permitir reservas en este negocio
              </Label>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className={styles.spaceY2}>
            <Label>Imágenes del Negocio</Label>
            <div className={styles.spaceY3}>
              <div className={styles.imageInputRow}>
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="URL de la imagen"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddImage()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddImage} disabled={!newImageUrl.trim()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {imageUrls.length > 0 && (
                <div className={styles.imageGrid}>
                  {imageUrls.map((url, index) => (
                    <div key={index} className={styles.imageWrapper}>
                      <div className={styles.imageContainer}>
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className={styles.imagePreview}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className={styles.removeButton}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className={styles.imageIndex}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {imageUrls.length === 0 && (
                <div className={styles.emptyState}>
                  <ImageIcon className={styles.emptyIcon} />
                  <p className={styles.emptyText}>No hay imágenes agregadas</p>
                  <p className={styles.emptySubtext}>Agrega URLs de imágenes para tu negocio</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? "Guardando..." : initialData ? "Actualizar Negocio" : "Crear Negocio"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
