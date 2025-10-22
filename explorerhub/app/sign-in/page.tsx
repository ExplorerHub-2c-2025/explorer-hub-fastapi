import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Briefcase } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
              <span className="text-3xl font-bold text-primary-foreground">T</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome back to ExplorerHub</h1>
          <p className="text-muted-foreground text-lg">Choose how you want to sign in</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">I'm a Traveler</CardTitle>
              <CardDescription className="text-base">
                Discover amazing experiences, read reviews, and plan your perfect trip
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/sign-in/client">Sign In as Traveler</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <CardTitle className="text-2xl">I'm a Business</CardTitle>
              <CardDescription className="text-base">
                Manage your listings, connect with travelers, and grow your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg" variant="secondary">
                <Link href="/sign-in/business">Sign In as Business</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-muted-foreground mt-8">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
