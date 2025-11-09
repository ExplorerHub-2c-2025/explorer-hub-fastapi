export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function getUser() {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  if (!userStr) return null

  try {
    const parsed = JSON.parse(userStr)
    // Normalize common fields to avoid `null` values showing up in UI
    if (parsed) {
      if (parsed.username === null) parsed.username = undefined
      if (parsed.full_name === null) parsed.full_name = undefined
      if (parsed.email === null) parsed.email = undefined
      if (parsed.profile_picture === null) parsed.profile_picture = undefined
    }
    return parsed
  } catch (err) {
    console.error("Error parsing user from localStorage:", err)
    return null
  }
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/sign-in"
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
