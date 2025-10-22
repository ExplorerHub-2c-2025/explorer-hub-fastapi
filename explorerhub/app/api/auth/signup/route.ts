import { type NextRequest, NextResponse } from "next/server"
import { mockUsers } from "@/lib/mock-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      email,
      password,
      is_business,
      country,
      date_of_birth,
      preferences,
      language,
      business_type,
      phone,
      address,
      description,
      price_range,
      tax_number,
    } = body

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ detail: "El correo electrónico ya está registrado" }, { status: 400 })
    }

    // Create new user
    const newUser: any = {
      id: `${Date.now()}`,
      email,
      password, // In production, this would be hashed
      full_name: name,
      is_business: is_business || false,
      created_at: new Date().toISOString(),
    }

    // Add user-specific fields
    if (is_business) {
      newUser.business_type = business_type
      newUser.phone = phone
      newUser.address = address
      newUser.description = description
      newUser.price_range = price_range
      newUser.tax_number = tax_number
    } else {
      newUser.country = country
      newUser.date_of_birth = date_of_birth
      newUser.preferences = preferences
      newUser.language = language
    }

    mockUsers.push(newUser)

    // Generate a mock JWT token
    const mockToken = `mock_jwt_${newUser.id}_${Date.now()}`

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      access_token: mockToken,
      token_type: "bearer",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
