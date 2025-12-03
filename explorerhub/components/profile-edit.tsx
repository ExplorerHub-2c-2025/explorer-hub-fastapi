"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Loader2, Check, X } from "lucide-react"
import { getProfilePictureUrl } from "@/lib/utils"
import styles from "./profile-edit.module.css"

interface ProfileEditProps {
  user: any
  onUpdate: (data: any) => Promise<void>
}

export function ProfileEdit({ user, onUpdate }: ProfileEditProps) {
  const [username, setUsername] = useState(user?.username || "")
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture || null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const checkUsernameAvailability = async (newUsername: string) => {
    if (newUsername === user?.username || !newUsername) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:8000'}/api/auth/check-username/${newUsername}`
      )
      const data = await response.json()
      setUsernameAvailable(data.available)
    } catch (err) {
      console.error("Error checking username:", err)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username && username !== user?.username) {
        checkUsernameAvailability(username)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [username])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen debe ser menor a 5MB")
      return
    }

    setIsUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:8000'}/api/profile/upload-picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error("Error al subir la imagen")
      }

      const data = await response.json()
      setProfilePicture(data.profile_picture)
      setSuccess("Foto de perfil actualizada correctamente")
      
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      userData.profile_picture = data.profile_picture
      localStorage.setItem("user", JSON.stringify(userData))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      setError("El nombre de usuario es requerido")
      return
    }

    if (username !== user?.username && !usernameAvailable) {
      setError("El nombre de usuario no está disponible")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      await onUpdate({
        username: username.trim(),
        full_name: fullName.trim(),
      })
      setSuccess("Perfil actualizado correctamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Editar Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Profile Picture */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <img
                src={getProfilePictureUrl(profilePicture)}
                alt={username}
                className={styles.avatar}
              />
              <label htmlFor="profile-picture" className={styles.uploadButton}>
                {isUploading ? (
                  <Loader2 className={styles.uploadIcon + " " + styles.spinning} />
                ) : (
                  <Camera className={styles.uploadIcon} />
                )}
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
                disabled={isUploading}
              />
            </div>
            <p className={styles.avatarHint}>
              JPG, PNG o WebP. Máximo 5MB.
            </p>
          </div>

          {/* Username */}
          <div className={styles.field}>
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className={styles.inputWrapper}>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                placeholder="juanperez"
                required
              />
              {isCheckingUsername && (
                <Loader2 className={styles.statusIcon + " " + styles.spinning} />
              )}
              {!isCheckingUsername && usernameAvailable === true && (
                <Check className={styles.statusIcon + " " + styles.success} />
              )}
              {!isCheckingUsername && usernameAvailable === false && (
                <X className={styles.statusIcon + " " + styles.error} />
              )}
            </div>
            {usernameAvailable === false && (
              <p className={styles.errorText}>Este nombre de usuario ya está en uso</p>
            )}
            {usernameAvailable === true && (
              <p className={styles.successText}>Nombre de usuario disponible</p>
            )}
          </div>

          {/* Full Name */}
          <div className={styles.field}>
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
              required
            />
          </div>

          {/* Error/Success Messages */}
          {error && <div className={styles.alert + " " + styles.alertError}>{error}</div>}
          {success && <div className={styles.alert + " " + styles.alertSuccess}>{success}</div>}

          {/* Submit Button */}
          <Button type="submit" disabled={isSaving || isCheckingUsername} className={styles.submitButton}>
            {isSaving ? (
              <>
                <Loader2 className={styles.buttonIcon + " " + styles.spinning} />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
