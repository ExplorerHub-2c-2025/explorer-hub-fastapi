"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Upload, Image as ImageIcon } from "lucide-react"
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
    category: initialData?.category || "",
    address: initialData?.location?.address || "",
    city: initialData?.location?.city || "",
    state: initialData?.location?.state || "",
    country: initialData?.location?.country || "",
    phone: initialData?.phone || "",
    website: initialData?.website || "",
    price_level: initialData?.price_level || 2,
    tags: initialData?.tags ? initialData.tags.join(", ") : "",
    images: initialData?.images || [],
  })
  
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.images || [])
  const [newImageUrl, setNewImageUrl] = useState("")

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
    const submitData = {
      ...formData,
      location: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      },
      tags: formData.tags.split(",").map((tag: string) => tag.trim()).filter((tag: string) => tag),
      images: imageUrls,
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Editar Negocio" : "Agregar Nuevo Negocio"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Restaurant">Restaurante</SelectItem>
                  <SelectItem value="Activity">Actividad</SelectItem>
                  <SelectItem value="Attraction">Atracción</SelectItem>
                  <SelectItem value="Nature">Naturaleza</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Entertainment">Entretenimiento</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="ej: Italiano, Cena Elegante, Romántico"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className={styles.spaceY2}>
            <Label>Imágenes del Negocio</Label>
            <div className="space-y-3">
              <div className="flex gap-2">
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {imageUrls.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No hay imágenes agregadas</p>
                  <p className="text-xs text-gray-400 mt-1">Agrega URLs de imágenes para tu negocio</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : initialData ? "Actualizar Negocio" : "Crear Negocio"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
