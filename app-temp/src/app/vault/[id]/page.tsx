'use client';

import { useStore } from '@/lib/store';
import { daysUntil, formatCurrency, formatDate, getUrgencyLabel, calculateNextRenewalDate, toMonthlyAmount } from '@/lib/calculations';
import { CATEGORY_CONFIG, BILLING_CYCLE_LABELS, STATUS_CONFIG, CURRENCY_SYMBOLS, type Currency } from '@/types';
import { getProviderInitials } from '@/lib/providers';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Copy, Eye, EyeOff, Shield, Calendar, DollarSign, RefreshCw, ExternalLink, Tag, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useCallback, useMemo, use } from 'react';

export default function SubscriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const store = useStore();

  const subscription = useMemo(() => store.subscriptions.find(s => s.id === id), [store.subscriptions, id]);

  const [revealAccount, setRevealAccount] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);
  const [revealNotes, setRevealNotes] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCopy = useCallback((text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyState(type);
    setTimeout(() => setCopyState(''), 2000);
  }, []);

  const handleDelete = () => {
    store.deleteSubscription(id);
    router.push('/vault');
  };

  const handleMarkPaid = () => {
    if (!subscription) return;
    const nextDate = calculateNextRenewalDate(subscription.expiryDate, subscription.billingCycle);
    store.updateSubscription(id, { expiryDate: nextDate });
  };

  if (!subscription) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Subscription Not Found</h2>
        <Link href="/vault" style={{ color: '#00f0ff', textDecoration: 'none' }}>Return to Vault</Link>
      </div>
    );
  }

  const daysRemaining = daysUntil(subscription.expiryDate);
  const urgency = getUrgencyLabel(daysRemaining);
  const monthlyAmount = toMonthlyAmount(subscription.amount, subscription.billingCycle);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/vault')} className="glass-card-hover" style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href={`/vault/add?edit=${id}`} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <Edit size={16} /> Edit
          </Link>
          <button onClick={() => setShowDeleteModal(true)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.5)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100px', background: 'linear-gradient(180deg, rgba(0,240,255,0.1) 0%, transparent 100%)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: CATEGORY_CONFIG[subscription.category]?.color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#fff', boxShadow: `0 10px 20px ${CATEGORY_CONFIG[subscription.category]?.color}40` }}>
            {getProviderInitials(subscription.providerName)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>{subscription.providerName}</h1>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: `${CATEGORY_CONFIG[subscription.category]?.color}20`, color: CATEGORY_CONFIG[subscription.category]?.color, border: `1px solid ${CATEGORY_CONFIG[subscription.category]?.color}40` }}>
                {subscription.category}
              </span>
            </div>
            {subscription.planName && <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 1rem 0' }}>{subscription.planName}</p>}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: STATUS_CONFIG[subscription.status].color, fontSize: '0.85rem', fontWeight: '600' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_CONFIG[subscription.status].color, boxShadow: `0 0 8px ${STATUS_CONFIG[subscription.status].color}` }} />
                {STATUS_CONFIG[subscription.status].label}
              </span>
              {subscription.autoRenew && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#00ff88', fontSize: '0.85rem' }}>
                  <RefreshCw size={14} /> Auto-renews
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Billing Info */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} /> Billing Details
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
              {formatCurrency(subscription.amount, subscription.currency)}
            </span>
            <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginLeft: '0.5rem' }}>
              / {BILLING_CYCLE_LABELS[subscription.billingCycle]}
            </span>
          </div>
          {subscription.billingCycle !== 'monthly' && (
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Monthly Equivalent: </span>
              <strong style={{ color: '#00f0ff' }}>{formatCurrency(monthlyAmount, subscription.currency)}/mo</strong>
            </div>
          )}
        </div>

        {/* Dates Info */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} /> Schedule
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Next Payment</span>
              <strong style={{ color: '#fff' }}>{formatDate(subscription.expiryDate)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Time Remaining</span>
              <span style={{ 
                padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold',
                background: daysRemaining <= 3 ? 'rgba(255,107,107,0.1)' : daysRemaining <= 7 ? 'rgba(255,170,0,0.1)' : 'rgba(0,255,136,0.1)',
                color: daysRemaining <= 3 ? '#ff6b6b' : daysRemaining <= 7 ? '#ffaa00' : '#00ff88'
              }}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
              </span>
            </div>
            {subscription.startDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Subscribed Since</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{formatDate(subscription.startDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button onClick={handleMarkPaid} className="btn-primary" style={{ padding: '1rem 2rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #00f0ff, #3b82f6)', color: '#000', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 0 20px rgba(0,240,255,0.3)' }}>
          <CheckCircle size={20} /> Mark as Paid (Renew)
        </button>
      </div>

      {/* Credentials Vault */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', marginBottom: '1.5rem', boxShadow: 'inset 0 0 30px rgba(0,240,255,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#00f0ff', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} /> Secured Credentials
        </h3>
        
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {subscription.account && (
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Account / Email</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{revealAccount ? subscription.account : '••••••••••••••••'}</span>
                  <button onClick={() => setRevealAccount(!revealAccount)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    {revealAccount ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button onClick={() => handleCopy(subscription.account!, 'account')} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                  {copyState === 'account' ? <CheckCircle size={18} color="#00ff88" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}

          {subscription.password && (
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Password</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{revealPassword ? subscription.password : '••••••••••••••••'}</span>
                  <button onClick={() => setRevealPassword(!revealPassword)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    {revealPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button onClick={() => handleCopy(subscription.password!, 'password')} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                  {copyState === 'password' ? <CheckCircle size={18} color="#00ff88" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}

          {!subscription.account && !subscription.password && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>No credentials stored for this subscription.</p>
          )}

          {(subscription.notes || subscription.supportContact) && <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />}

          {subscription.supportContact && (
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Support Contact</span>
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem' }}>
                {subscription.supportContact}
              </div>
            </div>
          )}

          {subscription.notes && (
            <div>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                <span>Private Notes</span>
                <button onClick={() => setRevealNotes(!revealNotes)} style={{ background: 'none', border: 'none', color: '#00f0ff', fontSize: '0.75rem', cursor: 'pointer' }}>{revealNotes ? 'Hide' : 'Reveal'}</button>
              </span>
              {revealNotes ? (
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                  {subscription.notes}
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Notes hidden
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      {subscription.tags && subscription.tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <Tag size={16} color="rgba(255,255,255,0.5)" />
          {subscription.tags.map(tag => (
            <span key={tag} style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: '#0a0a0f', border: '1px solid rgba(255,107,107,0.3)', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ color: '#ff6b6b', margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Delete Subscription?</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{subscription.providerName}</strong>? This action cannot be undone and all secured credentials will be permanently lost.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#ff6b6b', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
