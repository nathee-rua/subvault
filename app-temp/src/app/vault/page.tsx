'use client';

import { useStore } from '@/lib/store';
import { daysUntil, formatCurrency, formatDate, getUrgencyLabel, toMonthlyAmount } from '@/lib/calculations';
import { CATEGORY_CONFIG, BILLING_CYCLE_LABELS, STATUS_CONFIG, CURRENCY_SYMBOLS, type Category, type SubscriptionStatus, type Subscription, type Currency } from '@/types';
import { getProviderInitials } from '@/lib/providers';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc, Plus, Eye, Edit, Trash2, RotateCcw, Copy, Grid, List, X, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';

export default function VaultPage() {
  const router = useRouter();
  const { subscriptions, deleteSubscription, restoreSubscription } = useStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'All'>('All');
  const [autoRenewFilter, setAutoRenewFilter] = useState<'All' | 'On' | 'Off'>('All');
  const [expiryFilter, setExpiryFilter] = useState<'All' | '7' | '14' | '30' | 'Expired'>('All');
  
  // Sort
  const [sortBy, setSortBy] = useState<'expiry' | 'amount' | 'provider' | 'created'>('expiry');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter dropdown state
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'status' | 'autoRenew' | 'expiry' | 'sort' | null>(null);

  // Derived data
  const activeSubscriptions = useMemo(() => subscriptions.filter(s => !s.deletedAt), [subscriptions]);
  const deletedSubscriptions = useMemo(() => subscriptions.filter(s => !!s.deletedAt), [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return activeSubscriptions.filter(sub => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        sub.providerName.toLowerCase().includes(searchLower) ||
        (sub.planName && sub.planName.toLowerCase().includes(searchLower)) ||
        (sub.tags && sub.tags.some(t => t.toLowerCase().includes(searchLower))) ||
        (sub.account && sub.account.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Category
      if (categoryFilter !== 'All' && sub.category !== categoryFilter) return false;

      // Status
      if (statusFilter !== 'All' && sub.status !== statusFilter) return false;

      // Auto-renew
      if (autoRenewFilter !== 'All') {
        const isAutoRenew = sub.autoRenew;
        if (autoRenewFilter === 'On' && !isAutoRenew) return false;
        if (autoRenewFilter === 'Off' && isAutoRenew) return false;
      }

      // Expiry
      if (expiryFilter !== 'All' && sub.expiryDate) {
        const days = daysUntil(sub.expiryDate);
        if (expiryFilter === 'Expired' && days >= 0) return false;
        if (expiryFilter === '7' && (days < 0 || days > 7)) return false;
        if (expiryFilter === '14' && (days < 0 || days > 14)) return false;
        if (expiryFilter === '30' && (days < 0 || days > 30)) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'expiry':
          if (!a.expiryDate && !b.expiryDate) comparison = 0;
          else if (!a.expiryDate) comparison = 1;
          else if (!b.expiryDate) comparison = -1;
          else comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          break;
        case 'amount':
          const amountA = toMonthlyAmount(a.amount, a.billingCycle);
          const amountB = toMonthlyAmount(b.amount, b.billingCycle);
          comparison = amountA - amountB;
          break;
        case 'provider':
          comparison = a.providerName.localeCompare(b.providerName);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [activeSubscriptions, searchQuery, categoryFilter, statusFilter, autoRenewFilter, expiryFilter, sortBy, sortOrder]);

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setActiveDropdown(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', textShadow: '0 0 10px rgba(0,240,255,0.3)', color: '#00f0ff' }}>Subscription Vault</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Manage and track all your active subscriptions</p>
        </div>
        <Link href="/vault/add" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)',
            border: 'none', borderRadius: '12px', padding: '12px 24px',
            color: '#fff', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 240, 255, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 240, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 240, 255, 0.3)';
          }}>
            <Plus size={20} /> Add Subscription
          </button>
        </Link>
      </div>

      {/* Controls Bar */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '24px',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search providers, plans, tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px 16px 12px 44px',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.border = '1px solid rgba(0,240,255,0.5)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
            />
          </div>
          
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', borderRadius: '8px', padding: '8px', color: viewMode === 'grid' ? '#00f0ff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', borderRadius: '8px', padding: '8px', color: viewMode === 'list' ? '#00f0ff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {/* Filter Dropdown Components */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Category: <span style={{ color: '#00f0ff' }}>{categoryFilter}</span> <ChevronDown size={14} />
            </button>
            {activeDropdown === 'category' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', zIndex: 10, minWidth: '150px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {['All', 'AI', 'VPN', 'Streaming', 'Cloud', 'Gaming', 'Other'].map(cat => (
                  <div key={cat} onClick={() => { setCategoryFilter(cat as any); setActiveDropdown(null); }} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: categoryFilter === cat ? 'rgba(0,240,255,0.1)' : 'transparent', color: categoryFilter === cat ? '#00f0ff' : '#fff' }}>
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Status: <span style={{ color: '#00f0ff' }}>{statusFilter}</span> <ChevronDown size={14} />
            </button>
            {activeDropdown === 'status' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', zIndex: 10, minWidth: '150px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {['All', 'Active', 'Cancelled', 'Expired', 'Paused'].map(stat => (
                  <div key={stat} onClick={() => { setStatusFilter(stat as any); setActiveDropdown(null); }} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: statusFilter === stat ? 'rgba(0,240,255,0.1)' : 'transparent', color: statusFilter === stat ? '#00f0ff' : '#fff' }}>
                    {stat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <SortAsc size={14} /> Sort: <span style={{ color: '#00f0ff' }}>{sortBy}</span> {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            {activeDropdown === 'sort' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', zIndex: 10, minWidth: '150px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {[
                  { val: 'expiry', label: 'Expiry Date' },
                  { val: 'amount', label: 'Amount' },
                  { val: 'provider', label: 'Provider Name' },
                  { val: 'created', label: 'Added Date' }
                ].map(s => (
                  <div key={s.val} onClick={() => toggleSort(s.val as any)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: sortBy === s.val ? 'rgba(0,240,255,0.1)' : 'transparent', color: sortBy === s.val ? '#00f0ff' : '#fff' }}>
                    <span>{s.label}</span>
                    {sortBy === s.val && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {(categoryFilter !== 'All' || statusFilter !== 'All' || autoRenewFilter !== 'All' || expiryFilter !== 'All' || searchQuery) && (
            <button 
              onClick={() => {
                setCategoryFilter('All');
                setStatusFilter('All');
                setAutoRenewFilter('All');
                setExpiryFilter('All');
                setSearchQuery('');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#ff6b6b', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {filteredSubscriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'inline-block', padding: '24px', background: 'rgba(0,240,255,0.05)', borderRadius: '50%', marginBottom: '24px' }}>
            <Search size={48} color="#00f0ff" opacity={0.5} />
          </div>
          <h3 style={{ fontSize: '24px', margin: '0 0 16px 0' }}>No subscriptions found</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>Try adjusting your filters or add a new subscription to get started.</p>
          <Link href="/vault/add" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)',
              border: 'none', borderRadius: '12px', padding: '12px 32px',
              color: '#fff', fontWeight: 'bold', cursor: 'pointer',
            }}>
              Add Subscription
            </button>
          </Link>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            <AnimatePresence>
              {filteredSubscriptions.map(sub => {
                const days = sub.expiryDate ? daysUntil(sub.expiryDate) : null;
                const urgencyColor = days !== null ? (days <= 3 ? '#ff6b6b' : days <= 7 ? '#f59e0b' : days <= 14 ? '#3b82f6' : '#00ff88') : '#888';
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={sub.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      padding: '24px',
                      position: 'relative',
                      backdropFilter: 'blur(10px)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 10px 30px ${urgencyColor}22`;
                      e.currentTarget.style.borderColor = `rgba(255,255,255,0.2)`;
                      const actions = e.currentTarget.querySelector('.quick-actions') as HTMLElement;
                      if (actions) actions.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      const actions = e.currentTarget.querySelector('.quick-actions') as HTMLElement;
                      if (actions) actions.style.opacity = '0';
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: CATEGORY_CONFIG[sub.category]?.color || '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', fontWeight: 'bold', color: '#fff',
                        boxShadow: `0 0 15px ${CATEGORY_CONFIG[sub.category]?.color || '#3b82f6'}55`,
                        flexShrink: 0
                      }}>
                        {getProviderInitials(sub.providerName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.providerName}</div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.planName}</div>
                      </div>
                      
                      <div style={{
                        background: CATEGORY_CONFIG[sub.category].color + '22',
                        color: CATEGORY_CONFIG[sub.category].color,
                        border: `1px solid ${CATEGORY_CONFIG[sub.category].color}55`,
                        padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                      }}>
                        {sub.category}
                      </div>
                    </div>

                    {/* Price and Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Cost</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
                          {formatCurrency(sub.amount, sub.currency)}<span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' }}>/{sub.billingCycle}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Next Billing</div>
                        {sub.expiryDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: urgencyColor, boxShadow: `0 0 8px ${urgencyColor}` }} />
                            <div style={{ fontSize: '14px', color: '#fff' }}>
                              {days !== null ? (days === 0 ? 'Today' : days < 0 ? 'Expired' : `In ${days}d`) : 'Unknown'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Unknown</div>
                        )}
                      </div>
                    </div>

                    {/* Account Info Quick Copy */}
                    {sub.account && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.6)', padding: '0 4px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.account}</div>
                        <button onClick={(e) => { e.preventDefault(); copyToClipboard(sub.account!); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }} title="Copy Email">
                          <Copy size={14} />
                        </button>
                      </div>
                    )}

                    {/* Tags */}
                    {sub.tags && sub.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {sub.tags.slice(0, 3).map(tag => (
                          <div key={tag} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', color: 'rgba(255,255,255,0.7)' }}>
                            #{tag}
                          </div>
                        ))}
                        {sub.tags.length > 3 && (
                          <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', color: 'rgba(255,255,255,0.7)' }}>
                            +{sub.tags.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Actions overlay */}
                    <div className="quick-actions" style={{ 
                      position: 'absolute', top: '16px', right: '16px', 
                      display: 'flex', gap: '8px', opacity: 0, transition: 'opacity 0.2s',
                      background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '12px', backdropFilter: 'blur(4px)'
                    }}>
                      <button onClick={() => router.push(`/vault/${sub.id}`)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px', color: '#fff', cursor: 'pointer' }} title="View">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => router.push(`/vault/${sub.id}/edit`)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px', color: '#fff', cursor: 'pointer' }} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => { if(confirm('Move to deleted?')) deleteSubscription(sub.id); }} style={{ background: 'rgba(255,107,107,0.2)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', padding: '6px', color: '#ff6b6b', cursor: 'pointer' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 1fr 100px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '500' }}>
              <div>Provider / Plan</div>
              <div>Category</div>
              <div>Cost</div>
              <div>Next Billing</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredSubscriptions.map((sub, i) => (
                <div key={sub.id} style={{ 
                  display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 1fr 100px', gap: '16px', padding: '16px 24px', 
                  borderBottom: i < filteredSubscriptions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  alignItems: 'center', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: CATEGORY_CONFIG[sub.category]?.color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                      {getProviderInitials(sub.providerName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{sub.providerName}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{sub.planName}</div>
                    </div>
                  </div>
                  
                  <div>
                    <span style={{
                      background: CATEGORY_CONFIG[sub.category].color + '22',
                      color: CATEGORY_CONFIG[sub.category].color,
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
                    }}>
                      {sub.category}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'monospace' }}>
                    {formatCurrency(sub.amount, sub.currency)}<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>/{sub.billingCycle}</span>
                  </div>

                  <div>
                    {sub.expiryDate ? (
                      <div>
                        <div>{formatDate(sub.expiryDate)}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                          {(() => {
                            const d = daysUntil(sub.expiryDate);
                            return d === 0 ? 'Today' : d < 0 ? 'Expired' : `${d} days left`;
                          })()}
                        </div>
                      </div>
                    ) : '-'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => router.push(`/vault/${sub.id}`)} style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer' }}><Eye size={16} /></button>
                    <button onClick={() => { if(confirm('Delete?')) deleteSubscription(sub.id); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Deleted Items Section */}
      {deletedSubscriptions.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <button 
            onClick={() => setShowDeleted(!showDeleted)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0, fontSize: '16px' }}
          >
            <Trash2 size={16} /> Deleted Items ({deletedSubscriptions.length}) <ChevronDown size={16} style={{ transform: showDeleted ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          <AnimatePresence>
            {showDeleted && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginTop: '16px', background: 'rgba(255,107,107,0.05)', borderRadius: '16px', border: '1px solid rgba(255,107,107,0.1)', padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {deletedSubscriptions.map(sub => (
                      <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{sub.providerName}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{sub.planName}</div>
                        </div>
                        <button 
                          onClick={() => restoreSubscription(sub.id)}
                          style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
