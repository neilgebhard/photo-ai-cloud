'use client';

import { useState, useEffect, useCallback } from 'react';
import PhotoCard from './PhotoCard';
import PhotoUpload from './PhotoUpload';

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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const fetchPhotos = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/photos?userId=${userId}`);

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
  }, [userId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  if (!userId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Enter User ID</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter a user ID to view photos. This is temporary - authentication will be added later.
        </p>
        <input
          type="text"
          placeholder="Enter user ID"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setUserId(e.currentTarget.value);
            }
          }}
        />
      </div>
    );
  }

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
        <button
          onClick={() => setUserId('')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try different user ID
        </button>
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
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Photos
            </button>
            <button
              onClick={() => setUserId('')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Change user ID
            </button>
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
          <button
            onClick={() => setShowUpload(false)}
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <PhotoUpload userId={userId} onUploadComplete={fetchPhotos} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {photos.length} photo{photos.length !== 1 ? 's' : ''} for user: {userId}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showUpload ? 'Hide Upload' : 'Upload Photos'}
          </button>
          <button
            onClick={() => setUserId('')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Change user
          </button>
        </div>
      </div>

      {/* Upload section */}
      {showUpload && (
        <PhotoUpload userId={userId} onUploadComplete={fetchPhotos} />
      )}

      {/* Photos grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <PhotoCard key={photo.photoId} photo={photo} />
        ))}
      </div>
    </div>
  );
}
