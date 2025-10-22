import { CategoryCard } from "@/components/category-card"
import { Footer } from "@/components/footer"
import { UtensilsCrossed, Compass, Mountain, Ticket, Star, Plane, Users, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const categories = [
    {
      title: "Restaurants",
      description: "Discover local cuisine and dining experiences",
      icon: UtensilsCrossed,
      href: "/explore?category=restaurants",
      image: "/restaurant-dining.jpg",
    },
    {
      title: "Activities",
      description: "Find exciting things to do",
      icon: Compass,
      href: "/explore?category=activities",
      image: "/diverse-outdoor-activities.png",
    },
    {
      title: "Attractions",
      description: "Visit must-see landmarks and sites",
      icon: Ticket,
      href: "/explore?category=attractions",
      image: "/tourist-attractions.jpg",
    },
    {
      title: "Nature",
      description: "Explore parks, trails, and outdoor spaces",
      icon: Mountain,
      href: "/explore?category=nature",
      image: "/nature-hiking.jpg",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <Plane className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Bienvenido a ExplorerHub</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
          Descubre experiencias únicas o promociona tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Soy viajero</CardTitle>
            <CardDescription className="text-base">
              Explora destinos, planifica viajes y descubre experiencias auténticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/signup/client">Crear cuenta</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
              <Link href="/sign-in/client">Iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Tengo un negocio / hotel</CardTitle>
            <CardDescription className="text-base">
              Promociona tu negocio y alcanza a más viajeros en todo el mundo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/signup/business">Crear cuenta</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
              <Link href="/sign-in/business">Iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8">Explore by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">Plan Your Perfect Trip</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Our intelligent trip planner creates personalized itineraries based on your interests, available time,
                and location. Get custom routes that help you make the most of every moment.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent fill-accent" />
                  <span>Personalized recommendations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent fill-accent" />
                  <span>Custom route generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent fill-accent" />
                  <span>Exclusive deals and discounts</span>
                </li>
              </ul>
              <Button size="lg">Start Planning</Button>
            </div>
            <div className="flex-1">
              <img src="/travel-planning-map.png" alt="Trip planning" className="rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Business CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="bg-primary text-primary-foreground rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Are You a Business Owner?</h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
              Join ExplorerHub to promote your business, reach more travelers, and grow your customer base with our
              powerful business tools.
            </p>
            <Button size="lg" variant="secondary">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
