"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Plus } from "lucide-react"
import Link from "next/link"
import styles from "./page.module.css"

export default function TripsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role === "business") {
      router.push("/dashboard/business")
      return
    }
    setIsAuthorized(true)
  }, [router])

  if (!isAuthorized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    )
  }
  // Mock data - will be replaced with API calls
  const trips = [
    {
      id: "1",
      name: "Summer in Italy",
      destination: "Rome, Florence, Venice",
      startDate: "2025-07-15",
      endDate: "2025-07-25",
      activities: 12,
      image: "/italy-travel-rome-colosseum.jpg",
    },
    {
      id: "2",
      name: "Tokyo Adventure",
      destination: "Tokyo, Kyoto, Osaka",
      startDate: "2025-09-10",
      endDate: "2025-09-20",
      activities: 8,
      image: "/tokyo-skyline.png",
    },
  ]

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.headerSection}>
          <div className={styles.headerText}>
            <h1>Viajes</h1>
            <p>Planifica y organiza tus aventuras de viaje</p>
          </div>
          <Link href="/trips/new">
            <Button className={styles.createButton}>
              <Plus className={styles.buttonIcon} />
              Crear Viaje
            </Button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <Card className={styles.emptyState}>
            <CardContent>
              <div className={styles.emptyStateContent}>
                <MapPin className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Aún no tienes viajes</h3>
                <p className={styles.emptyText}>
                  Comienza a planificar tu próxima aventura creando tu primer viaje
                </p>
                <Link href="/trips/new">
                  <Button>
                    <Plus className={styles.buttonIcon} />
                    Crear Tu Primer Viaje
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.tripsGrid}>
            {trips.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className={styles.tripCard}>
                  <div className={styles.tripImage}>
                    <img
                      src={trip.image || "/placeholder.svg"}
                      alt={trip.name}
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{trip.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.tripContent}>
                      <div className={styles.tripInfo}>
                        <MapPin className={styles.infoIcon} />
                        <span>{trip.destination}</span>
                      </div>
                      <div className={styles.tripInfo}>
                        <Calendar className={styles.infoIcon} />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} -{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.tripActivities}>
                        <span className={styles.activitiesText}>{trip.activities} actividades planeadas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
