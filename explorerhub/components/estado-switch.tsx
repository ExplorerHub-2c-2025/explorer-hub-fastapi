"use client"

import { useState, useEffect } from "react"

interface EstadoSwitchProps {
  initialState?: boolean
  onToggle?: (isActive: boolean) => void
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function EstadoSwitch({ 
  initialState = true, 
  onToggle,
  showLabel = true,
  size = "md"
}: EstadoSwitchProps) {
  const [isActive, setIsActive] = useState(initialState)

  // Sincronizar con el estado externo cuando cambia
  useEffect(() => {
    setIsActive(initialState)
  }, [initialState])

  const handleToggle = () => {
    const newState = !isActive
    setIsActive(newState)
    if (onToggle) {
      onToggle(newState)
    }
  }

  // Tamaños según el prop size
  const sizes = {
    sm: {
      container: "w-10 h-5",
      circle: "w-4 h-4",
      translate: "translate-x-5"
    },
    md: {
      container: "w-12 h-6",
      circle: "w-5 h-5",
      translate: "translate-x-6"
    },
    lg: {
      container: "w-16 h-8",
      circle: "w-7 h-7",
      translate: "translate-x-8"
    }
  }

  const currentSize = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        className={`
          relative inline-flex ${currentSize.container} items-center rounded-full
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isActive 
            ? 'bg-green-500 focus:ring-green-400' 
            : 'bg-gray-300 focus:ring-gray-400'
          }
        `}
        role="switch"
        aria-checked={isActive}
        aria-label={isActive ? "Activa" : "Inactiva"}
      >
        <span
          className={`
            ${currentSize.circle} inline-block transform rounded-full bg-white
            shadow-sm transition-transform duration-300 ease-in-out
            ${isActive ? currentSize.translate : 'translate-x-0.5'}
          `}
        />
      </button>
      
      {showLabel && (
        <span className={`text-sm font-semibold ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
          {isActive ? 'Activa' : 'Inactiva'}
        </span>
      )}
    </div>
  )
}
