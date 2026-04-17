import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Headset, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rate limiting: max 5 attempts, 30s lockout
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  React.useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setLockCountdown(0);
        clearInterval(id);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return;

    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError('Authentication service unavailable.');
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        const until = Date.now() + 30_000;
        setLockedUntil(until);
        setError('Too many failed attempts. Try again in 30 seconds.');
      } else {
        setError(`Invalid credentials. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
      setIsLoading(false);
      return;
    }

    // Reset attempts on success
    setAttempts(0);

    // Verify the user has admin role
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (roleError || userData?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Unauthorized. Admin access only.');
      setIsLoading(false);
      return;
    }

    setIsExiting(true);
    setTimeout(() => {
      navigate('/admin-dashboard');
    }, 300);
  };

  const handleGoBack = () => {
    setIsExiting(true);
    setTimeout(() => {
        navigate('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-4 font-sans text-white overflow-hidden">
      <AnimatePresence>
        {!isExiting && (
          <motion.div 
            className="w-full max-w-[360px]"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
        
        {/* Logo Area */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="13" height="13" rx="3" stroke="#0ea5e9" strokeWidth="2.5" />
            <rect x="9" y="9" width="13" height="13" rx="3" fill="#0ea5e9" />
          </svg>
          <span className="text-xl font-bold tracking-wide">Admin</span>
        </div>

        {/* Headings */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-2">Log in to your account</h1>
          <p className="text-gray-400 text-sm">Welcome back! Please enter your details.</p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Email
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="input h-[34px] text-[14px] w-full bg-[#09090b] text-[#f4f4f5] px-3 py-1 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-[#09090b] transition-all duration-150 ease-in-out placeholder:text-white/60"
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-200">
                Password
              </label>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Forgot?
              </a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="input h-[34px] text-[14px] w-full bg-[#09090b] text-[#f4f4f5] px-3 py-1 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-[#09090b] transition-all duration-150 ease-in-out placeholder:text-white/60"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-sm text-center -mt-1">{error}</p>
          )}

          {/* Sign In Button */}
          <button 
            type="submit" 
            disabled={isLoading || isLocked}
            className="w-full bg-white text-black font-semibold py-2.5 rounded-md hover:bg-gray-100 transition-colors mt-2 text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLocked
              ? `Locked — ${lockCountdown}s`
              : isLoading
              ? <Loader2 className="w-4 h-4 text-black animate-spin" />
              : 'Log in'
            }
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 border-t border-dashed border-gray-700"></div>
          <span className="text-gray-400 text-xs font-medium">OR</span>
          <div className="flex-1 border-t border-dashed border-gray-700"></div>
        </div>

        {/* Support Button */}
        <button 
          type="button" 
          className="w-full bg-white text-black font-semibold py-2.5 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm mb-8"
        >
          <Headset className="w-4 h-4" />
          Contact STI Support
        </button>

        {/* Footer Link */}
        <div className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <button onClick={handleGoBack} className="text-white font-semibold hover:underline">
            Go back.
          </button>
        </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
