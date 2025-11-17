import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'agency' | 'client';
  brandId?: string;
  brandName?: string;
}

interface UseAuthReturn {
  user: User | null;
  userRole: 'agency' | 'client';
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('auth-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_error) {
        localStorage.removeItem('auth-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, __password: string): Promise<boolean> => {
    try {
      // Mock authentication - replace with real API call
      const mockUser: User = {
        id: '1',
        email,
        name: 'Demo User',
        role: email.includes('client') ? 'client' : 'agency',
        brandId: email.includes('client') ? 'brand_1' : undefined,
        brandName: email.includes('client') ? 'Nike' : undefined
      };

      setUser(mockUser);
      localStorage.setItem('auth-user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
  };

  return {
    user,
    userRole: user?.role || 'agency',
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
}
