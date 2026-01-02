'use client';

interface Photo {
  photoId: string;
  userId: string;
  s3Key: string;
  thumbnailKey: string;
  labels: string[];
  labelDetails: Array<{ name: string; confidence: number }>;
  uploadDate: string;
  createdAt: number;
}

interface PhotoCardProps {
  photo: Photo;
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  // TODO: Generate presigned URLs for actual image display
  const thumbnailUrl = `/api/photos/${photo.photoId}/thumbnail`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Placeholder for thumbnail */}
      <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-gray-600 font-mono break-all">
            {photo.thumbnailKey}
          </p>
        </div>
      </div>

      {/* Photo metadata */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-xs text-gray-500">
            {new Date(photo.uploadDate).toLocaleDateString()}
          </p>
        </div>

        {/* AI Labels */}
        {photo.labels && photo.labels.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">AI Labels:</p>
            <div className="flex flex-wrap gap-1">
              {photo.labels.slice(0, 5).map((label, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {label}
                </span>
              ))}
              {photo.labels.length > 5 && (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  +{photo.labels.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Label confidence (show top 3) */}
        {photo.labelDetails && photo.labelDetails.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-1">Confidence:</p>
            {photo.labelDetails.slice(0, 3).map((detail, index) => (
              <div key={index} className="flex justify-between items-center text-xs text-gray-600 mb-1">
                <span className="truncate">{detail.name}</span>
                <span className="ml-2 font-mono">{detail.confidence.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
