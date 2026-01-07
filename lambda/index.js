const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const sharp = require('sharp');
const { Readable } = require('stream');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const rekognitionClient = new RekognitionClient({ region: process.env.AWS_REGION });
const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

const THUMBNAIL_SIZE = 300;
const THUMBNAILS_BUCKET = process.env.THUMBNAILS_BUCKET;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

/**
 * Convert S3 stream to buffer
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Extract metadata from image buffer using sharp
 */
async function extractMetadata(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,

      exif: metadata.exif ? {
        make: metadata.exif.Make?.toString('utf-8').replace(/\0/g, '').trim() || null,
        model: metadata.exif.Model?.toString('utf-8').replace(/\0/g, '').trim() || null,
        iso: metadata.exif.ISOSpeedRatings || null,
        shutterSpeed: metadata.exif.ExposureTime || null,
        aperture: metadata.exif.FNumber || null,
        focalLength: metadata.exif.FocalLength || null,
        dateTaken: metadata.exif.DateTimeOriginal?.toString('utf-8').replace(/\0/g, '').trim() || null,
      } : null
    };
  } catch (error) {
    console.warn('Error extracting metadata:', error);
    return {
      width: null,
      height: null,
      format: null,
      size: imageBuffer.length,
      exif: null
    };
  }
}

/**
 * Generate thumbnail from image buffer
 */
async function generateThumbnail(imageBuffer) {
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  return {
    buffer: thumbnailBuffer,
    size: thumbnailBuffer.length
  };
}

/**
 * Get labels from Rekognition
 */
async function detectLabels(bucket, key) {
  const command = new DetectLabelsCommand({
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    },
    MaxLabels: 10,
    MinConfidence: 75
  });

  const response = await rekognitionClient.send(command);
  return response.Labels.map(label => ({
    name: label.Name,
    confidence: label.Confidence
  }));
}

/**
 * Save photo metadata to DynamoDB
 */
async function saveMetadata(userId, photoId, s3Key, thumbnailKey, labels, timestamp, metadata, thumbnailSize) {
  const item = {
    PK: `USER#${userId}`,
    SK: `PHOTO#${timestamp}#${photoId}`,
    photoId,
    userId,
    s3Key,
    thumbnailKey,
    labels: labels.map(l => l.name),
    labelDetails: labels,
    uploadDate: new Date(timestamp).toISOString(),
    createdAt: Date.now(),
    isPublic: true, // Photos are public by default

    // Image metadata
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    fileSize: metadata.size,
    thumbnailSize: thumbnailSize,

    // EXIF data (only include if present)
    ...(metadata.exif && { exif: metadata.exif }),

    GSI1PK: `USER#${userId}`,
    GSI1SK: `UPLOAD#${timestamp}`
  };

  const command = new PutCommand({
    TableName: DYNAMODB_TABLE,
    Item: item
  });

  await docClient.send(command);
  return item;
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse S3 event
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing image: ${bucket}/${key}`);

    // Extract userId from S3 key (expected format: userId/photoId.jpg)
    const keyParts = key.split('/');
    if (keyParts.length < 2) {
      throw new Error('Invalid S3 key format. Expected: userId/photoId.jpg');
    }
    
    const userId = keyParts[0];
    const filename = keyParts[keyParts.length - 1];
    const photoId = filename.split('.')[0];
    const timestamp = Date.now();

    // Get original image from S3
    console.log('Fetching original image from S3...');
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const s3Response = await s3Client.send(getCommand);
    const imageBuffer = await streamToBuffer(s3Response.Body);

    // Extract metadata
    console.log('Extracting image metadata...');
    const imageMetadata = await extractMetadata(imageBuffer);
    console.log('Metadata extracted:', JSON.stringify(imageMetadata, null, 2));

    // Generate thumbnail
    console.log('Generating thumbnail...');
    const thumbnailResult = await generateThumbnail(imageBuffer);
    const thumbnailKey = `${userId}/thumbnails/${photoId}_thumb.jpg`;

    // Upload thumbnail to S3
    console.log('Uploading thumbnail to S3...');
    const putCommand = new PutObjectCommand({
      Bucket: THUMBNAILS_BUCKET,
      Key: thumbnailKey,
      Body: thumbnailResult.buffer,
      ContentType: 'image/jpeg'
    });
    await s3Client.send(putCommand);

    // Detect labels with Rekognition
    console.log('Detecting labels with Rekognition...');
    const labels = await detectLabels(bucket, key);
    console.log('Detected labels:', labels);

    // Save metadata to DynamoDB
    console.log('Saving metadata to DynamoDB...');
    const savedMetadata = await saveMetadata(userId, photoId, key, thumbnailKey, labels, timestamp, imageMetadata, thumbnailResult.size);
    console.log('Metadata saved:', savedMetadata);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Image processed successfully',
        photoId,
        labels: labels.map(l => l.name),
        thumbnailKey
      })
    };

  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
