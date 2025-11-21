"use client"

import { useState, useEffect } from "react"

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  onLoadSuccess?: () => void
  onLoadError?: () => void
}

// Cache global para almacenar el estado de las URLs
const imageCache = new Map<string, 'error'>()

export function CachedImage({ 
  src, 
  alt, 
  fallback = "/placeholder.svg",
  onLoadSuccess,
  onLoadError,
  ...props 
}: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
    
    if (!src || src.trim() === "") {
      setImageSrc(fallback)
      return
    }

    // Si ya sabemos que falló antes, usar fallback directamente
    if (imageCache.has(src)) {
      setImageSrc(fallback)
      setHasError(true)
    } else {
      setImageSrc(src)
    }
  }, [src, fallback])

  const handleError = () => {
    if (!hasError) {
      console.log("❌ Imagen falló al cargar:", src)
      imageCache.set(src, 'error')
      setImageSrc(fallback)
      setHasError(true)
      onLoadError?.()
    }
  }

  const handleLoad = () => {
    console.log("✅ Imagen cargada exitosamente:", src)
    onLoadSuccess?.()
  }

  return (
    <img 
      {...props}
      src={imageSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  )
}

// Hook para verificar si una imagen está en caché
export function useImageCache(src: string): 'error' | 'idle' {
  const [status, setStatus] = useState<'error' | 'idle'>('idle')

  useEffect(() => {
    if (!src || src === "/placeholder.svg") {
      setStatus('error')
      return
    }

    const cached = imageCache.get(src)
    if (cached) {
      setStatus('error')
    } else {
      setStatus('idle')
    }
  }, [src])

  return status
}

// Función para limpiar caché (útil para admin/debug)
export function clearImageCache() {
  imageCache.clear()
}

// Función para pre-cargar imágenes
export function preloadImages(urls: string[]) {
  urls.forEach(url => {
    if (!url || url === "/placeholder.svg" || imageCache.has(url)) return
    
    const img = new Image()
    img.onerror = () => imageCache.set(url, 'error')
    img.src = url
  })
}
