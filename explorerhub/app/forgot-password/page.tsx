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
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import styles from "./page.module.css"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Error al enviar el email")
      }

      setSuccess("Se ha enviado un email con instrucciones para restablecer tu contraseña")
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
              <Mail className={styles.icon} />
            </div>
          </div>
          <CardTitle className={styles.title}>Olvidé mi contraseña</CardTitle>
          <CardDescription className={styles.description}>
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
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
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className={styles.footer}>
            <Button type="submit" className={styles.submitButton} size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={styles.loadingIcon} />
                  Enviando...
                </>
              ) : (
                "Enviar instrucciones"
              )}
            </Button>
            <div className={styles.footerText}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/sign-in")}
                className={styles.backButton}
              >
                <ArrowLeft className={styles.backIcon} />
                Volver al inicio de sesión
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
