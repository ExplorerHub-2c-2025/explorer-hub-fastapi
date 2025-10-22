import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")
    console.log("[POST /api/businesses] Token present:", !!token)
    
    if (!token) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log("[POST /api/businesses] Request body:", JSON.stringify(body, null, 2))

    const response = await fetch(`${BACKEND_URL}/api/businesses/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log("[POST /api/businesses] Backend response status:", response.status)
    console.log("[POST /api/businesses] Backend response data:", JSON.stringify(data, null, 2))

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[POST /api/businesses] Error:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Build query string from search params
    const queryString = searchParams.toString()
    const url = `${BACKEND_URL}/api/businesses/${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
