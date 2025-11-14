import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SignUp = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: '#dc3545' };
    if (password.length < 10) return { strength: 2, label: 'Medium', color: '#ffc107' };
    return { strength: 3, label: 'Strong', color: '#28a745' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const result = await signup(email, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to create account. Please try again.');
    } else {
      // Success - show message and switch to login
      alert('Account created successfully! Please sign in.');
      onSwitchToLogin();
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#2c3e50' }}>
        Create Account
      </h2>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          color: '#721c24',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="Enter your email"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter your password (min. 6 characters)"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            required
          />
          {password && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#6c757d' }}>Strength:</span>
                <span style={{ color: passwordStrength.color, fontWeight: '500' }}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            placeholder="Confirm your password"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: confirmPassword && password !== confirmPassword ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc3545' }}>
              Passwords do not match
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: isLoading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '16px'
          }}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px', color: '#6c757d' }}>
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
            fontSize: '14px'
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default SignUp;

