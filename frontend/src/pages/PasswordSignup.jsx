import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useAdvancedAuth } from '../context/AdvancedAuthContext';

function Signup() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { loading, error, signup, clearError } = useAdvancedAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear auth error
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await signup({
      username: formData.username,
      email: formData.email,
      password: formData.password
    });
    
    if (result.success) {
      login(result.user);
      navigate('/posts');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg-darker)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div className="glass-card" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            Join <span className="text-gradient">Threadify</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
            Create your account to get started
          </p>

          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                  border: validationErrors.username ? '2px solid #f87171' : '1px solid var(--glass-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  marginBottom: '8px'
                }}
                disabled={loading}
              />
              {validationErrors.username && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                  {validationErrors.username}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                  border: validationErrors.email ? '2px solid #f87171' : '1px solid var(--glass-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  marginBottom: '8px'
                }}
                disabled={loading}
              />
              {validationErrors.email && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    paddingRight: '50px',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    border: validationErrors.password ? '2px solid #f87171' : '1px solid var(--glass-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    marginBottom: '8px'
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-main)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {validationErrors.password && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    paddingRight: '50px',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    border: validationErrors.confirmPassword ? '2px solid #f87171' : '1px solid var(--glass-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    marginBottom: '8px'
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-main)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                  {validationErrors.confirmPassword}
                </p>
              )}
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

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '16px' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;