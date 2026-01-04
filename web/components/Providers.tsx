'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { configureAmplify } from '@/lib/amplify-config';

// Configure Amplify immediately when this module loads
// This ensures Amplify is ready before any components mount
if (typeof window !== 'undefined') {
  configureAmplify();
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
