"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const travelPreferences = [
  { id: "aventura", label: "Aventura" },
  { id: "cultura", label: "Cultura" },
  { id: "gastronomia", label: "Gastronomía" },
  { id: "relax", label: "Relax" },
  { id: "naturaleza", label: "Naturaleza" },
]

const languages = [
  { value: "español", label: "Español" },
  { value: "ingles", label: "Inglés" },
  { value: "portugues", label: "Portugués" },
  { value: "frances", label: "Francés" },
  { value: "aleman", label: "Alemán" },
]

export default function EditTravelerProfile() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    date_of_birth: "",
    language: "",
    travel_preferences: [] as string[],
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in/client")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.is_business) {
      router.push("/dashboard/business")
      return
    }
    setFormData({
      name: parsedUser.name || "",
      country: parsedUser.country || "",
      date_of_birth: parsedUser.date_of_birth || "",
      language: parsedUser.language || "",
      travel_preferences: parsedUser.travel_preferences || [],
    })
  }, [router])

  const handlePreferenceChange = (preferenceId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      travel_preferences: checked
        ? [...prev.travel_preferences, preferenceId]
        : prev.travel_preferences.filter((p) => p !== preferenceId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Simulate API call - in production, this would update the backend
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local storage
      const userData = localStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        const updatedUser = { ...parsedUser, ...formData }
        localStorage.setItem("user", JSON.stringify(updatedUser))
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/profile/traveler")
      }, 1500)
    } catch (err) {
      setError("Error al actualizar el perfil")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/profile/traveler">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Editar Perfil de Viajero</CardTitle>
            <CardDescription>Actualiza tu información personal y preferencias de viaje</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    ¡Perfil actualizado exitosamente! Redirigiendo...
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País de residencia</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma preferido</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Preferencias de viaje</Label>
                <div className="space-y-2">
                  {travelPreferences.map((pref) => (
                    <div key={pref.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={pref.id}
                        checked={formData.travel_preferences.includes(pref.id)}
                        onCheckedChange={(checked) => handlePreferenceChange(pref.id, checked as boolean)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={pref.id} className="font-normal cursor-pointer">
                        {pref.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild className="flex-1 bg-transparent" disabled={isLoading}>
                  <Link href="/profile/traveler">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
