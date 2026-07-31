'use client';

import { useStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  ChevronRight,
  Bell,
  Database,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/vault', icon: Shield, label: 'Vault' },
  { href: '/vault/add', icon: Plus, label: 'Add Subscription' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted || !isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 99,
              display: 'none',
            }}
            className="mobile-overlay"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 260,
          height: '100vh',
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(30px)',
          borderRight: '1px solid var(--border-subtle)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <img
            src="/images/logo.jpg"
            alt="SubVault"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              objectFit: 'cover',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          />
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}>
              SubVault
            </h2>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
              ENCRYPTED VAULT
            </span>
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'none',
            }}
            className="mobile-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{
            padding: '12px 16px 8px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-tertiary)',
          }}>
            Navigation
          </div>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/vault/add');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s',
                  background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,240,255,0.15)' : '1px solid transparent',
                  textDecoration: 'none',
                }}
              >
                <Icon size={18} style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.4))' } : undefined} />
                {item.label}
                {isActive && (
                  <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                )}
              </Link>
            );
          })}

          <div style={{
            padding: '20px 16px 8px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-tertiary)',
          }}>
            System
          </div>
          
          {process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              color: 'var(--text-tertiary)',
              fontSize: 13,
            }}>
              <Database size={16} style={{ color: '#00f0ff' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Supabase DB</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                padding: '2px 8px',
                background: 'rgba(0,240,255,0.1)',
                color: '#00f0ff',
                borderRadius: 20,
                border: '1px solid rgba(0,240,255,0.3)',
                fontWeight: 600,
              }}>
                Cloud Active
              </span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              color: 'var(--text-tertiary)',
              fontSize: 13,
            }}>
              <Database size={16} />
              <span>Local Storage</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                padding: '2px 8px',
                background: 'rgba(0,255,136,0.1)',
                color: '#00ff88',
                borderRadius: 20,
                border: '1px solid rgba(0,255,136,0.2)',
              }}>
                Active
              </span>
            </div>
          )}

          {process.env.NEXT_PUBLIC_TELEGRAM_CONFIGURED === 'true' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              color: 'var(--text-tertiary)',
              fontSize: 13,
            }}>
              <Bell size={16} style={{ color: '#00ff88' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Telegram Bot</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                padding: '2px 8px',
                background: 'rgba(0,255,136,0.1)',
                color: '#00ff88',
                borderRadius: 20,
                border: '1px solid rgba(0,255,136,0.3)',
                fontWeight: 600,
              }}>
                Active
              </span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              color: 'var(--text-tertiary)',
              fontSize: 13,
            }}>
              <Bell size={16} />
              <span>Telegram Bot</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                padding: '2px 8px',
                background: 'rgba(148,163,184,0.1)',
                color: '#94a3b8',
                borderRadius: 20,
                border: '1px solid rgba(148,163,184,0.2)',
              }}>
                Not Set
              </span>
            </div>
          )}
        </nav>

        {/* User Section */}
        <div style={{
          padding: 16,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 8,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(139,92,246,0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--cyan)',
              border: '1px solid rgba(0,240,255,0.2)',
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Single-User Mode
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 12,
              color: 'var(--red)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s',
              background: 'transparent',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,107,107,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,107,107,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'none',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 98,
        gap: 12,
      }}
      className="mobile-header"
      >
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Menu size={24} />
        </button>
        <img src="/images/logo.jpg" alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          SubVault
        </span>
      </div>

      {/* Main Content */}
      <main className="main-content" style={{
        marginLeft: 260,
        flex: 1,
        minHeight: '100vh',
      }}>
        {children}
      </main>

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%) !important;
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding-top: 56px;
          }
          .mobile-header {
            display: flex !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .mobile-close {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
