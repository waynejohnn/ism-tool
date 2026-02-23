import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      if (!email || !password) {
        setError('Email and password are required');
        return;
      }

      const response = await apiPost('/auth/login', {
        email,
        password,
      });

      if (response.token) {
        // Use AuthContext to login
        login(response.token, response.user);
        
        // Redirect to admin users page
        navigate('/admin/users');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 40,
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08)',
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-900)',
          textAlign: 'center',
        }}>
          Admin Login
        </h1>
        <p style={{
          margin: '0 0 32px 0',
          fontSize: 14,
          color: 'var(--text-500)',
          textAlign: 'center',
        }}>
          Santee Cooper Use Case Scoring
        </p>

        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: 24,
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: 8,
            color: '#c33',
            fontSize: 14,
            fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 500,
              color: 'var(--text-900)',
              fontSize: 14,
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@santeecooper.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e7e7e7',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = '#e7e7e7'}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 500,
              color: 'var(--text-900)',
              fontSize: 14,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e7e7e7',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = '#e7e7e7'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
            onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
