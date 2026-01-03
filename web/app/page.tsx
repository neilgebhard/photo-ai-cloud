import PublicFeed from '@/components/PublicFeed';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Photo AI Gallery</h1>
              <p className="mt-2 text-sm text-gray-600">
                AI-powered photo organization with automatic labeling
              </p>
            </div>
            <Link
              href="/gallery"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PublicFeed />
      </main>
    </div>
  );
}
