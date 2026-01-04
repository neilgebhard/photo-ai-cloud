import { NextRequest, NextResponse } from 'next/server';
import { deletePhoto } from '@/lib/dynamodb';
import { deletePhotoFromS3 } from '@/lib/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate input
    if (!userId || !photoId) {
      return NextResponse.json(
        { error: 'userId and photoId are required' },
        { status: 400 }
      );
    }

    // Delete from DynamoDB and get S3 keys
    const result = await deletePhoto({ userId, photoId });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Photo not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete from S3 (original and thumbnail)
    if (result.s3Key && result.thumbnailKey) {
      await deletePhotoFromS3({
        s3Key: result.s3Key,
        thumbnailKey: result.thumbnailKey,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
