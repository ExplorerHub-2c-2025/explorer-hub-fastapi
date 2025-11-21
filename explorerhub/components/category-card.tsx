import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { CachedImage } from "@/components/cached-image"
import styles from "./category-card.module.css"

interface CategoryCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  image: string
}

export function CategoryCard({ title, description, icon: Icon, href, image }: CategoryCardProps) {
  return (
    <Link href={href} className={`${styles.root} group`}>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <CachedImage 
            src={image || "/placeholder.svg"} 
            alt={title} 
            className={`${styles.image} group-hover:scale-105`}
            fallback="/placeholder.svg"
          />
          <div className={styles.overlay} />
          <div className={styles.bottom}>
            <div className={styles.row}>
              <Icon className={styles.icon} />
              <h3 className={styles.title}>{title}</h3>
            </div>
            <p className={styles.desc}>{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
