import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
});

const PHOTOS_BUCKET = process.env.NEXT_PUBLIC_PHOTOS_BUCKET!;

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

    // Create the GetObject command for the full-size photo
    const command = new GetObjectCommand({
      Bucket: PHOTOS_BUCKET,
      Key: s3Key,
    });

    // Generate presigned URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating full image URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate image URL' },
      { status: 500 }
    );
  }
}
