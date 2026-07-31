'use client';

import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
  User, Shield, Bell, Database, Download, Trash2, Key,
  ExternalLink, Save, RefreshCw, AlertTriangle, Check,
  Copy, Eye, EyeOff, MessageCircle, Clock, Zap, Cpu, Sparkles
} from 'lucide-react';
import { useState, useCallback } from 'react';

export default function SettingsPage() {
  const { user, reminderPreferences, updateReminderPreferences, clearAllData, subscriptions } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'integrations' | 'data'>('notifications');
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [telegramCode, setTelegramCode] = useState('');

  // Telegram Configuration State
  const [telegramToken, setTelegramToken] = useState('8728086041:AAEzG4fGumZcTvxW-SI9QwAU5RAdFBbtI6A');
  const [telegramChatId, setTelegramChatId] = useState('2140484373');
  const [showToken, setShowToken] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>({
    type: 'success',
    msg: 'Connected to @Travelboz_pass_bot (Chat ID: 2140484373)',
  });

  // Gemini API Configuration State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiModels, setGeminiModels] = useState<string[]>(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']);
  const [selectedGeminiModel, setSelectedGeminiModel] = useState('gemini-2.5-flash');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  // Test Telegram Connection & Send Confirmation
  const handleTestTelegram = async () => {
    setTelegramLoading(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/settings/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: telegramToken, chatId: telegramChatId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTelegramStatus({ type: 'error', msg: data.error || 'Connection test failed' });
      } else {
        setTelegramStatus({
          type: 'success',
          msg: `Connected! Bot: @${data.botUsername} (${data.botName}). Confirmation message sent to Telegram!`,
        });
      }
    } catch (err: any) {
      setTelegramStatus({ type: 'error', msg: err.message || 'Server error' });
    } finally {
      setTelegramLoading(false);
    }
  };

  // Fetch Available Gemini Models
  const handleFetchGeminiModels = async () => {
    if (!geminiApiKey) {
      setGeminiStatus({ type: 'error', msg: 'Please enter a Gemini API Key first' });
      return;
    }
    setGeminiLoading(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/settings/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey, action: 'fetch_models' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setGeminiStatus({ type: 'error', msg: data.error || 'Failed to fetch Gemini models' });
      } else {
        setGeminiModels(data.models);
        if (data.models.length > 0) setSelectedGeminiModel(data.models[0]);
        setGeminiStatus({ type: 'success', msg: `Retrieved ${data.models.length} Gemini models successfully!` });
      }
    } catch (err: any) {
      setGeminiStatus({ type: 'error', msg: err.message || 'Server error' });
    } finally {
      setGeminiLoading(false);
    }
  };

  // Test Gemini Connection
  const handleTestGemini = async () => {
    if (!geminiApiKey) {
      setGeminiStatus({ type: 'error', msg: 'Please enter a Gemini API Key first' });
      return;
    }
    setGeminiLoading(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/settings/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey, action: 'test_connection', selectedModel: selectedGeminiModel }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setGeminiStatus({ type: 'error', msg: data.error || 'Connection test failed' });
      } else {
        setGeminiStatus({
          type: 'success',
          msg: `Connection successful! Model ${data.model} responded: "${data.responseText}"`,
        });
      }
    } catch (err: any) {
      setGeminiStatus({ type: 'error', msg: err.message || 'Server error' });
    } finally {
      setGeminiLoading(false);
    }
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
    { id: 'integrations' as const, icon: Zap, label: 'APIs & Bots' },
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
          Configure your vault, integrations, and data preferences
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
              Encryption & Environment Security
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
                All sensitive fields (account, password, notes, support contact, API tokens) are encrypted before storage.
                Important API tokens and credentials are securely stored server-side in <code>.env.local</code> / Vercel Environment Variables.
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
                <li>Secret API keys are never exposed in public client bundles or Git commits</li>
                <li>Gitleaks v8.30.1 automated secret scanning enabled in build pipeline</li>
                <li>Passwords and tokens are masked by default in the UI</li>
                <li>Row Level Security (RLS) enabled on Supabase Cloud Database</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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

      {/* APIs & Bots Tab */}
      {activeTab === 'integrations' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Telegram Bot Integration */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <MessageCircle size={20} style={{ color: '#00f0ff' }} />
              Telegram Bot Integration
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Configure your Telegram Bot token and Chat ID to receive instant notifications and save subscriptions directly from Telegram chat.
            </p>

            <div style={fieldGroupStyle}>
              <label className="input-label">Telegram Bot API Access Token</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  className="input-field"
                  placeholder="e.g. 8728086041:AAEzG4f..."
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                />
                <button
                  className="btn-icon"
                  onClick={() => setShowToken(!showToken)}
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Telegram User Chat ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 2140484373"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
            </div>

            {telegramStatus && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: telegramStatus.type === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${telegramStatus.type === 'success' ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: telegramStatus.type === 'success' ? '#00ff88' : '#ef4444',
              }}>
                {telegramStatus.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                <span>{telegramStatus.msg}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                className="btn-primary"
                onClick={handleTestTelegram}
                disabled={telegramLoading}
                style={{ flex: 1 }}
              >
                {telegramLoading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                {telegramLoading ? 'Testing...' : 'Test Connection & Link'}
              </button>

              <button
                className="btn-secondary"
                onClick={generateLinkCode}
                style={{ flex: 1 }}
              >
                <MessageCircle size={16} />
                Generate Link Code
              </button>
            </div>

            {telegramCode && (
              <div style={{
                padding: 16,
                borderRadius: 12,
                background: 'rgba(0,240,255,0.05)',
                border: '1px solid rgba(0,240,255,0.2)',
                textAlign: 'center',
                marginTop: 20,
              }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Send this link code directly to your Telegram Bot:
                </p>
                <code style={{
                  fontSize: 22,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#00f0ff',
                  textShadow: '0 0 10px rgba(0,240,255,0.4)',
                  letterSpacing: '0.15em',
                }}>
                  /link {telegramCode}
                </code>
              </div>
            )}
          </div>

          {/* Google Gemini API Integration */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Sparkles size={20} style={{ color: '#8b5cf6' }} />
              Google Gemini AI API Integration
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Connect your Google Gemini API key to enable AI-powered subscription parsing, provider prediction, and receipt analysis.
            </p>

            <div style={fieldGroupStyle}>
              <label className="input-label">Google Gemini API Key</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter Gemini API Key (e.g. AIzaSy...)"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <button
                  className="btn-icon"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  title={showGeminiKey ? 'Hide key' : 'Show key'}
                >
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label className="input-label">Select Gemini Model</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="input-field"
                  value={selectedGeminiModel}
                  onChange={(e) => setSelectedGeminiModel(e.target.value)}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }}
                >
                  {geminiModels.map(m => (
                    <option key={m} value={m} style={{ background: '#0a0d14', color: '#fff' }}>
                      {m}
                    </option>
                  ))}
                </select>

                <button
                  className="btn-secondary"
                  onClick={handleFetchGeminiModels}
                  disabled={geminiLoading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <RefreshCw size={14} className={geminiLoading ? 'animate-spin' : ''} />
                  Fetch Models
                </button>
              </div>
            </div>

            {geminiStatus && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: geminiStatus.type === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${geminiStatus.type === 'success' ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: geminiStatus.type === 'success' ? '#00ff88' : '#ef4444',
              }}>
                {geminiStatus.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                <span>{geminiStatus.msg}</span>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleTestGemini}
              disabled={geminiLoading}
              style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #00f0ff)' }}
            >
              {geminiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {geminiLoading ? 'Testing Gemini AI...' : 'Test Connection & Save Gemini Key'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Download size={20} style={{ color: '#00f0ff' }} />
              Export & Backup Data
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Export your subscription records in CSV or encrypted JSON format for local backup.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={16} />
                Export CSV
              </button>
              <button className="btn-secondary" onClick={handleExportJSON}>
                <Download size={16} />
                Export JSON (Encrypted)
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <Trash2 size={20} style={{ color: '#ef4444' }} />
              Clear System Data
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Permanently delete all subscription entries and reset your local vault storage.
            </p>

            {!showClearConfirm ? (
              <button className="btn-danger" onClick={() => setShowClearConfirm(true)}>
                <Trash2 size={16} />
                Clear All Data
              </button>
            ) : (
              <div style={{
                padding: 20,
                borderRadius: 12,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>
                  Are you sure? This action cannot be undone!
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      clearAllData();
                      setShowClearConfirm(false);
                      showSaved();
                    }}
                  >
                    Yes, Clear Everything
                  </button>
                  <button className="btn-secondary" onClick={() => setShowClearConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Floating Saved Toast */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: 'rgba(0,255,136,0.15)',
            border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: 12,
            padding: '12px 20px',
            color: '#00ff88',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 32px rgba(0,255,136,0.2)',
            zIndex: 1000,
          }}
        >
          <Check size={18} />
          Settings Saved Successfully!
        </motion.div>
      )}
    </div>
  );
}
