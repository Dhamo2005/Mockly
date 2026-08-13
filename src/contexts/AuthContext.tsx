import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { useStore } from '../store/useStore';
import { resetLocalSQLiteDatabase } from '../lib/sqliteDriveSync';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.appdata');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('profile');
provider.addScope('email');

interface User {
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

let cachedAccessToken: string | null = null;
export const getAccessToken = () => cachedAccessToken;

let activeSignInPromise: Promise<void> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Suppress internal Firebase Auth popup cancellation assertion errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason || '');
      const code = event.reason?.code;
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user' ||
        msg.includes('Pending promise was never set') ||
        msg.includes('cancelled-popup-request')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const storedToken = localStorage.getItem('mockly_token');
        if (storedToken && !cachedAccessToken) {
           cachedAccessToken = storedToken;
        }

        setUser({
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || '',
        });
      } else {
        cachedAccessToken = null;
        setUser(null);
        resetLocalSQLiteDatabase();
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (activeSignInPromise) {
      return activeSignInPromise;
    }

    setIsSigningIn(true);
    setAuthError(null);

    activeSignInPromise = (async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          localStorage.setItem('mockly_token', credential.accessToken);
        }
      } catch (error: any) {
        const msg = error?.message || String(error || '');
        const code = error?.code;
        if (
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/popup-closed-by-user' ||
          msg.includes('Pending promise was never set') ||
          msg.includes('cancelled-popup-request')
        ) {
          // Expected popup user cancellation or duplicate prevention
          console.warn('Sign-in popup closed or superseded.');
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
      await auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
    cachedAccessToken = null;
    localStorage.removeItem('mockly_token');
    useStore.getState().clearAllData();
    resetLocalSQLiteDatabase();
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
