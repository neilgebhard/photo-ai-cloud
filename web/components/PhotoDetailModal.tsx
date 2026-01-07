'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { X, ChevronLeft, ChevronRight, Calendar, Tag, TrendingUp } from 'lucide-react';

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
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoDetailModal({ photos, initialIndex, onClose }: PhotoDetailModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const photo = photos[currentIndex];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < photos.length - 1;

  const goToPrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    // Reset loading state when photo changes
    setLoading(true);
    setError(false);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    }

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onClose, goToPrevious, goToNext]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Photo Details</h2>
            {photos.length > 1 && (
              <p className="text-sm text-gray-500 mt-1">
                {currentIndex + 1} of {photos.length}
              </p>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            title="Close (ESC)"
          >
            <X size={24} />
          </Button>
        </div>

        <div className="p-6">
          {/* Image */}
          <div className="mb-6">
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden group">
              {/* Previous button */}
              {photos.length > 1 && canGoPrevious && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                  title="Previous (←)"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Next button */}
              {photos.length > 1 && canGoNext && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                  title="Next (→)"
                >
                  <ChevronRight size={24} />
                </button>
              )}

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
                <div
                  className="relative w-full flex items-center justify-center"
                  style={{ maxHeight: '80vh', minHeight: '400px' }}
                >
                  <Image
                    src={imageUrl}
                    alt={photo.labels[0] || 'Photo'}
                    width={1200}
                    height={800}
                    className="w-full max-h-[80vh] object-contain rounded-lg"
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
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <Calendar size={16} />
                    Upload Date:
                  </span>
                  <p className="text-gray-900 ml-5">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={20} />
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
