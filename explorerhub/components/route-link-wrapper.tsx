"use client"

import { OpenStreetMapLink } from "./openstreetmap-link"
import { useState, useEffect } from "react"

interface RouteLinkWrapperProps {
  fromAddress: string
  fromCity: string
  toAddress: string
  toCity: string
  activityName: string
  fromActivityName: string
}

let instanceCounter = 0

export function RouteLinkWrapper({
  fromAddress,
  fromCity,
  toAddress,
  toCity,
  activityName,
  fromActivityName,
}: RouteLinkWrapperProps) {
  // Create a stable unique instance ID on mount
  const [instanceId] = useState(() => {
    instanceCounter++
    return `instance-${instanceCounter}-${fromActivityName}-to-${activityName}`
  })

  console.log('[RouteLinkWrapper] Rendering:', instanceId, {
    from: fromActivityName,
    to: activityName,
    fromAddress,
    toAddress
  })

  return (
    <div className="py-1">
      <OpenStreetMapLink
        key={instanceId}
        fromAddress={fromAddress}
        fromCity={fromCity}
        toAddress={toAddress}
        toCity={toCity}
        activityName={activityName}
        fromActivityName={fromActivityName}
        mode="foot-walking"
      />
    </div>
  )
}
