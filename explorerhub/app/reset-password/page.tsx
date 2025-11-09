"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"
import styles from "./page.module.css"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Token de restablecimiento inválido")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Error al restablecer la contraseña")
      }

      setSuccess("Contraseña restablecida exitosamente")
      setTimeout(() => {
        router.push("/sign-in")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.backgroundOverlay} />
        <Card className={styles.card}>
          <CardContent className={styles.content}>
            <Alert variant="destructive">
              <AlertDescription>Token de restablecimiento inválido o expirado</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/forgot-password")} className={styles.submitButton}>
              Solicitar nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundOverlay} />
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <div className={styles.iconContainer}>
            <div className={styles.iconCircle}>
              <Lock className={styles.icon} />
            </div>
          </div>
          <CardTitle className={styles.title}>Restablecer contraseña</CardTitle>
          <CardDescription className={styles.description}>
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className={styles.content}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className={styles.fieldContainer}>
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className={styles.passwordContainer}>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={styles.passwordInput}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className={styles.eyeIcon} />
                  ) : (
                    <Eye className={styles.eyeIcon} />
                  )}
                </button>
              </div>
            </div>
            <div className={styles.fieldContainer}>
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className={styles.passwordContainer}>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={styles.passwordInput}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className={styles.eyeIcon} />
                  ) : (
                    <Eye className={styles.eyeIcon} />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button type="submit" className={styles.submitButton} size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={styles.loadingIcon} />
                  Restableciendo...
                </>
              ) : (
                "Restablecer contraseña"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
