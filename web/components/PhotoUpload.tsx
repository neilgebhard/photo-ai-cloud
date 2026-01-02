'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface PhotoUploadProps {
  userId: string;
  onUploadComplete: () => void;
}

interface UploadProgress {
  fileName: string;
  status: 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
}

export default function PhotoUpload({ userId, onUploadComplete }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please select image files only');
      return;
    }

    // Upload each file
    for (const file of imageFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;

    // Add to uploads map
    setUploads(prev => new Map(prev).set(fileId, {
      fileName: file.name,
      status: 'uploading',
    }));

    try {
      // Step 1: Get presigned upload URL
      const urlResponse = await fetch('/api/photos/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, photoId } = await urlResponse.json();

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Wait for Lambda processing
      setUploads(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        status: 'processing',
      }));

      // Wait a bit for Lambda to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success!
      setUploads(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        status: 'success',
      }));

      // Notify parent component
      onUploadComplete();

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploads(prev => {
          const next = new Map(prev);
          next.delete(fileId);
          return next;
        });
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploads(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PNG, JPG, GIF, HEIC up to 10MB
        </p>
      </div>

      {/* Upload progress */}
      {uploads.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploads.entries()).map(([fileId, upload]) => (
            <div
              key={fileId}
              className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {upload.status === 'uploading' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                )}
                {upload.status === 'processing' && (
                  <div className="animate-pulse h-5 w-5 bg-yellow-500 rounded-full"></div>
                )}
                {upload.status === 'success' && (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {upload.status === 'error' && (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {upload.status === 'uploading' && 'Uploading...'}
                    {upload.status === 'processing' && 'Processing with AI...'}
                    {upload.status === 'success' && 'Upload complete!'}
                    {upload.status === 'error' && (upload.error || 'Upload failed')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
