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
  showDelete?: boolean;
  onDelete?: (photoId: string) => void;
  onViewDetails?: (photo: Photo) => void;
}

export default function PhotoCard({ photo, showDelete = false, onDelete, onViewDetails }: PhotoCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!onDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/photos/${photo.photoId}?userId=${photo.userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      onDelete(photo.photoId);
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onViewDetails?.(photo)}
    >
      {/* Thumbnail image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden group">
        {/* Delete button overlay */}
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDialog(true);
            }}
            disabled={deleting}
            className="absolute top-2 right-2 z-10 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:bg-gray-400"
            title="Delete photo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Photo?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The photo and its thumbnail will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
