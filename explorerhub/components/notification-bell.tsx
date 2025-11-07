"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, MapPin, DollarSign, Tag, Calendar, MessageSquare, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  pollNotifications,
  type Notification,
} from "@/lib/notificationsService"
import { isAuthenticated } from "@/lib/auth"
import styles from "./notification-bell.module.css"

export type NotificationType = 
  | "address_change"
  | "price_change"
  | "new_promotion"
  | "booking_pending"
  | "booking_confirmed"
  | "booking_cancelled"
  | "new_review"
  | "review_response"
  | "new_booking"
  | "promo_expired"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "address_change":
      return <MapPin className="h-5 w-5 text-blue-500" />
    case "price_change":
      return <DollarSign className="h-5 w-5 text-green-500" />
    case "new_promotion":
      return <Tag className="h-5 w-5 text-purple-500" />
    case "booking_pending":
      return <Calendar className="h-5 w-5 text-yellow-500" />
    case "booking_confirmed":
      return <Check className="h-5 w-5 text-green-500" />
    case "booking_cancelled":
      return <X className="h-5 w-5 text-red-500" />
    case "new_review":
    case "review_response":
      return <MessageSquare className="h-5 w-5 text-blue-500" />
    case "new_booking":
      return <Calendar className="h-5 w-5 text-indigo-500" />
    case "promo_expired":
      return <AlertCircle className="h-5 w-5 text-orange-500" />
    default:
      return <Bell className="h-5 w-5 text-gray-500" />
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Ahora mismo"
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return date.toLocaleDateString("es-ES", { 
    day: "numeric", 
    month: "short" 
  })
}

const formatBadgeCount = (count: number): string => {
  if (count >= 100) return "99+"
  return count.toString()
}

interface NotificationCardBadgeProps {
  count: number
  ariaLabel?: string
}

const NotificationCardBadge = ({ count, ariaLabel }: NotificationCardBadgeProps) => {
  if (count <= 0) return null

  const displayCount = formatBadgeCount(count)
  const label = ariaLabel || `${count} notificación${count > 1 ? 'es' : ''} sin leer`

  return (
    <div
      className="absolute bottom-2 right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold shadow-md animate-in zoom-in-50 duration-200"
      aria-label={label}
      role="status"
      aria-live="polite"
    >
      {displayCount}
    </div>
  )
}

interface NotificationBellProps {
  userRole?: string
}

export function NotificationBell({ userRole = "traveler" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const cleanup = pollNotifications((newNotifications) => {
      setNotifications(newNotifications)
      setUnreadCount(newNotifications.filter(n => !n.read).length)
    }, 30000)

    return cleanup
  }, [])

  const loadNotifications = async () => {
    // Don't try to load notifications if not authenticated
    if (!isAuthenticated()) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getNotifications(0, 50)
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch (err: any) {
      console.error('Error loading notifications:', err)
      setError('Error al cargar notificaciones')
      // If not authenticated, just show empty state
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setNotifications([])
        setUnreadCount(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.link) {
      window.location.href = notification.link
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-lg">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm text-gray-500">Cargando notificaciones...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
              <p className="text-sm text-gray-500">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadNotifications}
                className="mt-2 text-xs"
              >
                Reintentar
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50",
                    !notification.read && "bg-blue-50/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.read && "text-gray-900 font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Badge de contador en la esquina inferior derecha */}
                  {notification.unread_count && notification.unread_count > 0 && !notification.read && (
                    <NotificationCardBadge 
                      count={notification.unread_count}
                      ariaLabel={`${notification.unread_count} ${notification.type === 'new_booking' ? 'reservas' : notification.type === 'new_review' ? 'reseñas' : notification.type === 'new_promotion' ? 'promociones' : notification.type === 'price_change' ? 'cambios de precio' : 'notificaciones'} sin leer`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-blue-600 hover:text-blue-700"
              onClick={() => {
                // Aquí podrías redirigir a una página de notificaciones completa
                setOpen(false)
              }}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
