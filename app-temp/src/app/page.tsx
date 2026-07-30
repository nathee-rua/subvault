'use client';

import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, User, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, login } = useStore();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted) return null;
  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Simulate brief loading
    await new Promise(r => setTimeout(r, 800));

    const success = login(username, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
      setLoading(false);
    }
  };

  // Floating particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 5,
    delay: Math.random() * 5,
  }));

  return (
    <div className="login-page" style={{ backgroundImage: 'url(/images/login-bg.jpg)' }}>
      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.id % 3 === 0 ? '#00f0ff' : p.id % 3 === 1 ? '#8b5cf6' : '#3b82f6',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          style={{ textAlign: 'center', marginBottom: 32 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <img
            src="/images/logo.jpg"
            alt="SubVault"
            className="login-logo"
          />
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            SubVault
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Subscription Tracker & Credential Vault
          </p>
        </motion.div>

        {/* Decorative line */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
          marginBottom: 32,
          opacity: 0.3,
        }} />

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 28,
          border: '1px solid var(--border-subtle)',
        }}>
          {['Sign In', 'Sign Up'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setIsSignUp(i === 1); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: (i === 0 ? !isSignUp : isSignUp)
                  ? 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(139,92,246,0.15))'
                  : 'transparent',
                color: (i === 0 ? !isSignUp : isSignUp) ? 'var(--cyan)' : 'var(--text-tertiary)',
                border: (i === 0 ? !isSignUp : isSignUp) 
                  ? '1px solid rgba(0,240,255,0.2)' 
                  : '1px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Username */}
              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)',
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: 42 }}
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: isSignUp ? 20 : 24 }}>
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    style={{ paddingLeft: 42, paddingRight: 42 }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {isSignUp && (
                <motion.div
                  style={{ marginBottom: 24 }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="input-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Shield
                      size={18}
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }}
                    />
                    <input
                      type="password"
                      className="input-field"
                      style={{ paddingLeft: 42 }}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  color: 'var(--red)',
                  fontSize: 13,
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: 'var(--red-dim)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,107,107,0.2)',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: 16,
              fontWeight: 700,
              position: 'relative',
              opacity: loading ? 0.7 : 1,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Zap size={20} />
              </motion.div>
            ) : (
              <>
                {isSignUp ? 'Create Vault' : 'Unlock Vault'}
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* Security Notice */}
        <div style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: 'var(--text-tertiary)',
          fontSize: 12,
        }}>
          <Shield size={14} />
          <span>AES-256-GCM encrypted vault</span>
          <Sparkles size={14} style={{ color: 'var(--cyan)', opacity: 0.5 }} />
        </div>

        {/* Version */}
        <div style={{
          marginTop: 16,
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: 11,
          opacity: 0.5,
        }}>
          SubVault v1.0 • Single-User Mode
        </div>
      </motion.div>
    </div>
  );
}
