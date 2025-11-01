"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import styles from "./image-gallery.module.css"

interface ImageGalleryProps {
  images: string[]
  alt?: string
  className?: string
  showThumbnails?: boolean
}

export function ImageGallery({ images, alt = "Gallery image", className = "", showThumbnails = false }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={`${styles.noImages} ${className}`}>
        <span className={styles.noImagesText}>No hay imágenes disponibles</span>
      </div>
    )
  }

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const goToImage = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentIndex(index)
  }

  return (
    <div className={`${styles.root} ${className} group`}>
      {/* Main Image */}
      <div className={styles.mainImage}>
        <img
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className={styles.image}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg"
          }}
        />

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={`${styles.navButton} ${styles.navButtonLeft}`}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className={`${styles.navButton} ${styles.navButtonRight}`}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Image Counter */}
            <div className={styles.counter}>
              {currentIndex + 1} / {images.length}
            </div>

            {/* Dots Indicator */}
            <div className={styles.dotsContainer}>
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(index, e)}
                  className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ""}`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails - Optional */}
      {showThumbnails && images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => goToImage(index, e)}
              className={`${styles.thumbnail} ${index === currentIndex ? styles.thumbnailActive : ""}`}
            >
              <img
                src={image}
                alt={`Miniatura ${index + 1}`}
                className={styles.thumbnailImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
