import { createContext, useContext, useState } from 'react';
import API from '../api/axios';

const OTPAuthContext = createContext();

export const useOTPAuth = () => {
  const context = useContext(OTPAuthContext);
  if (!context) {
    throw new Error('useOTPAuth must be used within OTPAuthProvider');
  }
  return context;
};

export const OTPAuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const requestOTP = async (emailAddress) => {
    try {
      setLoading(true);
      setError(null);
      
      await API.post('/auth/request-otp', { email: emailAddress });
      
      setEmail(emailAddress);
      setStep('otp');
      setCooldown(60);
      
      // Start cooldown timer
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to send OTP';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.post('/auth/verify-otp', {
        email,
        otp
      });
      
      // Store token and user data
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return { 
        success: true, 
        user: response.data.user,
        isNewUser: response.data.user.is_new_user
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid OTP';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (cooldown > 0) return { success: false, error: 'Please wait before resending' };
    return await requestOTP(email);
  };

  const resetAuth = () => {
    setStep('email');
    setEmail('');
    setError(null);
    setCooldown(0);
  };

  return (
    <OTPAuthContext.Provider value={{
      loading,
      error,
      step,
      email,
      cooldown,
      requestOTP,
      verifyOTP,
      resendOTP,
      resetAuth,
      setError
    }}>
      {children}
    </OTPAuthContext.Provider>
  );
};