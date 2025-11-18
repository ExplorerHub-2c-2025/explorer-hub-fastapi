"use client"

import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink } from "lucide-react"

interface CurrentLocationMapLinkProps {
  address: string
  city: string
  activityName?: string
}

export function CurrentLocationMapLink({ address, city, activityName }: CurrentLocationMapLinkProps) {
  const handleOpenMaps = () => {
    const location = `${address}, ${city}`.trim()
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`

    window.open(mapsUrl, "_blank")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenMaps}
      className="gap-2 w-full justify-center bg-transparent"
      title={`Ver ${activityName || "ubicación"} en Google Maps`}
    >
      <MapPin className="w-4 h-4" />
      <span>Ver en Google Maps</span>
      <ExternalLink className="w-3 h-3 ml-auto" />
    </Button>
  )
}
