import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsub = null;
    const init = async () => {
      try {
        if (!isSupabaseConfigured) {
          // Dev fallback: mock user when Supabase isn’t configured
          setUser({ id: 'dev-user', email: 'dev@example.com', name: 'Dev User' });
          setIsAuthenticated(true);
          setIsLoadingAuth(false);
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) {
          setAuthError({ type: 'auth_error', message: error.message });
        }
        setUser(data?.user ?? null);
        setIsAuthenticated(!!data?.user);
        setIsLoadingAuth(false);

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setIsAuthenticated(!!session?.user);
        });
        unsub = listener?.subscription?.unsubscribe;
      } catch (e) {
        setAuthError({ type: 'unknown', message: e?.message || 'Auth init failed' });
        setIsLoadingAuth(false);
      }
    };
    init();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } else {
      // In dev fallback, allow logout to clear mock session
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const navigateToLogin = () => {
    // Implement your login routing or OTP flow here later
    // For now, no-op.
    return;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
    }}>
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
