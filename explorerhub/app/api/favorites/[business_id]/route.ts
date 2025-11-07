import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// DELETE /api/favorites/[business_id] - Eliminar de favoritos
export async function DELETE(
  req: NextRequest,
  { params }: { params: { business_id: string } }
) {
  try {
    const token = req.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/favorites/${params.business_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
      },
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Error al eliminar favorito' },
      { status: 500 }
    );
  }
}

// GET /api/favorites/[business_id]/check - Verificar si está en favoritos
export async function GET(
  req: NextRequest,
  { params }: { params: { business_id: string } }
) {
  try {
    const token = req.headers.get('authorization');

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/favorites/check/${params.business_id}`, {
      headers: {
        'Authorization': token,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json(
      { error: 'Error al verificar favorito' },
      { status: 500 }
    );
  }
}
