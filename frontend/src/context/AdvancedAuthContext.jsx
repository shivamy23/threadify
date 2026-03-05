import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AdvancedAuthContext = createContext();

export const useAdvancedAuth = () => {
  const context = useContext(AdvancedAuthContext);
  if (!context) {
    throw new Error('useAdvancedAuth must be used within AdvancedAuthProvider');
  }
  return context;
};

export const AdvancedAuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-refresh token setup - DISABLED (endpoint not implemented)
  // useEffect(() => {
  //   const refreshToken = async () => {
  //     try {
  //       const response = await API.post('/auth/refresh');
  //       localStorage.setItem('token', response.data.access_token);
  //       return true;
  //     } catch (error) {
  //       // Refresh failed, user needs to login again
  //       localStorage.removeItem('token');
  //       localStorage.removeItem('user');
  //       return false;
  //     }
  //   };

  //   // Set up automatic token refresh (every 14 minutes)
  //   const interval = setInterval(refreshToken, 14 * 60 * 1000);
    
  //   return () => clearInterval(interval);
  // }, []);

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.post('/auth/signup', userData);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return { 
        success: true, 
        user: response.data.user,
        message: response.data.message
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Signup failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.post('/auth/login', credentials);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return { 
        success: true, 
        user: response.data.user,
        message: response.data.message
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      await API.post('/auth/forgot-password', { email });
      
      return { 
        success: true, 
        message: 'If the email exists, a password reset link has been sent'
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Request failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      await API.post('/auth/reset-password', {
        token,
        new_password: newPassword
      });
      
      return { 
        success: true, 
        message: 'Password reset successfully'
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Reset failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (password) => {
    try {
      setLoading(true);
      setError(null);
      
      await API.delete('/auth/account', {
        data: { password }
      });
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return { 
        success: true, 
        message: 'Account deleted successfully'
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Deletion failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AdvancedAuthContext.Provider value={{
      loading,
      error,
      signup,
      login,
      logout,
      forgotPassword,
      resetPassword,
      deleteAccount,
      clearError
    }}>
      {children}
    </AdvancedAuthContext.Provider>
  );
};