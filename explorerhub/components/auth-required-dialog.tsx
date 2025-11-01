"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import styles from "./auth-required-dialog.module.css"

interface AuthRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
  title = "Inicia sesión para continuar",
  description = "Necesitas una cuenta para realizar esta acción. ¿Ya tienes una cuenta o prefieres crear una nueva?",
}: AuthRequiredDialogProps) {
  const router = useRouter()

  useEffect(() => {
    console.log("AuthRequiredDialog - open:", open)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader className={styles.dialogHeader}>
          <DialogTitle className={styles.dialogTitle}>{title}</DialogTitle>
          <DialogDescription className={styles.dialogDescription}>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.buttonContainer}>
          <Button
            onClick={() => {
              onOpenChange(false)
              router.push("/sign-in")
            }}
            size="lg"
            className={styles.button}
          >
            Iniciar Sesión
          </Button>

          <Button
            onClick={() => {
              onOpenChange(false)
              router.push("/signup")
            }}
            variant="outline"
            size="lg"
            className={styles.button}
          >
            Registrarse
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
