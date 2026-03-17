import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { MdChair, MdEmail, MdLock, MdPerson } from 'react-icons/md';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { login, register, isAuthenticated, error, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    return () => clearError();
  }, [clearError, isRegistering]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegistering) {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'user', // Default to user, admin creation handled separately or via DB seed
      });
    } else {
      await login(formData.email, formData.password);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundImage: 'url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2600&auto=format&fit=crop)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000 // Cover everything including navbar for login
    }}>
      {/* Dark overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(26, 28, 32, 0.4)'
      }} />

      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '3rem 2.5rem',
        position: 'relative',
        borderRadius: 'var(--radius-lg)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            color: 'var(--secondary)',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <MdChair size={36} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Design Studio</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isRegistering ? 'Create an account to shape your space' : 'Sign in to access your luxury designs'}
          </p>
        </div>

        {error && (
          <div className="animate-fade-in" style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderLeft: '4px solid var(--error)',
            color: 'var(--error)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '2rem',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="input-group">
              <label className="input-label" htmlFor="name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <MdPerson style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: 'var(--text-muted)' }} size={22} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '48px' }}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <MdEmail style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: 'var(--text-muted)' }} size={22} />
              <input
                type="email"
                id="email"
                name="email"
                className="input-field"
                style={{ width: '100%', paddingLeft: '48px' }}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <MdLock style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: 'var(--text-muted)' }} size={22} />
              <input
                type="password"
                id="password"
                name="password"
                className="input-field"
                style={{ width: '100%', paddingLeft: '48px' }}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', height: '52px', fontSize: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          </span>
          {' '}
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '0 4px', color: 'var(--primary)', fontWeight: '600' }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Sign In' : 'Register here'}
          </button>
        </div>

        {/* Helper info for coursework testing */}
        <div style={{
          marginTop: '2.5rem',
          padding: '1.25rem',
          backgroundColor: 'rgba(255,255,255,0.5)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          color: 'var(--text-main)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '8px' }}>Demo Credentials:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontFamily: 'monospace' }}><b>Admin:</b> admin@designstudio.com / admin123</span>
            <span style={{ fontFamily: 'monospace' }}><b>User:</b>  john@example.com / user123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
