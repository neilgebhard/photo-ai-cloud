import { NextRequest, NextResponse } from 'next/server';
import { getPublicPhotos } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    const nextToken = searchParams.get('nextToken');

    const result = await getPublicPhotos({
      limit: limit ? parseInt(limit) : undefined,
      lastEvaluatedKey: nextToken || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching public photos:', error);

    if (error instanceof Error && error.message === 'Invalid pagination token') {
      return NextResponse.json(
        { error: 'Invalid pagination token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
