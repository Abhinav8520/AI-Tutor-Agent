import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * AuthProvider component that manages global authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign up a new user
   */
  const signup = async (email, password) => {
    setError(null);
    setLoading(true);
    const result = await authService.signUp(email, password);
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, user: result.user };
  };

  /**
   * Sign in an existing user
   */
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    const result = await authService.signIn(email, password);
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, user: result.user };
  };

  /**
   * Sign out the current user
   */
  const logout = async () => {
    setError(null);
    setLoading(true);
    const result = await authService.signOut();
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true };
  };

  /**
   * Reset password
   */
  const resetPassword = async (email) => {
    setError(null);
    setLoading(true);
    const result = await authService.resetPassword(email);
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true };
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

