import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load user from local storage
    const storedUser = localStorage.getItem('mockly_user');
    const storedToken = localStorage.getItem('mockly_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      cachedAccessToken = storedToken;
    }
    setLoading(false);
  }, []);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file profile email',
    onSuccess: async (tokenResponse) => {
      cachedAccessToken = tokenResponse.access_token;
      localStorage.setItem('mockly_token', tokenResponse.access_token);
      
      // Fetch user profile
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const data = await res.json();
        const userData = {
          displayName: data.name,
          photoURL: data.picture,
        };
        setUser(userData);
        localStorage.setItem('mockly_user', JSON.stringify(userData));
      } catch (e) {
        console.error('Failed to fetch user profile', e);
      }
    },
    onError: (error) => {
      console.error('Login Failed', error);
    }
  });

  const signInWithGoogle = () => {
    login();
  };

  const signOut = () => {
    googleLogout();
    setUser(null);
    cachedAccessToken = null;
    localStorage.removeItem('mockly_user');
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
