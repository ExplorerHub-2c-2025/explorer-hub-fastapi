"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUser, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

import styles from "./header.module.css"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = getUser()
    setUser(userData)
  }, [])

  const handleLogout = () => {
    logout()
    setUser(null)
    router.push("/")
  }

  return (
    <header className={styles.root}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.brandLink}>
            <img 
              src="/images/logo_transparent.png" 
              alt="ExplorerHub Logo" 
              className={styles.brandIcon}
              style={{ height: '2.5rem', width: 'auto' }}
            />
            <span className={styles.brandText}>ExplorerHub</span>
          </Link>

          <nav className={styles.nav}>
            {user && user.role === "business" ? (
              <>
                <Link href="/dashboard/business" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/dashboard/business/analytics" className="text-sm font-medium hover:text-primary transition-colors">
                  Analytics
                </Link>
              </>
            ) : (
              <>
                <Link href="/explore" className="text-sm font-medium hover:text-primary transition-colors">
                  Explorar
                </Link>
                {user && (
                  <>
                    <Link href="/trips" className="text-sm font-medium hover:text-primary transition-colors">
                      Mis Viajes
                    </Link>
                    <Link href="/reviews" className="text-sm font-medium hover:text-primary transition-colors">
                      Reseñas
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        <div className={styles.right}>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className={styles.userHidden}>{user.name || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user.role === "business" ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/business" className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/business/analytics" className="cursor-pointer">
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/business/edit-profile" className="cursor-pointer">
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/trips" className="cursor-pointer">
                        Mis Viajes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/reviews" className="cursor-pointer">
                        Reseñas
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/traveler" className="cursor-pointer">
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Iniciar Sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Registrarse</Link>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
