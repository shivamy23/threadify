import { createContext, useContext, useState } from 'react';
import API from '../api/axios';

const PasswordAuthContext = createContext();

export const usePasswordAuth = () => {
  const context = useContext(PasswordAuthContext);
  if (!context) {
    throw new Error('usePasswordAuth must be used within PasswordAuthProvider');
  }
  return context;
};

export const PasswordAuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.post('/auth/signup', userData);
      
      // Store token and user data
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
      
      // Store token and user data
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

  const clearError = () => {
    setError(null);
  };

  return (
    <PasswordAuthContext.Provider value={{
      loading,
      error,
      signup,
      login,
      clearError
    }}>
      {children}
    </PasswordAuthContext.Provider>
  );
};