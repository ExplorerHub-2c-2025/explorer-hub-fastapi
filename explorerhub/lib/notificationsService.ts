// Simple notifications service stub used by the client component.
// Replace with real API calls in production.

export type Notification = {
  id: number
  type: string
  title: string
  description: string
  created_at: string
  read: boolean
  link?: string
  unread_count?: number
}

/**
 * Fetch a page of notifications.
 * This is a stub that returns mock data; replace with real fetch logic.
 */
export async function getNotifications(page = 0, limit = 50): Promise<Notification[]> {
  // Generate some mock notifications
  const now = Date.now()
  const items: Notification[] = Array.from({ length: Math.min(limit, 8) }).map((_, i) => {
    const id = page * limit + i + 1
    return {
      id,
      type: ["address_change", "price_change", "new_promotion", "booking_pending", "new_review", "new_booking"][i % 6],
      title: `Notificación de ejemplo #${id}`,
      description: `Descripción de la notificación de ejemplo número ${id}.`,
      created_at: new Date(now - i * 1000 * 60 * 60).toISOString(),
      read: i % 3 === 0,
      link: i % 2 === 0 ? `/notifications/${id}` : undefined,
      unread_count: i % 3 === 0 ? 0 : (i % 5) + 1,
    }
  })

  return Promise.resolve(items)
}

/**
 * Mark a single notification as read. Stub implementation.
 */
export async function markNotificationAsRead(id: number): Promise<void> {
  // In a real implementation you would PATCH/POST to your API here.
  return Promise.resolve()
}

/**
 * Mark all notifications as read. Stub implementation.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  // In a real implementation you would PATCH/POST to your API here.
  return Promise.resolve()
}

/**
 * Poll for notifications every `interval` milliseconds; the callback receives the latest notifications.
 * Returns a cleanup function that stops the polling.
 */
export function pollNotifications(
  callback: (notifications: Notification[]) => void,
  interval = 30000
): () => void {
  let stopped = false

  const run = async () => {
    if (stopped) return
    try {
      const data = await getNotifications(0, 50)
      callback(data)
    } catch (e) {
      // swallow errors in the stub
      // In real code you might want to surface errors to the caller
    }
  }

  // Initial fetch
  run()

  const id = setInterval(run, interval)
  return () => {
    stopped = true
    clearInterval(id)
  }
}