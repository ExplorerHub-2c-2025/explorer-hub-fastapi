import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000'
    const token = request.headers.get('authorization')

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const response = await fetch(`${backendUrl}/api/favorites/trips/${tripId}`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error adding trip to favorites:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000'
    const token = request.headers.get('authorization')

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const response = await fetch(`${backendUrl}/api/favorites/trips/${tripId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error removing trip from favorites:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
