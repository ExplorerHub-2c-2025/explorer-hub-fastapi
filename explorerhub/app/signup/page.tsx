import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Briefcase } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
              <span className="text-3xl font-bold text-primary-foreground">T</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Join ExplorerHub</h1>
          <p className="text-muted-foreground text-lg">Choose the account type that's right for you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Traveler Account</CardTitle>
              <CardDescription className="text-base">
                Perfect for exploring destinations, booking experiences, and planning trips
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Discover and book experiences</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Write reviews and share photos</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Create personalized trip itineraries</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Save favorites and get recommendations</span>
                </li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/signup/client">Create Traveler Account</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-secondary/50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Business Account</CardTitle>
              <CardDescription className="text-base">
                Ideal for restaurants, tour operators, and activity providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>List your business and services</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Manage bookings and reservations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Access analytics and insights</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Respond to reviews and engage customers</span>
                </li>
              </ul>
              <Button asChild className="w-full" size="lg" variant="secondary">
                <Link href="/signup/business">Create Business Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
