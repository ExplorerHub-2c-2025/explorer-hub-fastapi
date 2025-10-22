"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Settings, Upload, LogOut } from "lucide-react"

export default function BusinessDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/sign-in/business")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (!parsedUser.is_business) {
      router.push("/profile/traveler")
      return
    }
    setUser(parsedUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
    router.refresh()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">¡Bienvenido, {user.name}!</h1>
            <p className="text-muted-foreground">Panel de control de negocio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Editar Perfil del Negocio</CardTitle>
                    <CardDescription>Actualiza la información de tu negocio</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/business/edit-profile">Editar perfil</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Publicar Negocio</CardTitle>
                    <CardDescription>Agrega fotos y detalles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/business/new">Publicar negocio</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Mis Negocios</CardTitle>
                    <CardDescription>Ver y gestionar tus publicaciones</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/business">Ver mis negocios</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <LogOut className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <CardTitle>Cerrar Sesión</CardTitle>
                    <CardDescription>Salir de tu cuenta</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                  Cerrar sesión
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-muted-foreground">Nombre del negocio:</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              {user.business_type && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-muted-foreground">Tipo de negocio:</span>
                  <span className="font-medium capitalize">{user.business_type}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Teléfono:</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
