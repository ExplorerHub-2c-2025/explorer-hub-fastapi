/**
 * EJEMPLO DE USO: NotificationCardBadge
 * 
 * Este componente muestra un badge (círculo rojo con número) en la esquina
 * inferior derecha de cualquier contenedor.
 * 
 * Características:
 * - Solo se muestra si count > 0
 * - Muestra "99+" si count >= 100
 * - Posicionamiento absolute (requiere parent con position: relative)
 * - Animación sutil al aparecer
 * - Accesible con ARIA labels
 * - Responsive
 */

"use client"

import React from "react"
import { cn } from "@/lib/utils"

// ==========================================
// 1. UTILIDAD: Formatear contador del badge
// ==========================================
export const formatBadgeCount = (count: number): string => {
  if (count >= 100) return "99+"
  return count.toString()
}

// ==========================================
// 2. COMPONENTE: Badge de Notificación
// ==========================================
interface NotificationCardBadgeProps {
  count: number
  ariaLabel?: string
  className?: string
  variant?: "default" | "success" | "warning" | "danger"
}

export const NotificationCardBadge = ({ 
  count, 
  ariaLabel,
  className,
  variant = "danger"
}: NotificationCardBadgeProps) => {
  // No renderizar nada si count es 0 o negativo
  if (count <= 0) return null

  const displayCount = formatBadgeCount(count)
  const label = ariaLabel || `${count} notificación${count > 1 ? 'es' : ''} sin leer`

  // Variantes de color
  const variantStyles = {
    default: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  }

  return (
    <div
      className={cn(
        // Posicionamiento
        "absolute bottom-2 right-2 z-10",
        // Layout
        "flex items-center justify-center",
        // Tamaño
        "min-w-[20px] h-5 px-1.5",
        // Estilo
        "rounded-full text-white text-xs font-semibold shadow-md",
        // Animación
        "animate-in zoom-in-50 duration-200",
        // Variante de color
        variantStyles[variant],
        // Clases adicionales
        className
      )}
      aria-label={label}
      role="status"
      aria-live="polite"
    >
      {displayCount}
    </div>
  )
}

// ==========================================
// 3. EJEMPLO DE USO: Card con Badge
// ==========================================
interface NotificationCardProps {
  id: string
  title: string
  description: string
  date: string
  read: boolean
  unreadCount?: number
  icon?: React.ReactNode
  onClick?: () => void
}

