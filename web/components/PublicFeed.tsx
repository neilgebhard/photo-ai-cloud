'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PhotoCard from './PhotoCard';
import PhotoDetailModal from './PhotoDetailModal';
import Link from 'next/link';

interface Photo {
  photoId: string;
  userId: string;
  s3Key: string;
  thumbnailKey: string;
  labels: string[];
  labelDetails: Array<{ name: string; confidence: number }>;
  uploadDate: string;
  createdAt: number;
  isPublic?: boolean;
}

interface PhotosResponse {
  photos: Photo[];
  count: number;
  nextToken?: string;
}

export default function PublicFeed() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    async function fetchPublicPhotos() {
      try {
        setLoading(true);
        const response = await fetch('/api/photos/public');

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
    }

    fetchPublicPhotos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error loading photos</h3>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900">No public photos yet</h3>
        <p className="text-gray-600 mt-2">
          Be the first to share your photos with the community!
        </p>
        {user ? (
          <Link
            href="/gallery"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to My Gallery
          </Link>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Sign in to upload and share photos
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Public Feed</h2>
          <p className="text-sm text-gray-600 mt-1">
            Discover {photos.length} photo{photos.length !== 1 ? 's' : ''} from the community
          </p>
        </div>
        {user && (
          <Link
            href="/gallery"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            My Gallery
          </Link>
        )}
      </div>

      {/* Photos grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.photoId}
            photo={photo}
            onViewDetails={setSelectedPhoto}
          />
        ))}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
