'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { X, ChevronLeft, ChevronRight, Calendar, Tag, TrendingUp,
         Image as ImageIcon, HardDrive, Camera, Aperture, Timer } from 'lucide-react';
import { Photo } from '@/lib/dynamodb';

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format shutter speed for display
 */
function formatShutterSpeed(value?: number): string {
  if (!value) return 'N/A';
  return value < 1 ? `1/${Math.round(1/value)}s` : `${value}s`;
}

/**
 * Format aperture for display
 */
function formatAperture(value?: number): string {
  return value ? `f/${value.toFixed(1)}` : 'N/A';
}

/**
 * Format focal length for display
 */
function formatFocalLength(value?: number): string {
  return value ? `${value}mm` : 'N/A';
}

/**
 * Format ISO for display
 */
function formatISO(value?: number): string {
  return value ? `ISO ${value}` : 'N/A';
}

interface PhotoDetailModalProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoDetailModal({ photos, initialIndex, onClose }: PhotoDetailModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
    // Construct CloudFront URL directly (no API call needed)
    const fullImageUrl = `https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${photo.s3Key}`;

    // Save current image as "previous" before transitioning
    if (imageUrl && imageUrl !== fullImageUrl) {
      setPreviousImageUrl(imageUrl);
      setIsTransitioning(true);
    }

    setImageUrl(fullImageUrl);
    setError(false);
  }, [photo.photoId, photo.s3Key, imageUrl]);

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    // Preload next image if available
    if (canGoNext) {
      const nextPhoto = photos[currentIndex + 1];
      if (nextPhoto) {
        const nextUrl = `https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${nextPhoto.s3Key}`;
        const img = document.createElement('img');
        img.src = nextUrl;
      }
    }

    // Preload previous image if available
    if (canGoPrevious) {
      const prevPhoto = photos[currentIndex - 1];
      if (prevPhoto) {
        const prevUrl = `https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${prevPhoto.s3Key}`;
        const img = document.createElement('img');
        img.src = prevUrl;
      }
    }
  }, [currentIndex, photos, canGoNext, canGoPrevious]);

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

              {error && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <p className="text-red-600">Failed to load image</p>
                  </div>
                </div>
              )}

              {!error && (
                <div
                  className="relative w-full flex items-center justify-center"
                  style={{ maxHeight: '80vh', minHeight: '400px' }}
                >
                  {/* Previous image - fades out during transition */}
                  {isTransitioning && previousImageUrl && (
                    <div className="absolute inset-0 transition-opacity duration-300 opacity-0">
                      <Image
                        src={previousImageUrl}
                        alt="Previous photo"
                        width={1200}
                        height={800}
                        className="w-full max-h-[80vh] object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {/* Current image - fades in during transition */}
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={photo.labels[0] || 'Photo'}
                      width={1200}
                      height={800}
                      className="w-full max-h-[80vh] object-contain rounded-lg transition-opacity duration-300"
                      onLoadingComplete={() => {
                        // Clear transition state when new image is ready
                        setIsTransitioning(false);
                        setPreviousImageUrl(null);
                      }}
                      onError={() => setError(true)}
                      priority
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Basic Info & Technical Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon size={20} />
                  Details
                </h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                      <Calendar size={16} />
                      Uploaded:
                    </span>
                    <p className="text-gray-900 ml-5">
                      {new Date(photo.uploadDate).toLocaleString()}
                    </p>
                  </div>

                  {photo.exif?.dateTaken && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <Calendar size={16} />
                        Date Taken:
                      </span>
                      <p className="text-gray-900 ml-5">
                        {new Date(photo.exif.dateTaken).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {photo.width && photo.height && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Dimensions:</span>
                      <p className="text-gray-900">
                        {photo.width} × {photo.height} px
                        {photo.width && photo.height && (
                          <span className="text-gray-500 text-sm ml-2">
                            ({(photo.width / photo.height).toFixed(2)} ratio)
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {photo.fileSize && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <HardDrive size={16} />
                        File Size:
                      </span>
                      <p className="text-gray-900 ml-5">
                        {formatFileSize(photo.fileSize)}
                        {photo.thumbnailSize && (
                          <span className="text-gray-500 text-sm block">
                            Thumbnail: {formatFileSize(photo.thumbnailSize)}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {photo.format && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Format:</span>
                      <p className="text-gray-900 font-mono text-sm uppercase">
                        {photo.format}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Camera & EXIF Data */}
              {photo.exif && (photo.exif.make || photo.exif.model || photo.exif.iso || photo.exif.shutterSpeed || photo.exif.aperture || photo.exif.focalLength) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Camera size={20} />
                    Camera
                  </h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    {(photo.exif.make || photo.exif.model) && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Camera:</span>
                        <p className="text-gray-900">
                          {[photo.exif.make, photo.exif.model]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      </div>
                    )}

                    {photo.exif.iso && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">ISO:</span>
                        <p className="text-gray-900">{formatISO(photo.exif.iso)}</p>
                      </div>
                    )}

                    {photo.exif.shutterSpeed && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                          <Timer size={16} />
                          Shutter:
                        </span>
                        <p className="text-gray-900 ml-5">
                          {formatShutterSpeed(photo.exif.shutterSpeed)}
                        </p>
                      </div>
                    )}

                    {photo.exif.aperture && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                          <Aperture size={16} />
                          Aperture:
                        </span>
                        <p className="text-gray-900 ml-5">
                          {formatAperture(photo.exif.aperture)}
                        </p>
                      </div>
                    )}

                    {photo.exif.focalLength && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Focal Length:</span>
                        <p className="text-gray-900">
                          {formatFocalLength(photo.exif.focalLength)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Middle column - AI Labels */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={20} />
                AI Labels ({photo.labelDetails.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {photo.labelDetails
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((detail, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-gray-900 font-medium">{detail.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${detail.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-gray-600 w-14 text-right">
                          {detail.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right column - All Labels as Tags */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">All Labels</h3>
              <div className="flex flex-wrap gap-2">
                {photo.labels.map((label, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Photo ID (for debugging) */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-400">Photo ID:</span>
                <p className="text-gray-600 font-mono text-xs break-all">
                  {photo.photoId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
