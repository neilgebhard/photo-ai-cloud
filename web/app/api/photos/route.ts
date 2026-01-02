import { NextRequest, NextResponse } from 'next/server';
import { getPhotos } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from authenticated session (Cognito)
    // For now, we'll accept it as a query parameter for testing
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    const nextToken = searchParams.get('nextToken');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await getPhotos({
      userId,
      limit: limit ? parseInt(limit) : undefined,
      lastEvaluatedKey: nextToken || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching photos:', error);

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
