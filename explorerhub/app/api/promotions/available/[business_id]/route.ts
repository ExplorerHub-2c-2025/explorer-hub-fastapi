import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:8000"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ business_id: string }> }
) {
  try {
    const token = request.headers.get("authorization")
    if (!token) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      )
    }

    const { business_id } = await params;
    const response = await fetch(
      `${BACKEND_URL}/api/promotions/available/${business_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Error fetching available promotions:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
