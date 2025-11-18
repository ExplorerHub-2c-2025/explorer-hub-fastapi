"use client"

import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink } from "lucide-react"

interface GoogleMapsLinkProps {
  fromAddress: string
  fromCity: string
  toAddress: string
  toCity: string
  activityName?: string
}

export function GoogleMapsLink({ fromAddress, fromCity, toAddress, toCity, activityName }: GoogleMapsLinkProps) {
  const handleOpenMaps = () => {
    const origin = `${fromAddress}, ${fromCity}`.trim()
    const destination = `${toAddress}, ${toCity}`.trim()

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=transit`

    window.open(mapsUrl, "_blank")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenMaps}
      className="gap-2 w-full justify-center bg-transparent"
      title={`Ruta a ${activityName || "destino"}`}
    >
      <MapPin className="w-4 h-4" />
      <span>Ver en Google Maps</span>
      <ExternalLink className="w-3 h-3 ml-auto" />
    </Button>
  )
}
