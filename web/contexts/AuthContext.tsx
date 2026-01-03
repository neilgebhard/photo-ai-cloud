'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getCurrentUser, signIn, signOut, signUp, confirmSignUp, fetchAuthSession } from 'aws-amplify/auth';

interface User {
  userId: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      await fetchAuthSession(); // Verify session is valid

      setUser({
        userId: currentUser.userId,
        email: currentUser.signInDetails?.loginId || '',
      });
    } catch (error) {
      // User not signed in or session invalid
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const refreshAuth = useCallback(async () => {
    await checkUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignIn(email: string, password: string) {
    try {
      // Check if already signed in
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // Already signed in, just refresh the user state
          await checkUser();
          return;
        }
      } catch {
        // Not signed in, continue with sign in
      }

      const result = await signIn({ username: email, password });

      if (result.isSignedIn) {
        await checkUser();
      }
    } catch (error: any) {
      console.error('Sign in error:', error);

      // Provide user-friendly error messages
      if (error.name === 'UserAlreadyAuthenticatedException') {
        // User is already signed in, refresh state
        await checkUser();
        return;
      }

      throw error;
    }
  }

  async function handleSignUp(email: string, password: string) {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async function handleConfirmSignUp(email: string, code: string) {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        signOut: handleSignOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
