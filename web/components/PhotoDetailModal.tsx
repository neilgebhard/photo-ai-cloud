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

interface PhotoDetailModalProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoDetailModal({ photo, onClose }: PhotoDetailModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch presigned URL for full-size image
    async function fetchFullImage() {
      try {
        const response = await fetch(
          `/api/photos/${photo.photoId}/full?userId=${photo.userId}&s3Key=${encodeURIComponent(photo.s3Key)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }

        const data = await response.json();
        setImageUrl(data.url);
        setError(false);
      } catch (err) {
        console.error('Error fetching full image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchFullImage();
  }, [photo.photoId, photo.userId, photo.s3Key]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Photo Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            title="Close (ESC)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Image */}
          <div className="mb-6">
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
              {loading && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <p className="text-red-600">Failed to load image</p>
                  </div>
                </div>
              )}

              {imageUrl && !error && (
                <div className="relative w-full" style={{ minHeight: '400px' }}>
                  <Image
                    src={imageUrl}
                    alt={photo.labels[0] || 'Photo'}
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg"
                    onError={() => setError(true)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Basic info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Upload Date:</span>
                  <p className="text-gray-900">
                    {new Date(photo.uploadDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Photo ID:</span>
                  <p className="text-gray-900 font-mono text-sm">{photo.photoId}</p>
                </div>
              </div>
            </div>

            {/* Right column - AI Labels */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                AI-Detected Labels ({photo.labelDetails.length})
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {photo.labelDetails
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((detail, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="text-gray-900">{detail.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${detail.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-gray-600 w-12 text-right">
                          {detail.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* All labels as tags */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">All Labels</h3>
            <div className="flex flex-wrap gap-2">
              {photo.labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
