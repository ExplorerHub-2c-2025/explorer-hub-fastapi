"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ReviewForm } from "@/components/review-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WriteReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  // Mock data - would be fetched from API
  const business = {
    id: resolvedParams.id,
    name: "La Bella Vista Restaurant",
  }

  const handleSubmit = async (data: any) => {
    try {
      // API call would go here
      console.log("Submitting review:", data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push(`/activity/${resolvedParams.id}`)
    } catch (error) {
      console.error("Error submitting review:", error)
    }
  }

  const handleCancel = () => {
    router.push(`/activity/${resolvedParams.id}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href={`/activity/${resolvedParams.id}`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {business.name}
            </Button>
          </Link>

          <ReviewForm
            businessId={business.id}
            businessName={business.name}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
