import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const token = req.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/favorites/check/${params.businessId}`, {
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
