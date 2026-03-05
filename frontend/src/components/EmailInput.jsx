import { useState } from 'react';
import { useOTPAuth } from '../context/OTPAuthContext';

function EmailInput() {
  const [email, setEmail] = useState('');
  const { loading, error, requestOTP, setError } = useOTPAuth();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    await requestOTP(email.toLowerCase().trim());
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="glass-card" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
          Welcome to <span className="text-gradient">Threadify</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          Enter your email to get started
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--input-bg)',
              color: 'var(--input-text)',
              marginBottom: '20px'
            }}
            disabled={loading}
            autoFocus
          />

          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '16px' }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </form>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '20px' }}>
          We'll send you a 6-digit verification code
        </p>
      </div>
    </div>
  );
}

export default EmailInput;