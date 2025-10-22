import { type NextRequest, NextResponse } from "next/server"
import { mockUsers } from "@/lib/mock-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    const user = mockUsers.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ detail: "Credenciales inválidas" }, { status: 401 })
    }

    // Generate a mock JWT token
    const mockToken = `mock_jwt_${user.id}_${Date.now()}`

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      access_token: mockToken,
      token_type: "bearer",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
