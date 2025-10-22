"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BusinessForm } from "@/components/business-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "business") {
      router.push("/explore")
      return
    }
    setIsAuthorized(true)
  }, [router])

  // Mock data - would be fetched from API
  const [initialData, setInitialData] = useState<any | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    const fetchBusiness = async () => {
      try {
        const res = await fetch(`/api/businesses/${resolvedParams.id}`)
        if (res.ok) {
          const data = await res.json()
          setInitialData(data)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchBusiness()
  }, [resolvedParams.id])

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/businesses/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed to update business")
      router.push("/dashboard/business")
    } catch (error) {
      console.error("Error updating business:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard/business">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Editar Negocio</h1>
            <p className="text-muted-foreground">Actualiza la información de tu negocio</p>
          </div>

          <BusinessForm onSubmit={handleSubmit} initialData={initialData || {}} isLoading={isLoading} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
