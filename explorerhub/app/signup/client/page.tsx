"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Users, CheckCircle2 } from "lucide-react"
import styles from "./page.module.css"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    country: "",
    language: "es",
  })
  const [preferences, setPreferences] = useState({
    adventure: false,
    culture: false,
    gastronomy: false,
    relax: false,
    nature: false,
  })
  const [isBusiness, setIsBusiness] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePreferenceChange = (preference: string, checked: boolean) => {
    setPreferences({
      ...preferences,
      [preference]: checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validación: Todos los campos requeridos
    if (!formData.name.trim()) {
      setError("El nombre es obligatorio")
      return
    }

    if (!formData.email.trim()) {
      setError("El correo electrónico es obligatorio")
      return
    }

    if (!formData.password) {
      setError("La contraseña es obligatoria")
      return
    }

    if (!formData.birthDate) {
      setError("La fecha de nacimiento es obligatoria")
      return
    }

    if (!formData.country.trim()) {
      setError("El país de residencia es obligatorio")
      return
    }

    // Validación: Contraseñas coinciden
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validación: Longitud de contraseña
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    // Validación: Edad +18
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!agreedToTerms) {
      setError("Debes aceptar los términos y condiciones")
      return
    }

    if (!formData.birthDate) {
      setError("La fecha de nacimiento es obligatoria")
      return
    }

    if (!formData.country) {
      setError("El país de residencia es obligatorio")
      return
    }
    if (age < 18) {
      setError("Debes ser mayor de 18 años para crear una cuenta")
      return
    }

    // Validación: Términos y condiciones
    if (!agreedToTerms) {
      setError("Debes aceptar los términos y condiciones")
      return
    }

    setIsLoading(true)

    try {
      const payload: any = {
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        role: isBusiness ? "business" : "client",
        birth_date: formData.birthDate,
        country: formData.country,
        language: formData.language,
        preferences: Object.keys(preferences).filter((key) => preferences[key as keyof typeof preferences]),
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejo específico para correo duplicado
        if (response.status === 400 && data.detail?.includes("already registered")) {
          throw new Error("Este correo electrónico ya está registrado. Por favor usa otro o inicia sesión.")
        }
        throw new Error(data.detail || "Error al crear la cuenta")
      }

      // Guardar token y usuario
      if (data?.access_token) {
        localStorage.setItem("token", data.access_token)
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      // Redirigir según el rol
      if (isBusiness) {
        router.push("/dashboard/business")
      } else {
        router.push("/explore")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundOverlay} />
      <Card className={styles.card}>
          <CardHeader className={styles.header}>
          <div className={styles.iconContainer}>
            <div className={styles.iconCircle}>
              <Users className={styles.icon} />
            </div>
          </div>
          <CardTitle className={styles.title}>Registro</CardTitle>
          <CardDescription className={styles.description}>Únete a ExplorerHub para descubrir experiencias increíbles o registrar tu negocio</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className={styles.content}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className={styles.grid}>
              <div className={styles.fieldContainer}>
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className={styles.fieldContainer}>
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <Checkbox id="isBusiness" checked={isBusiness} onCheckedChange={(c) => setIsBusiness(c as boolean)} disabled={isLoading} />
              <label htmlFor="isBusiness" className={styles.checkboxLabel}>
                Registrarme como administrador de negocio
              </label>
            </div>

            <div className={styles.grid}>
              <div className={styles.fieldContainer}>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className={styles.fieldContainer}>
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.fieldContainer}>
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className={styles.fieldContainer}>
                <Label htmlFor="country">País de residencia *</Label>
                <Input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="Argentina"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.fieldContainer}>
              <Label htmlFor="language">Idioma preferido</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.preferencesContainer}>
              <Label>Preferencias de viaje</Label>
              <div className={styles.preferencesGrid}>
                {[
                  { id: "adventure", label: "Aventura" },
                  { id: "culture", label: "Cultura" },
                  { id: "gastronomy", label: "Gastronomía" },
                  { id: "relax", label: "Relax" },
                  { id: "nature", label: "Naturaleza" },
                ].map((pref) => (
                  <div key={pref.id} className={styles.preferenceItem}>
                    <Checkbox
                      id={pref.id}
                      checked={preferences[pref.id as keyof typeof preferences]}
                      onCheckedChange={(checked) => handlePreferenceChange(pref.id, checked as boolean)}
                      disabled={isLoading}
                    />
                    <label htmlFor={pref.id} className={styles.preferenceLabel}>
                      {pref.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.termsContainer}>
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                disabled={isLoading}
              />
              <label htmlFor="terms" className={styles.termsLabel}>
                Acepto los{" "}
                <Link href="/terms" className={styles.termsLink}>
                  Términos de Servicio
                </Link>{" "}
                y la{" "}
                <Link href="/privacy" className={styles.termsLink}>
                  Política de Privacidad
                </Link>
              </label>
            </div>
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button type="submit" className={styles.submitButton} size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={styles.loadingIcon} />
                  Creando cuenta...
                </>
              ) : isBusiness ? (
                "Crear cuenta de negocio"
              ) : (
                "Crear cuenta"
              )}
            </Button>
            <p className={styles.footerText}>
              ¿Ya tienes cuenta?{" "}
              <Link href="/sign-in" className={styles.signinLink}>
                Iniciar sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
