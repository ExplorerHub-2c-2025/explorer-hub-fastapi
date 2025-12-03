import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  
  const url = `${BACKEND_URL}/api/promotions${queryString ? `?${queryString}` : ''}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error fetching promotions:", error)
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const business_id = searchParams.get('business_id')
  
  if (!business_id) {
    return NextResponse.json(
      { error: "business_id is required" },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const token = request.headers.get("authorization")

    if (!token) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/promotions?business_id=${business_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error creating promotion:", error)
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    )
  }
}
