import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-west-2',
});

export const docClient = DynamoDBDocumentClient.from(client);

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE!;

export interface Photo {
  photoId: string;
  userId: string;
  s3Key: string;
  thumbnailKey: string;
  labels: string[];
  labelDetails: Array<{ name: string; confidence: number }>;
  uploadDate: string;
  createdAt: number;
}

export interface GetPhotosParams {
  userId: string;
  limit?: number;
  lastEvaluatedKey?: string;
}

export interface GetPhotosResult {
  photos: Photo[];
  count: number;
  nextToken?: string;
}

export async function getPhotos({
  userId,
  limit = 50,
  lastEvaluatedKey,
}: GetPhotosParams): Promise<GetPhotosResult> {
  const params: any = {
    TableName: DYNAMODB_TABLE,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
    },
    ScanIndexForward: false, // Sort by SK descending (newest first)
    Limit: limit,
  };

  // Add pagination token if provided
  if (lastEvaluatedKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(
        decodeURIComponent(lastEvaluatedKey)
      );
    } catch (error) {
      throw new Error('Invalid pagination token');
    }
  }

  const command = new QueryCommand(params);
  const result = await docClient.send(command);

  // Transform items to cleaner format
  const photos: Photo[] = (result.Items || []).map((item: any) => ({
    photoId: item.photoId,
    userId: item.userId,
    s3Key: item.s3Key,
    thumbnailKey: item.thumbnailKey,
    labels: item.labels || [],
    labelDetails: item.labelDetails || [],
    uploadDate: item.uploadDate,
    createdAt: item.createdAt,
  }));

  const response: GetPhotosResult = {
    photos,
    count: photos.length,
  };

  // Include pagination token if there are more results
  if (result.LastEvaluatedKey) {
    response.nextToken = encodeURIComponent(
      JSON.stringify(result.LastEvaluatedKey)
    );
  }

  return response;
}
