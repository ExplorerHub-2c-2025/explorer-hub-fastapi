import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProfilePictureUrl(profilePicture: string | null | undefined): string {
  if (!profilePicture) {
    return '/images/blank-profile-picture.png'
  }
  
  // Si es una URL externa (empieza con http/https), usarla directamente
  if (profilePicture.startsWith('http')) {
    return profilePicture
  }
  
  // Si es una ruta relativa, añadir el prefijo del backend
  return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}${profilePicture}`
}
