import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import styles from "./footer.module.css"

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <h3 className={styles.title}>ExplorerHub</h3>
            <p className={styles.textMuted}>
              Tu guía de viaje digital para descubrir experiencias locales auténticas.
            </p>
          </div>

          <div>
            <h4 className={styles.title}>Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/restaurants" className={styles.linkMuted}>
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link href="/activities" className={styles.linkMuted}>
                  Actividades
                </Link>
              </li>
              <li>
                <Link href="/attractions" className={styles.linkMuted}>
                  Atracciones
                </Link>
              </li>
              <li>
                <Link href="/experiences" className={styles.linkMuted}>
                  Experiencias
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={styles.title}>Compañía</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className={styles.linkMuted}>
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/business" className={styles.linkMuted}>
                  Para Negocios
                </Link>
              </li>
              <li>
                <Link href="/careers" className={styles.linkMuted}>
                  Carreras
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.linkMuted}>
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={styles.title}>Síguenos</h4>
            <div className={styles.icons}>
              <Link href="#" className={styles.linkMuted}>
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className={styles.linkMuted}>
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className={styles.linkMuted}>
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className={styles.linkMuted}>
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; 2025 ExplorerHub. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
