import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useAdvancedAuth } from '../context/AdvancedAuthContext';

function Login() {
  console.log('Login component mounted');
  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);
  const { loading, error, login, clearError } = useAdvancedAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_me: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password) {
      return;
    }
    
    const result = await login({
      email: formData.email,
      password: formData.password,
      remember_me: formData.remember_me
    });
    
    if (result.success) {
      authLogin(result.user);
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
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
            Sign in to your <span className="text-gradient">Threadify</span> account
          </p>

          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
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
                border: '1px solid var(--glass-border)',
                background: 'var(--input-bg)',
                color: 'var(--input-text)',
                marginBottom: '20px'
              }}
              disabled={loading}
              required
            />

            <div style={{ position: 'relative', marginBottom: '20px' }}>
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
                  border: '1px solid var(--glass-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)'
                }}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;