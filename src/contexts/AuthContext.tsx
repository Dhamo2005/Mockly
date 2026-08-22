import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';
import { useStore } from '../store/useStore';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

// Initialize Firebase Analytics if supported in current environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

interface User {
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
    // Test Firestore connection on boot
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firestore connection: client is offline or establishing connection.");
        }
      }
    };
    testConnection();

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
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || '',
        });
      } else {
        setUser(null);
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
        await signInWithPopup(auth, provider);
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
