"use client"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TripPlanner } from "@/components/trip-planner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewTripPage() {
  const router = useRouter()

  const handleCreateTrip = async (data: any) => {
    try {
      // API call would go here
      console.log("Creating trip:", data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/trips")
    } catch (error) {
      console.error("Error creating trip:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/trips">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
            </Button>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Trip</h1>
            <p className="text-muted-foreground">Plan your next adventure with personalized recommendations</p>
          </div>

          <TripPlanner onCreateTrip={handleCreateTrip} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
