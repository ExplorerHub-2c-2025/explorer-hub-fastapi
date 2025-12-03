"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Loader2, Zap, Clock, Star, MapPin, Heart } from "lucide-react"
import { FlashSaleBadgeCompact } from "@/components/flash-sale-badge"

import styles from "../explore/page.module.css"

interface FlashPromotion {
  id: number
  business_id: number
  business_name: string
  business_image?: string
  business_rating?: number
  business_location?: string
  business_categories?: string[]
  title: string
  description?: string
  discount_percentage?: number
  discount_amount?: number
  start_date: string
  flash_duration_hours: number
  current_uses: number
  max_uses?: number
  min_purchase?: number
}

export default function FlashSalesPage() {
  const router = useRouter()
  const [flashPromotions, setFlashPromotions] = useState<FlashPromotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchFlashPromotions()
  }, [])

  // Update countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft: Record<number, string> = {}
      
      flashPromotions.forEach((promo) => {
        const start = new Date(promo.start_date)
        const end = new Date(start.getTime() + promo.flash_duration_hours * 60 * 60 * 1000)
        const now = new Date()
        const diff = end.getTime() - now.getTime()

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          
          newTimeLeft[promo.id] = `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`
        }
      })

      setTimeLeft(newTimeLeft)
    }, 1000)

    return () => clearInterval(interval)
  }, [flashPromotions])

  const fetchFlashPromotions = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"}/api/promotions/flash-sales`
      )

      if (!response.ok) {
        console.error("Error fetching flash promotions")
        setFlashPromotions([])
        return
      }

      const data = await response.json()
      setFlashPromotions(data)
    } catch (error) {
      console.error("Error:", error)
      setFlashPromotions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromotionClick = (businessId: number) => {
    router.push(`/activity/${businessId}`)
  }

  const getDiscountText = (promo: FlashPromotion) => {
    if (promo.discount_percentage) {
      return `${promo.discount_percentage}% OFF`
    }
    if (promo.discount_amount) {
      return `$${promo.discount_amount} OFF`
    }
    return "Oferta Especial"
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header Section */}
          <div style={{ 
            padding: "2rem 0", 
            textAlign: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: "12px",
            marginBottom: "2rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Zap size={32} />
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>Ofertas Flash</h1>
            </div>
            <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>
              ¡Aprovecha estas ofertas por tiempo limitado!
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
              <Loader2 className="animate-spin" size={48} />
            </div>
          )}

          {/* No Results */}
          {!isLoading && flashPromotions.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              padding: "4rem 2rem",
              background: "#f8f9fa",
              borderRadius: "12px"
            }}>
              <Zap size={64} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                No hay ofertas flash activas
              </h2>
              <p style={{ color: "#666", marginBottom: "1.5rem" }}>
                Vuelve pronto para descubrir nuevas ofertas por tiempo limitado
              </p>
              <Button onClick={() => router.push("/explore")}>
                Explorar Actividades
              </Button>
            </div>
          )}

          {/* Flash Promotions Grid */}
          {!isLoading && flashPromotions.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
              padding: "1rem 0"
            }}>
              {flashPromotions.map((promo) => (
                <div
                  key={promo.id}
                  onClick={() => handlePromotionClick(promo.business_id)}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)"
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                >
                  {/* Flash Badge */}
                  <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", zIndex: 10 }}>
                    <FlashSaleBadgeCompact 
                      durationHours={promo.flash_duration_hours}
                      discountPercentage={promo.discount_percentage}
                    />
                  </div>

                  {/* Image */}
                  <div style={{ 
                    width: "100%", 
                    height: "200px", 
                    background: promo.business_image 
                      ? `url(${promo.business_image}) center/cover` 
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  }} />

                  {/* Content */}
                  <div style={{ padding: "1.25rem" }}>
                    <h3 style={{ 
                      fontSize: "1.25rem", 
                      fontWeight: "bold", 
                      marginBottom: "0.5rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {promo.business_name}
                    </h3>

                    <p style={{ 
                      fontSize: "1rem", 
                      color: "#333",
                      marginBottom: "0.75rem",
                      fontWeight: "500"
                    }}>
                      {promo.title}
                    </p>

                    {promo.description && (
                      <p style={{ 
                        fontSize: "0.9rem", 
                        color: "#666",
                        marginBottom: "0.75rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {promo.description}
                      </p>
                    )}

                    {/* Location & Rating */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "1rem",
                      marginBottom: "0.75rem",
                      fontSize: "0.9rem",
                      color: "#666"
                    }}>
                      {promo.business_location && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <MapPin size={14} />
                          <span>{promo.business_location}</span>
                        </div>
                      )}
                      {promo.business_rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                          <span>{promo.business_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Countdown Timer */}
                    {timeLeft[promo.id] && (
                      <div style={{
                        background: "#f8f9fa",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        marginBottom: "0.75rem"
                      }}>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.5rem",
                          justifyContent: "center"
                        }}>
                          <Clock size={16} style={{ color: "#ff4444" }} />
                          <span style={{ 
                            fontWeight: "bold", 
                            fontSize: "1.1rem",
                            fontFamily: "monospace",
                            color: "#ff4444"
                          }}>
                            {timeLeft[promo.id]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Availability */}
                    {promo.max_uses && (
                      <div style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        marginBottom: "0.5rem"
                      }}>
                        {promo.current_uses} / {promo.max_uses} usos
                        <div style={{
                          width: "100%",
                          height: "4px",
                          background: "#e0e0e0",
                          borderRadius: "2px",
                          marginTop: "0.25rem",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${(promo.current_uses / promo.max_uses) * 100}%`,
                            height: "100%",
                            background: "#667eea",
                            transition: "width 0.3s"
                          }} />
                        </div>
                      </div>
                    )}

                    {promo.min_purchase && (
                      <p style={{ 
                        fontSize: "0.85rem", 
                        color: "#666",
                        marginTop: "0.5rem"
                      }}>
                        Compra mínima: ${promo.min_purchase}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
