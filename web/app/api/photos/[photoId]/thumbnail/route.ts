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
    const thumbnailKey = searchParams.get('thumbnailKey');

    if (!userId || !thumbnailKey) {
      return NextResponse.json(
        { error: 'userId and thumbnailKey are required' },
        { status: 400 }
      );
    }

    // Construct CloudFront URL directly (no signing needed)
    const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${thumbnailKey}`;

    return NextResponse.json({ url: cloudFrontUrl });
  } catch (error) {
    console.error('Error generating thumbnail URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail URL' },
      { status: 500 }
    );
  }
}