export const NotificationCard = ({
  id,
  title,
  description,
  date,
  read,
  unreadCount = 0,
  icon,
  onClick
}: NotificationCardProps) => {
  return (
    <div
      className={cn(
        // IMPORTANTE: position relative para que el badge se posicione correctamente
        "relative",
        // Layout
        "flex gap-3 p-4",
        // Estado
        "cursor-pointer transition-colors hover:bg-gray-50",
        !read && "bg-blue-50/50",
        // Borde
        "border-b last:border-b-0"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Notificación: ${title}`}
    >
      {/* Ícono */}
      {icon && (
        <div className="flex-shrink-0 mt-1">
          {icon}
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-medium",
            !read && "text-gray-900 font-semibold"
          )}>
            {title}
          </p>
          {!read && (
            <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {description}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {date}
        </p>
      </div>

      {/* Badge: solo se muestra si hay unreadCount > 0 y la notificación no está leída */}
      {!read && unreadCount > 0 && (
        <NotificationCardBadge 
          count={unreadCount}
          ariaLabel={`${unreadCount} elementos en este grupo`}
        />
      )}
    </div>
  )
}

// ==========================================
// 4. EJEMPLO COMPLETO: Lista de Notificaciones
// ==========================================
export const NotificationListExample = () => {
  const notifications = [
    {
      id: "1",
      title: "Nuevas reservas",
      description: "María González y 2 personas más han realizado reservas.",
      date: "Hace 5 min",
      read: false,
      unreadCount: 3,
      icon: <span className="text-2xl">📅</span>
    },
    {
      id: "2",
      title: "Nuevas reseñas",
      description: "Has recibido nuevas reseñas en tus tours.",
      date: "Hace 1h",
      read: false,
      unreadCount: 5,
      icon: <span className="text-2xl">⭐</span>
    },
    {
      id: "3",
      title: "Promoción agotada",
      description: "El código VERANO2025 se ha acabado.",
      date: "Hace 2h",
      read: false,
      unreadCount: 0, // Sin badge
      icon: <span className="text-2xl">🏷️</span>
    },
    {
      id: "4",
      title: "Respuesta recibida",
      description: "Ana López respondió a tu comentario.",
      date: "Hace 1 día",
      read: true, // Leída: sin badge
      unreadCount: 1,
      icon: <span className="text-2xl">💬</span>
    }
  ]

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <div className="border-b p-4">
        <h3 className="font-semibold text-lg">Notificaciones</h3>
      </div>
      <div>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            {...notification}
            onClick={() => console.log(`Clicked: ${notification.id}`)}
          />
        ))}
      </div>
    </div>
  )
}

// ==========================================
// 5. SNIPPETS DE USO RÁPIDO
// ==========================================

/**
 * SNIPPET 1: Badge simple en cualquier contenedor
 * 
 * <div className="relative">
 *   <YourContent />
 *   <NotificationCardBadge count={5} />
 * </div>
 */

/**
 * SNIPPET 2: Badge condicional (solo si no está leído)
 * 
 * <div className="relative">
 *   <YourContent />
 *   {!isRead && unreadCount > 0 && (
 *     <NotificationCardBadge 
 *       count={unreadCount}
 *       ariaLabel={`${unreadCount} mensajes sin leer`}
 *     />
 *   )}
 * </div>
 */

/**
 * SNIPPET 3: Badge con diferentes variantes
 * 
 * <NotificationCardBadge count={3} variant="danger" />   // Rojo (default)
 * <NotificationCardBadge count={5} variant="warning" />  // Amarillo
 * <NotificationCardBadge count={10} variant="success" /> // Verde
 * <NotificationCardBadge count={2} variant="default" />  // Gris
 */

/**
 * SNIPPET 4: Badge personalizado con Tailwind
 * 
 * <NotificationCardBadge 
 *   count={150}  // Mostrará "99+"
 *   className="bottom-3 right-3 bg-purple-600 text-sm"
 *   ariaLabel="150 notificaciones pendientes"
 * />
 */

/**
 * SNIPPET 5: Uso en una card de producto
 * 
 * <div className="relative border rounded-lg p-4">
 *   <img src="/product.jpg" alt="Producto" />
 *   <h3>Producto</h3>
 *   <p>$99.99</p>
 *   
 *   {hasNewFeatures && (
 *     <NotificationCardBadge 
 *       count={3} 
 *       variant="warning"
 *       ariaLabel="3 nuevas características"
 *     />
 *   )}
 * </div>
 */

// ==========================================
// 6. TESTS (ejemplo con Jest)
// ==========================================

/**
 * import { render, screen } from '@testing-library/react'
 * import { NotificationCardBadge, formatBadgeCount } from './notification-card-badge'
 * 
 * describe('NotificationCardBadge', () => {
 *   test('no renderiza cuando count es 0', () => {
 *     const { container } = render(<NotificationCardBadge count={0} />)
 *     expect(container.firstChild).toBeNull()
 *   })
 * 
 *   test('muestra el número correcto', () => {
 *     render(<NotificationCardBadge count={5} />)
 *     expect(screen.getByText('5')).toBeInTheDocument()
 *   })
 * 
 *   test('muestra 99+ cuando count >= 100', () => {
 *     render(<NotificationCardBadge count={150} />)
 *     expect(screen.getByText('99+')).toBeInTheDocument()
 *   })
 * 
 *   test('tiene atributos ARIA correctos', () => {
 *     render(<NotificationCardBadge count={3} ariaLabel="3 mensajes" />)
 *     const badge = screen.getByRole('status')
 *     expect(badge).toHaveAttribute('aria-label', '3 mensajes')
 *   })
 * })
 * 
 * describe('formatBadgeCount', () => {
 *   test('formatea números menores a 100', () => {
 *     expect(formatBadgeCount(5)).toBe('5')
 *     expect(formatBadgeCount(99)).toBe('99')
 *   })
 * 
 *   test('formatea números >= 100 como 99+', () => {
 *     expect(formatBadgeCount(100)).toBe('99+')
 *     expect(formatBadgeCount(999)).toBe('99+')
 *   })
 * })
 */
