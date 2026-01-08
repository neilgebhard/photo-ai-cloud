'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to gallery if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/gallery');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>

          <div className="space-y-6">
            {/* User Info Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} />
                User Information
              </h2>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <Mail size={16} />
                    Email:
                  </span>
                  <p className="text-gray-900 ml-5">{user.email}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <User size={16} />
                    User ID:
                  </span>
                  <p className="text-gray-900 font-mono text-sm ml-5">{user.userId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
