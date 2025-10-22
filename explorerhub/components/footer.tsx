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
              Your digital travel guide for discovering authentic local experiences.
            </p>
          </div>

          <div>
            <h4 className={styles.title}>Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/restaurants" className={styles.linkMuted}>
                  Restaurants
                </Link>
              </li>
              <li>
                <Link href="/activities" className={styles.linkMuted}>
                  Activities
                </Link>
              </li>
              <li>
                <Link href="/attractions" className={styles.linkMuted}>
                  Attractions
                </Link>
              </li>
              <li>
                <Link href="/experiences" className={styles.linkMuted}>
                  Experiences
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={styles.title}>Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className={styles.linkMuted}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/business" className={styles.linkMuted}>
                  For Business
                </Link>
              </li>
              <li>
                <Link href="/careers" className={styles.linkMuted}>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.linkMuted}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={styles.title}>Follow Us</h4>
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
          <p>&copy; 2025 ExplorerHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
