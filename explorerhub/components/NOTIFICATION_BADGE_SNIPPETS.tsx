/**
 * 🚀 SNIPPET LISTO PARA USAR: Badge de Notificación
 * 
 * Copia y pega este código en cualquier componente donde necesites
 * mostrar un badge de contador en la esquina inferior derecha.
 */

"use client"

import React from "react"

// ============================================
// 💎 COMPONENTE COMPLETO - LISTO PARA COPIAR
// ============================================

interface BadgeProps {
  count: number
  ariaLabel?: string
}

export const NotificationBadge: React.FC<BadgeProps> = ({ count, ariaLabel }) => {
  // No renderizar si count <= 0
  if (count <= 0) return null

  // Formatear número (99+ si >= 100)
  const displayCount = count >= 100 ? "99+" : count.toString()
  
  // Label para accesibilidad
  const label = ariaLabel || `${count} notificación${count > 1 ? 'es' : ''} sin leer`

  return (
    <div
      className="absolute bottom-2 right-2 z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold shadow-md animate-in zoom-in-50 duration-200"
      aria-label={label}
      role="status"
      aria-live="polite"
    >
      {displayCount}
    </div>
  )
}

// ============================================
// 📝 EJEMPLO 1: Card de Notificación Simple
// ============================================

export const NotificationCardExample1 = () => {
  const unreadCount = 5

  return (
    <div className="relative p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
      <div className="flex gap-3">
        <span className="text-2xl">📅</span>
        <div>
          <h3 className="font-semibold">Nuevas reservas</h3>
          <p className="text-sm text-gray-600">
            María González y 4 personas más han realizado reservas
          </p>
          <p className="text-xs text-gray-400 mt-2">Hace 5 min</p>
        </div>
      </div>
      
      {/* Badge: solo aparece si unreadCount > 0 */}
      <NotificationBadge count={unreadCount} />
    </div>
  )
}

// ============================================
// 📝 EJEMPLO 2: Lista de Notificaciones
// ============================================

