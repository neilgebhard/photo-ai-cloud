import { NextRequest, NextResponse } from 'next/server';

const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const s3Key = searchParams.get('s3Key');

    if (!userId || !s3Key) {
      return NextResponse.json(
        { error: 'userId and s3Key are required' },
        { status: 400 }
      );
    }

    // Construct CloudFront URL directly (no signing needed)
    const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;

    return NextResponse.json({ url: cloudFrontUrl });
  } catch (error) {
    console.error('Error generating full image URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate image URL' },
      { status: 500 }
    );
  }
}
