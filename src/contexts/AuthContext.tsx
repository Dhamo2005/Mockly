import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

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
  signInWithGoogle: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

let cachedAccessToken: string | null = null;
export const getAccessToken = () => cachedAccessToken;

let isSigningIn = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Try to load token from local storage as a fallback, 
        // though we prefer the token from sign in result
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
        localStorage.removeItem('mockly_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        localStorage.setItem('mockly_token', credential.accessToken);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      isSigningIn = false;
    }
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    cachedAccessToken = null;
    localStorage.removeItem('mockly_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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
