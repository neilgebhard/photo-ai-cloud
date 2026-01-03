import PhotoGallery from '@/components/PhotoGallery';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">My Gallery</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your personal photo collection
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PhotoGallery />
      </main>
    </div>
  );
}
