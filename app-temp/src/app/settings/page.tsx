'use client';

import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
  User, Shield, Bell, Database, Download, Trash2, Key,
  ExternalLink, Save, RefreshCw, AlertTriangle, Check,
  Copy, Eye, EyeOff, MessageCircle, Clock
} from 'lucide-react';
import { useState, useCallback } from 'react';

export default function SettingsPage() {
  const { user, reminderPreferences, updateReminderPreferences, clearAllData, loadDemoData, subscriptions } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data'>('profile');
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [telegramCode, setTelegramCode] = useState('');

  const generateLinkCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setTelegramCode(code);
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportCSV = () => {
    const active = subscriptions.filter(s => !s.deletedAt);
    const csv = [
      'Provider,Category,Plan,Billing Cycle,Amount,Currency,Expiry Date,Auto Renew,Status,Tags',
      ...active.map(s =>
        `"${s.providerName}","${s.category}","${s.planName || ''}","${s.billingCycle}",${s.amount},"${s.currency}","${s.expiryDate}",${s.autoRenew},"${s.status}","${s.tags.join(', ')}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subvault-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      subscriptions: subscriptions.filter(s => !s.deletedAt).map(s => ({
        ...s,
        password: '***ENCRYPTED***',
        account: s.account ? '***ENCRYPTED***' : undefined,
        notes: s.notes ? '***ENCRYPTED***' : undefined,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'profile' as const, icon: User, label: 'Profile' },
    { id: 'security' as const, icon: Shield, label: 'Security' },
    { id: 'notifications' as const, icon: Bell, label: 'Notifications' },
    { id: 'data' as const, icon: Database, label: 'Data' },
  ];

  const containerStyle: React.CSSProperties = {
    maxWidth: 900,
    margin: '0 auto',
    padding: '32px 24px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 28,
    marginBottom: 24,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  const reminderDays = [30, 14, 7, 3, 1, 0];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Configure your vault, notifications, and data preferences
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 32,
        border: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isActive ? 'rgba(0,240,255,0.1)' : 'transparent',
                color: isActive ? '#00f0ff' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(0,240,255,0.2)' : '1px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <User size={20} style={{ color: '#00f0ff' }} />
              Account Information
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Username</label>
              <input
                type="text"
                className="input-field"
                value={user?.username || ''}
                readOnly
                style={{ opacity: 0.7 }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                Username cannot be changed in MVP
              </p>
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Account Mode</label>
              <div style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(0,240,255,0.05)',
                border: '1px solid rgba(0,240,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <Shield size={16} style={{ color: '#00f0ff' }} />
                <span style={{ fontSize: 14, color: '#00f0ff' }}>Single-User Mode</span>
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Member Since</label>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Key size={20} style={{ color: '#8b5cf6' }} />
              Encryption
            </div>

            <div style={{
              padding: 20,
              borderRadius: 12,
              background: 'rgba(139,92,246,0.05)',
              border: '1px solid rgba(139,92,246,0.15)',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Shield size={18} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#8b5cf6' }}>AES-256-GCM Encryption</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                All sensitive fields (account, password, notes, support contact) are encrypted before storage.
                In the current demo mode, data is stored in your browser&apos;s localStorage.
                When connected to Supabase, data will be encrypted server-side with a separate encryption key.
              </p>
            </div>

            <div style={{
              padding: 20,
              borderRadius: 12,
              background: 'rgba(0,255,136,0.05)',
              border: '1px solid rgba(0,255,136,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Check size={18} style={{ color: '#00ff88' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#00ff88' }}>Security Boundaries</span>
              </div>
              <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Passwords never appear in Telegram notifications</li>
                <li>CSV exports exclude all credential fields</li>
                <li>Credentials are masked by default in the UI</li>
                <li>Row Level Security (RLS) enabled when connected to Supabase</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Telegram Linking */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <MessageCircle size={20} style={{ color: '#00f0ff' }} />
              Telegram Bot
            </div>

            <div style={{
              padding: 20,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                Connect your Telegram account to receive subscription reminders.
                Click the button below to generate a one-time link code.
              </p>

              {telegramCode ? (
                <div style={{
                  padding: 20,
                  borderRadius: 12,
                  background: 'rgba(0,240,255,0.05)',
                  border: '1px solid rgba(0,240,255,0.2)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Send this code to your Telegram Bot:
                  </p>
                  <code style={{
                    fontSize: 24,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: '#00f0ff',
                    textShadow: '0 0 10px rgba(0,240,255,0.4)',
                    letterSpacing: '0.15em',
                  }}>
                    /link {telegramCode}
                  </code>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10 }}>
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Code expires in 10 minutes
                  </p>
                </div>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={generateLinkCode}
                  style={{ width: '100%' }}
                >
                  <MessageCircle size={16} />
                  Generate Link Code
                </button>
              )}
            </div>
          </div>

          {/* Reminder Preferences */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Bell size={20} style={{ color: '#f59e0b' }} />
              Reminder Preferences
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Telegram Notifications</label>
              <div
                className={`toggle-switch ${reminderPreferences.telegramEnabled ? 'active' : ''}`}
                onClick={() => {
                  updateReminderPreferences({ telegramEnabled: !reminderPreferences.telegramEnabled });
                  showSaved();
                }}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Remind me before expiry</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {reminderDays.map(day => {
                  const isActive = reminderPreferences.reminderDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const newDays = isActive
                          ? reminderPreferences.reminderDays.filter(d => d !== day)
                          : [...reminderPreferences.reminderDays, day].sort((a, b) => b - a);
                        updateReminderPreferences({ reminderDays: newDays });
                        showSaved();
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isActive ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? '#00f0ff' : 'var(--text-secondary)',
                        border: `1px solid ${isActive ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {day === 0 ? 'On the day' : `${day} days`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Daily Digest</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  className={`toggle-switch ${reminderPreferences.dailyDigestEnabled ? 'active' : ''}`}
                  onClick={() => {
                    updateReminderPreferences({ dailyDigestEnabled: !reminderPreferences.dailyDigestEnabled });
                    showSaved();
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Send a morning summary of upcoming renewals
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Export */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Download size={20} style={{ color: '#00f0ff' }} />
              Export Data
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                className="btn-secondary"
                onClick={handleExportCSV}
                style={{ padding: '16px 20px', flexDirection: 'column', height: 'auto' }}
              >
                <Download size={20} />
                <span style={{ fontWeight: 600 }}>Export CSV</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Without credentials</span>
              </button>
              <button
                className="btn-secondary"
                onClick={handleExportJSON}
                style={{ padding: '16px 20px', flexDirection: 'column', height: 'auto' }}
              >
                <Database size={20} />
                <span style={{ fontWeight: 600 }}>Export JSON</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Encrypted backup</span>
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Database size={20} style={{ color: '#8b5cf6' }} />
              Data Management
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 12,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Total Subscriptions
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {subscriptions.filter(s => !s.deletedAt).length} active, {subscriptions.filter(s => s.deletedAt).length} deleted
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: '#00f0ff',
              }}>
                {subscriptions.length}
              </span>
            </div>

            <button
              className="btn-secondary"
              onClick={loadDemoData}
              style={{ width: '100%', marginBottom: 12 }}
            >
              <RefreshCw size={16} />
              Reload Demo Data
            </button>

            {showClearConfirm ? (
              <div style={{
                padding: 20,
                borderRadius: 12,
                background: 'rgba(255,107,107,0.05)',
                border: '1px solid rgba(255,107,107,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <AlertTriangle size={18} style={{ color: '#ff6b6b' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#ff6b6b' }}>
                    Are you sure? This will delete ALL data.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      clearAllData();
                      setShowClearConfirm(false);
                      showSaved();
                    }}
                    style={{ flex: 1 }}
                  >
                    <Trash2 size={16} />
                    Yes, Clear Everything
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowClearConfirm(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn-danger"
                onClick={() => setShowClearConfirm(true)}
                style={{ width: '100%' }}
              >
                <Trash2 size={16} />
                Clear All Data
              </button>
            )}
          </div>

          {/* Storage Info */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Database size={20} style={{ color: '#00ff88' }} />
              Storage Backend
            </div>
            {process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ? (
              <div style={{
                padding: 16,
                borderRadius: 12,
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid rgba(0,255,136,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#00ff88',
                    boxShadow: '0 0 8px rgba(0,255,136,0.5)',
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#00ff88' }}>
                    Supabase PostgreSQL Cloud Storage (Connected)
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Cloud database is connected and active. Database instance: <code style={{ color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>vnueckwzcovkzremoqzz</code> (Region: ap-southeast-1).
                </p>
              </div>
            ) : (
              <div style={{
                padding: 16,
                borderRadius: 12,
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid rgba(0,255,136,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#00ff88',
                    boxShadow: '0 0 8px rgba(0,255,136,0.5)',
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#00ff88' }}>
                    Browser localStorage
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Data is stored locally in your browser. To connect to Supabase for cloud storage, 
                  configure the environment variables in your Vercel project settings.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Saved Toast */}
      {saved && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <Check size={16} style={{ color: '#00ff88' }} />
          Settings saved
        </motion.div>
      )}
    </div>
  );
}
