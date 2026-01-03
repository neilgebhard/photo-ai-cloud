'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { configureAmplify } from '@/lib/amplify-config';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
