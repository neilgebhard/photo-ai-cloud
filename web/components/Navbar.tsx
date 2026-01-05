'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { usePathname } from 'next/navigation';
import { Home, Image, LogIn, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b-1 border-b-gray-200" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 cursor-pointer"
          >
            Photo AI Gallery
          </Link>

          {/* Navigation & Auth */}
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/"
                className={`text-sm px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                  pathname === '/'
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-700 hover:text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <Home size={16} />
                Public Feed
              </Link>

              {user && (
                <Link
                  href="/gallery"
                  className={`text-sm px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                    pathname === '/gallery'
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-700 hover:text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <Image size={16} />
                  My Gallery
                </Link>
              )}
            </div>

            {/* User Info & Auth Button */}
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-sm text-gray-600">
                  {user.email}
                </span>
                <Button variant="secondary" size="sm" onClick={() => signOut()} className="flex items-center gap-2">
                  <LogOut size={16} />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/gallery">
                <Button variant="primary" size="sm" className="flex items-center gap-2">
                  <LogIn size={16} />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
