import { useState, useRef, useEffect } from 'react';
import { useOTPAuth } from '../context/OTPAuthContext';

function OTPInput({ onSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const { loading, error, email, cooldown, verifyOTP, resendOTP, resetAuth, setError } = useOTPAuth();

  useEffect(() => {
    // Auto focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto submit when all fields filled
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode) => {
    const result = await verifyOTP(otpCode);
    if (result.success) {
      onSuccess(result.user, result.isNewUser);
    }
  };

  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    await resendOTP();
    inputRefs.current[0]?.focus();
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="glass-card" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
        <button
          onClick={resetAuth}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ←
        </button>

        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
          Enter Code
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          We sent a 6-digit code to<br />
          <strong>{email}</strong>
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={{
                width: '50px',
                height: '50px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: '600',
                borderRadius: '12px',
                border: '2px solid var(--glass-border)',
                background: 'var(--input-bg)',
                color: 'var(--input-text)',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--glass-border)';
                e.target.style.boxShadow = 'none';
              }}
              disabled={loading}
            />
          ))}
        </div>

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: cooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '20px' }}>
          Code expires in 5 minutes
        </p>
      </div>
    </div>
  );
}

export default OTPInput;