import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const response = await fetch(`${BACKEND_URL}/api/promotions/${id}`)
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error fetching promotion:", error)
    return NextResponse.json(
      { error: "Failed to fetch promotion" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const token = request.headers.get("authorization")

    if (!token) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/promotions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error updating promotion:", error)
    return NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const token = request.headers.get("authorization")

    if (!token) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/promotions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error deleting promotion:", error)
    return NextResponse.json(
      { error: "Failed to delete promotion" },
      { status: 500 }
    )
  }
}
