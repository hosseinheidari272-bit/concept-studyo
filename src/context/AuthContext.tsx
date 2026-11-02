import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { apiFetch as fetch } from '../utils/offlineApiBridge';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  isAdminPanelOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openAdminPanel: () => void;
  closeAdminPanel: () => void;
  refreshUser: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; notFound?: boolean }>;
  register: (username: string, password: string, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'concept_studio_auth_token';
const USER_KEY = 'concept_studio_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(USER_KEY) || localStorage.getItem('studio_auth_user');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem('studio_auth_token') ||
        null
      );
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      }
    } catch {
      // ignore transient network errors
    }
  };

  // احراز هویت اولیه با توکن ذخیره‌شده و ماندگاری دائمی
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
        } else if (res.status === 401) {
          // فقط در صورتی که سرور رسماً اعلام کند نشست وجود ندارد یا خروج زده شده
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('studio_auth_token');
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem('studio_auth_user');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to check auth:', err);
        // در صورت خطای شبکه یا آفلاین بودن موقت، اطلاعات لاگین حفظ می‌شود تا کاربر خارج نشود
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openAdminPanel = () => {
    setIsAdminPanelOpen(true);
  };

  const closeAdminPanel = () => {
    setIsAdminPanelOpen(false);
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'خطا در ورود به حساب کاربری',
          notFound: Boolean(data.notFound),
        };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setIsAuthModalOpen(false);
      return { success: true };
    } catch {
      return { success: false, error: 'خطای ارتباط با سرور' };
    }
  };

  const register = async (username: string, password: string, fullName: string, phone?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullName, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'خطا در ایجاد حساب کاربری' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setIsAuthModalOpen(false);
      return { success: true };
    } catch {
      return { success: false, error: 'خطای ارتباط با سرور' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('studio_auth_token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('studio_auth_user');
    setToken(null);
    setUser(null);
    setIsAdminPanelOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isAuthModalOpen,
        authModalMode,
        isAdminPanelOpen,
        openAuthModal,
        closeAuthModal,
        openAdminPanel,
        closeAdminPanel,
        refreshUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
