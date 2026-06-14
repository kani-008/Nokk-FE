import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, error, clearError, user } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
    return () => clearError();
  }, [isLoggedIn, user, navigate, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    // Simulate brief network delay
    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);
      if (success) {
        addToast(`Welcome back, ${email === 'admin@nammaoor.com' ? 'Admin Selvam' : 'Anbarasan M'}!`, 'success');
      }
    }, 800);
  };

  const handleGoogleLogin = () => {
    addToast('Google OAuth sign-in simulated successfully!', 'success');
    login('customer@gmail.com', 'customer123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-sand/35 py-12 px-4 sm:px-6 lg:px-8 font-inter palm-leaf-pattern">
      <div className="max-w-md w-full bg-white border border-brand-sand rounded-3xl p-8 shadow-xl relative border-b-8 border-b-brand-sand">
        
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark/50 hover:text-brand-primary mb-6 transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="bg-brand-primary text-brand-cream p-3.5 rounded-full w-max mx-auto shadow-inner">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.15,6.08L2.09,20.14a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l2.06-2.06A9.89,9.89,0,0,0,12,22a10,10,0,0,0,10-10C22,5.2,16.5,2,12,2Zm5,11H7a1,1,0,0,1,0-2H17a1,1,0,0,1,0,2Z" />
            </svg>
          </div>
          <h2 className="font-tiro-tamil text-xl md:text-2xl text-brand-primary font-bold">
            உள்நுழையவும்
          </h2>
          <p className="font-playfair text-xs md:text-sm text-brand-dark/55 font-bold">
            Sign In to your Karuvattu Kadai account
          </p>
        </div>

        {/* Error popup */}
        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials hints */}
        <div className="bg-brand-cream border border-brand-sand/75 p-3.5 rounded-2xl mb-6 text-xs text-brand-dark/75 space-y-1">
          <p className="font-bold text-brand-ocean uppercase tracking-wider text-[9px] mb-1">Demo Credentials Quick access:</p>
          <p>👤 <strong>Admin:</strong> <code className="bg-white px-1.5 py-0.5 rounded font-mono border">admin@nammaoor.com</code> / <code className="bg-white px-1.5 py-0.5 rounded font-mono border">admin123</code></p>
          <p>👤 <strong>Customer:</strong> <code className="bg-white px-1.5 py-0.5 rounded font-mono border">customer@gmail.com</code> / <code className="bg-white px-1.5 py-0.5 rounded font-mono border">customer123</code></p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark/70">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. Selvamen@gmail.com"
                className="w-full bg-brand-cream border border-brand-sand/75 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/35 font-medium"
              />
              <Mail className="w-4.5 h-4.5 text-brand-dark/40 absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-brand-dark/70">
              <label>Password</label>
              <Link to="/login" className="text-brand-primary hover:underline font-bold text-[10px]">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-cream border border-brand-sand/75 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/35 font-medium"
              />
              <Lock className="w-4.5 h-4.5 text-brand-dark/40 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-cream py-3 rounded-xl text-sm font-bold hover:bg-brand-secondary active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-brand-sand"></div>
          <span className="flex-shrink mx-4 text-brand-dark/40 text-[10px] uppercase font-bold tracking-wider">or continue with</span>
          <div className="flex-grow border-t border-brand-sand"></div>
        </div>

        {/* Google OAuth simulation */}
        <button
          onClick={handleGoogleLogin}
          className="w-full border border-brand-sand bg-white text-brand-dark py-2.5 rounded-xl text-xs font-bold hover:bg-brand-sand/20 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {/* Simulated Google colored G icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign In with Google
        </button>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-brand-dark/65 font-medium">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-brand-primary hover:underline font-bold">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}
