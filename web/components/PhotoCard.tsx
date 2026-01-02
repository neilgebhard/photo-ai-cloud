'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchThumbnail() {
      try {
        const response = await fetch(
          `/api/photos/${photo.photoId}/thumbnail?userId=${photo.userId}&thumbnailKey=${encodeURIComponent(photo.thumbnailKey)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch thumbnail');
        }

        const data = await response.json();
        setThumbnailUrl(data.url);
        setError(false);
      } catch (err) {
        console.error('Error fetching thumbnail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchThumbnail();
  }, [photo.photoId, photo.userId, photo.thumbnailKey]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100">
            <div className="text-center p-4">
              <p className="text-sm text-red-600">Failed to load image</p>
            </div>
          </div>
        )}

        {thumbnailUrl && !error && (
          <Image
            src={thumbnailUrl}
            alt={photo.labels[0] || 'Photo'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setError(true)}
          />
        )}
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
