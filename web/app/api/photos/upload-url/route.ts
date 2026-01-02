import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fileName, contentType } = body;

    // Validate input
    if (!userId || !fileName || !contentType) {
      return NextResponse.json(
        { error: 'userId, fileName, and contentType are required' },
        { status: 400 }
      );
    }

    // Validate content type is an image
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    const result = await generateUploadUrl({
      userId,
      fileName,
      contentType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
