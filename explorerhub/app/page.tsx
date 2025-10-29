"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import styles from "./page.module.css"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "business") {
        router.push("/dashboard/business")
        return
      }
    }
    // Redirect all users to explore page
    router.push("/explore")
  }, [router])

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    </div>
  )
}
