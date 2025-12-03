import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"

// Disable SSL verification for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

export async function POST(request: NextRequest) {

  console.log("BACKEND_URL =", BACKEND_URL);

  try {
    const body = await request.json()
    
    console.log("Attempting to connect to backend...");

    // Forward the request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    
    console.log("Backend response status:", response.status);

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ detail: "Error al conectar con el servidor" }, { status: 500 })
  }
}
