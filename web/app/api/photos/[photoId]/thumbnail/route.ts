import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
});

const THUMBNAILS_BUCKET = process.env.NEXT_PUBLIC_THUMBNAILS_BUCKET!;

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

    // Create the GetObject command
    const command = new GetObjectCommand({
      Bucket: THUMBNAILS_BUCKET,
      Key: thumbnailKey,
    });

    // Generate presigned URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating thumbnail URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail URL' },
      { status: 500 }
    );
  }
}
