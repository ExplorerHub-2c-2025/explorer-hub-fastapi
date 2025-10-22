import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ThumbsUp } from "lucide-react"

export default function ReviewsPage() {
  // Mock data
  const reviews = [
    {
      id: "1",
      activityName: "La Bella Vista Restaurant",
      rating: 5,
      date: "2025-01-15",
      text: "Amazing experience! The food was exceptional and the service was outstanding. Highly recommend the pasta dishes.",
      helpful: 12,
    },
    {
      id: "2",
      activityName: "Mountain Hiking Adventure",
      rating: 4,
      date: "2025-01-10",
      text: "Great hiking experience with knowledgeable guides. The views were breathtaking. Would do it again!",
      helpful: 8,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">My Reviews</h1>
          <p className="text-muted-foreground mb-8">Share your experiences and help other travelers</p>

          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">{review.activityName}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">{review.text}</p>

                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Helpful ({review.helpful})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