export const NotificationListExample = () => {
  const notifications = [
    {
      id: 1,
      icon: "📅",
      title: "Nuevas reservas",
      description: "María y 2 más reservaron",
      time: "Hace 5 min",
      read: false,
      unreadCount: 3
    },
    {
      id: 2,
      icon: "⭐",
      title: "Nuevas reseñas",
      description: "5 reseñas de 5 estrellas",
      time: "Hace 1h",
      read: false,
      unreadCount: 5
    },
    {
      id: 3,
      icon: "🏷️",
      title: "Promoción agotada",
      description: "Código VERANO2025 agotado",
      time: "Hace 2h",
      read: false,
      unreadCount: 0  // Sin badge
    }
  ]

  return (
    <div className="w-full max-w-md">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`relative p-4 border-b cursor-pointer hover:bg-gray-50 ${
            !notif.read ? "bg-blue-50/50" : ""
          }`}
        >
          <div className="flex gap-3">
            <span className="text-2xl">{notif.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-semibold text-sm">{notif.title}</h3>
                {!notif.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{notif.description}</p>
              <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
            </div>
          </div>
          
          {/* Badge: solo si no está leída Y tiene contador */}
          {!notif.read && notif.unreadCount > 0 && (
            <NotificationBadge count={notif.unreadCount} />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================
// 📝 EJEMPLO 3: Badge Condicional con Estado
// ============================================

export const ConditionalBadgeExample = () => {
  const [notifications, setNotifications] = React.useState({
    messages: 15,
    bookings: 3,
    reviews: 0  // No mostrará badge
  })

  return (
    <div className="flex gap-4">
      {/* Card 1: Mensajes */}
      <div className="relative w-32 h-32 p-4 border rounded-lg">
        <span className="text-2xl">💬</span>
        <p className="text-sm mt-2">Mensajes</p>
        <NotificationBadge count={notifications.messages} />
      </div>

      {/* Card 2: Reservas */}
      <div className="relative w-32 h-32 p-4 border rounded-lg">
        <span className="text-2xl">📅</span>
        <p className="text-sm mt-2">Reservas</p>
        <NotificationBadge count={notifications.bookings} />
      </div>

      {/* Card 3: Reseñas (sin badge porque count = 0) */}
      <div className="relative w-32 h-32 p-4 border rounded-lg">
        <span className="text-2xl">⭐</span>
        <p className="text-sm mt-2">Reseñas</p>
        <NotificationBadge count={notifications.reviews} />
      </div>
    </div>
  )
}

// ============================================
// 📝 EJEMPLO 4: Badge con Custom Styles
// ============================================

export const CustomStyledBadge = () => {
  return (
    <div className="relative p-4 border rounded-lg">
      <h3>Contenido personalizado</h3>
      
      {/* Badge personalizado con inline styles */}
      <div
        className="absolute bottom-2 right-2 flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-purple-600 text-white text-sm font-bold shadow-lg"
        aria-label="150 notificaciones"
        role="status"
      >
        99+
      </div>
    </div>
  )
}

// ============================================
// 📝 EJEMPLO 5: Badge en Diferentes Posiciones
// ============================================

export const BadgePositionsExample = () => {
  return (
    <div className="space-y-4">
      {/* Top Right */}
      <div className="relative p-4 border rounded-lg">
        <p>Badge arriba a la derecha</p>
        <div className="absolute top-2 right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
          5
        </div>
      </div>

      {/* Top Left */}
      <div className="relative p-4 border rounded-lg">
        <p>Badge arriba a la izquierda</p>
        <div className="absolute top-2 left-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
          3
        </div>
      </div>

      {/* Bottom Right (default) */}
      <div className="relative p-4 border rounded-lg">
        <p>Badge abajo a la derecha (default)</p>
        <NotificationBadge count={7} />
      </div>

      {/* Bottom Left */}
      <div className="relative p-4 border rounded-lg">
        <p>Badge abajo a la izquierda</p>
        <div className="absolute bottom-2 left-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
          12
        </div>
      </div>
    </div>
  )
}

// ============================================
// 📝 EJEMPLO 6: Badge con Diferentes Variantes
// ============================================

interface BadgeVariantProps {
  count: number
  variant?: "danger" | "warning" | "success" | "info"
  ariaLabel?: string
}

export const BadgeVariant: React.FC<BadgeVariantProps> = ({ 
  count, 
  variant = "danger",
  ariaLabel 
}) => {
  if (count <= 0) return null

  const variants = {
    danger: "bg-red-500",
    warning: "bg-yellow-500",
    success: "bg-green-500",
    info: "bg-blue-500"
  }

  const displayCount = count >= 100 ? "99+" : count.toString()
  const label = ariaLabel || `${count} notificaciones`

  return (
    <div
      className={`absolute bottom-2 right-2 z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full ${variants[variant]} text-white text-xs font-semibold shadow-md animate-in zoom-in-50 duration-200`}
      aria-label={label}
      role="status"
    >
      {displayCount}
    </div>
  )
}

export const BadgeVariantsExample = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative p-4 border rounded-lg">
        <p>Danger (default)</p>
        <BadgeVariant count={5} variant="danger" />
      </div>
      <div className="relative p-4 border rounded-lg">
        <p>Warning</p>
        <BadgeVariant count={3} variant="warning" />
      </div>
      <div className="relative p-4 border rounded-lg">
        <p>Success</p>
        <BadgeVariant count={10} variant="success" />
      </div>
      <div className="relative p-4 border rounded-lg">
        <p>Info</p>
        <BadgeVariant count={150} variant="info" />
      </div>
    </div>
  )
}

// ============================================
// 🎯 INSTRUCCIONES DE USO
// ============================================

/**
 * 1. Copiar el componente NotificationBadge
 * 2. Agregar a tu proyecto
 * 3. Usar en cualquier contenedor con position: relative
 * 4. Pasar el prop "count" con el número a mostrar
 * 
 * Requisitos:
 * - Parent debe tener "position: relative"
 * - Tailwind CSS configurado
 * - React 18+
 * 
 * Ejemplo mínimo:
 * 
 * <div className="relative p-4 border">
 *   <h3>Mi contenido</h3>
 *   <NotificationBadge count={5} />
 * </div>
 */
