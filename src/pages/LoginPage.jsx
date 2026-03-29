import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ✅ FIXED

import { Home } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      console.log('Login result:', result);

      if (result.success) {
        if (result.requiresRoleSelection) {
          navigate('/select-role');
        } else {
          const userData = result.user;

          if (userData.role === 'OWNER') {
            navigate('/owner/dashboard');
          } else if (userData.role === 'CUSTOMER') {
            navigate('/listings');
          } else {
            navigate(from, { replace: true });
          }
        }
      } else {
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Home className="h-10 w-10 text-secondary" />
            <span className="text-3xl font-bold text-foreground">RENTEASE</span>
          </div>

          <h2 className="text-center text-3xl font-bold">Welcome Back</h2>

          <p className="text-center text-sm">
            <Link to="/register">Create new account</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p>{error}</p>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
