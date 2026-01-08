'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import PhotoCard from './PhotoCard';
import PhotoUpload from './PhotoUpload';
import LoginForm from './Auth/LoginForm';
import SignUpForm from './Auth/SignUpForm';
import PhotoDetailModal from './PhotoDetailModal';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';

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

interface PhotosResponse {
  photos: Photo[];
  count: number;
  nextToken?: string;
}

export default function PhotoGallery() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/photos?userId=${user.userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }

      const data: PhotosResponse = await response.json();
      setPhotos(data.photos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleDeletePhoto = (photoId: string) => {
    // Remove photo from local state
    setPhotos(photos.filter(photo => photo.photoId !== photoId));
  };

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  // Show login/signup if not authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        {showLogin ? (
          <LoginForm onToggleMode={() => setShowLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error loading photos</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <Button
          onClick={() => fetchPhotos()}
          variant="danger"
          size="md"
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (photos.length === 0 && !showUpload) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900">No photos yet</h3>
          <p className="text-gray-600 mt-2">
            Upload some photos to see them here!
          </p>
          <div className="mt-4 flex gap-3 justify-center">
            <Button
              onClick={() => setShowUpload(true)}
              variant="primary"
              size="md"
            >
              Upload Photos
            </Button>
            <Button
              onClick={() => signOut()}
              variant="secondary"
              size="md"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showUpload && photos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Upload Photos</h2>
          <Button
            onClick={() => setShowUpload(false)}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
        <PhotoUpload userId={user.userId} onUploadComplete={fetchPhotos} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Showing {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Signed in as {user.email}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowUpload(!showUpload)}
            variant="primary"
            size="sm"
          >
            {showUpload ? 'Hide Upload' : 'Upload Photos'}
          </Button>
        </div>
      </div>

      {/* Upload section */}
      {showUpload && (
        <PhotoUpload userId={user.userId} onUploadComplete={fetchPhotos} />
      )}

      {/* Photos grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.photoId}
            photo={photo}
            showDelete={true}
            onDelete={handleDeletePhoto}
            onViewDetails={() => setSelectedPhotoIndex(index)}
          />
        ))}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhotoIndex !== null && (
        <PhotoDetailModal
          photos={photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}
