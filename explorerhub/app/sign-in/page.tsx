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
import { Loader2, LogIn } from "lucide-react"
import styles from "./page.module.css"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Error al iniciar sesión")
      }

      // Guardar token y usuario
      localStorage.setItem("token", data.access_token)
      localStorage.setItem("user", JSON.stringify(data.user))

      // Redirigir según el rol
      if (data.user.role === "business") {
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
              <LogIn className={styles.icon} />
            </div>
          </div>
          <CardTitle className={styles.title}>Iniciar Sesión</CardTitle>
          <CardDescription className={styles.description}>Ingresa a tu cuenta de ExplorerHub</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className={styles.content}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
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
            <div className={styles.fieldContainer}>
              <div className={styles.labelRow}>
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
            <div className={styles.footerText}>
              <p className={styles.muted}>
                ¿No tienes cuenta?{" "}
                <Link href="/signup" className={styles.signupLink}>
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
