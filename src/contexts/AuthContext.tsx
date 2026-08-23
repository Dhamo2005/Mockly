import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchGoogleUserProfile, 
  getStoredUserProfile, 
  requestDriveAccessToken, 
  disconnectDrive, 
  getValidDriveToken 
} from '../lib/googleDriveSync';
import { useStore } from '../store/useStore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

let activeSignInPromise: Promise<void> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check existing Google Drive session on app launch
    const initAuth = async () => {
      try {
        const token = getValidDriveToken();
        const storedProfile = getStoredUserProfile();

        if (token && storedProfile) {
          setUser(storedProfile);
        } else if (token) {
          try {
            const profile = await fetchGoogleUserProfile(token);
            setUser(profile);
          } catch {
            disconnectDrive();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Auth initialization check failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
        useStore.getState().setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  const signInWithGoogle = async () => {
    if (activeSignInPromise) {
      return activeSignInPromise;
    }

    setIsSigningIn(true);
    setAuthError(null);

    activeSignInPromise = (async () => {
      try {
        const token = await requestDriveAccessToken(true);
        const profile = await fetchGoogleUserProfile(token);
        setUser(profile);
      } catch (error: any) {
        const msg = error?.message || String(error || '');
        if (
          msg.includes('closed') ||
          msg.includes('cancelled') ||
          msg.includes('dismissed') ||
          msg.includes('user_cancel')
        ) {
          console.warn('Google Sign-in popup closed by user.');
        } else {
          console.error('Sign in error:', error);
          setAuthError(error?.message || 'Failed to sign in with Google');
        }
      } finally {
        setIsSigningIn(false);
        activeSignInPromise = null;
      }
    })();

    return activeSignInPromise;
  };

  const signOut = async () => {
    try {
      disconnectDrive();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
    useStore.getState().clearAllData();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSigningIn, authError, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
