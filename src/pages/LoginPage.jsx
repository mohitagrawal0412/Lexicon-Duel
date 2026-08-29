import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle, isConfigured } = useAuth();
  const navigate = useNavigate();

  // If Firebase isn't configured, show setup instructions
  if (!isConfigured) {
    return (
      <div className="game-bg flex flex-col items-center justify-center min-h-screen px-4">
        <div className="card-glass p-8 max-w-lg w-full animate-fade-in">
          <h1 className="text-2xl font-black text-yellow-400 mb-4">🔧 Firebase Setup Required</h1>
          <p className="text-gray-400 mb-4 text-sm leading-relaxed">
            To enable authentication, you need to set up a Firebase project and add your config to{' '}
            <code className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 text-xs font-mono">
              src/firebase.js
            </code>
          </p>
          <div className="space-y-2 text-sm text-gray-400 mb-6">
            <p className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">1.</span>
              Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">2.</span>
              Create a project → Add a web app
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">3.</span>
              Enable Email/Password + Google auth
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">4.</span>
              Paste the config into <code className="text-gray-300 text-xs font-mono">src/firebase.js</code>
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 transition-all"
          >
            Play Locally Without Account →
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('Please enter a display name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signup(email, password, displayName.trim());
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      const errorMap = {
        'auth/email-already-in-use': 'This email is already registered. Try logging in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Try again.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(errorMap[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-bg flex flex-col items-center justify-center min-h-screen px-4">
      {/* Title */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            ⚔️ Lexicon Duel
          </span>
        </h1>
        <p className="text-gray-500 text-sm">Place letters. Form words. Outscore your rival.</p>
      </div>

      {/* Auth Card */}
      <div className="card-glass p-8 w-full max-w-md animate-slide-up">
        <h2 className="text-xl font-bold text-white mb-6">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={16}
                className="w-full bg-surface-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface-900 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <div className="text-center mt-5">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
