import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
});

const PHOTOS_BUCKET = process.env.NEXT_PUBLIC_PHOTOS_BUCKET!;
const THUMBNAILS_BUCKET = process.env.NEXT_PUBLIC_THUMBNAILS_BUCKET!;

export interface GenerateUploadUrlParams {
  userId: string;
  fileName: string;
  contentType: string;
}

export interface GenerateUploadUrlResult {
  uploadUrl: string;
  key: string;
  photoId: string;
}

export async function generateUploadUrl({
  userId,
  fileName,
  contentType,
}: GenerateUploadUrlParams): Promise<GenerateUploadUrlResult> {
  // Generate a unique photo ID
  const photoId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Extract file extension
  const extension = fileName.split('.').pop() || 'jpg';

  // Create S3 key in format: userId/photoId.ext
  const key = `${userId}/${photoId}.${extension}`;

  // Create the PutObject command
  const command = new PutObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  // Generate presigned URL (valid for 5 minutes)
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  return {
    uploadUrl,
    key,
    photoId,
  };
}

export interface DeletePhotoParams {
  s3Key: string;
  thumbnailKey: string;
}

export async function deletePhotoFromS3({
  s3Key,
  thumbnailKey,
}: DeletePhotoParams): Promise<void> {
  // Delete original photo
  const deleteOriginalCommand = new DeleteObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: s3Key,
  });
  await s3Client.send(deleteOriginalCommand);

  // Delete thumbnail
  const deleteThumbnailCommand = new DeleteObjectCommand({
    Bucket: THUMBNAILS_BUCKET,
    Key: thumbnailKey,
  });
  await s3Client.send(deleteThumbnailCommand);
}
