import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        password,
      });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    try {
      await axios.post('http://localhost:3000/users', {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      });

      setSignupSuccess('Account created! You can now sign in.');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setMode('login');
    } catch (err) {
      setSignupError('Failed to create account. Email may already be in use.');
    }
  };

  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: '10px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: active ? '#1e293b' : '#94a3b8',
    borderBottom: active ? '2px solid #1e293b' : '2px solid #e2e8f0',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottomWidth: '2px',
  });

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    backgroundColor: '#ffffff',
    color: '#1e293b',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    color: '#334155',
    marginBottom: '6px',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <div
        style={{
          width: '360px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '40px 32px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>
            Admin Panel
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            {mode === 'login' ? 'Sign in to manage your workspace' : 'Create a new account'}
          </p>
        </div>

        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <button type="button" onClick={() => setMode('login')} style={tabStyle(mode === 'login')}>
            Sign In
          </button>
          <button type="button" onClick={() => setMode('signup')} style={tabStyle(mode === 'signup')}>
            Create Account
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#1e293b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            {signupError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px',
                }}
              >
                {signupError}
              </div>
            )}
            {signupSuccess && (
              <div
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px',
                }}
              >
                {signupSuccess}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#1e293b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}