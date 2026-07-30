'use client';

import { useStore } from '@/lib/store';
import { PRESET_PROVIDERS, getProvidersByCategory, searchProviders, getProviderInitials } from '@/lib/providers';
import { CATEGORY_CONFIG, BILLING_CYCLE_LABELS, type Category, type BillingCycle, type Currency, type SubscriptionFormData, type Provider } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Shield, Eye, EyeOff, Plus, Check, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

const STEPS = ['Select Provider', 'Details', 'Credentials', 'Review'];

export default function AddSubscriptionPage() {
  const router = useRouter();
  const store = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<Partial<SubscriptionFormData>>({
    currency: 'THB',
    billingCycle: 'monthly',
    autoRenew: true,
    tags: []
  });

  const [customProvider, setCustomProvider] = useState<Partial<Provider>>({
    category: 'other',
    color: '#8b5cf6'
  });

  const [isCustom, setIsCustom] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const filteredProviders = useMemo(() => {
    let providers = PRESET_PROVIDERS;
    if (selectedCategory !== 'ALL') {
      providers = getProvidersByCategory(selectedCategory);
    }
    if (searchQuery) {
      providers = searchProviders(searchQuery);
    }
    return providers;
  }, [searchQuery, selectedCategory]);

  const handleProviderSelect = (provider: Provider) => {
    setIsCustom(false);
    setFormData((prev) => ({
      ...prev,
      providerId: provider.id,
      providerName: provider.name,
      category: provider.category
    }));
    setCurrentStep(2);
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setFormData((prev) => ({
      ...prev,
      providerId: `custom_${Date.now()}`
    }));
    setCurrentStep(2);
  };

  const nextStep = () => setCurrentStep((p) => Math.min(p + 1, 4));
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const handleSave = () => {
    const finalData: SubscriptionFormData = {
      providerId: formData.providerId || '',
      providerName: isCustom ? customProvider.name || 'Custom Provider' : formData.providerName || '',
      category: isCustom ? (customProvider.category as Category) : formData.category || 'other',
      planName: formData.planName || '',
      amount: formData.amount || 0,
      currency: formData.currency || 'THB',
      billingCycle: formData.billingCycle || 'monthly',
      startDate: formData.startDate,
      expiryDate: formData.expiryDate || new Date().toISOString().split('T')[0],
      autoRenew: formData.autoRenew || false,
      account: formData.account,
      password: formData.password,
      notes: formData.notes,
      tags: formData.tags || [],
      supportContact: formData.supportContact,
      source: 'manual'
    };
    
    // In a real app, if custom, we'd add the custom provider to the store first.
    // For now we just save the sub
    store.addSubscription(finalData);
    router.push('/vault');
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} className="glass-card-hover" style={{ padding: '0.5rem', borderRadius: '50%', marginRight: '1rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="glow-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Add Subscription</h1>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '12px', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '12px', left: '0', width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`, height: '2px', background: '#00f0ff', zIndex: 0, transition: 'width 0.3s ease' }} />
        
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isPast = stepNum < currentStep;
          return (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: isActive || isPast ? '#0a0a0f' : '#1a1a2e',
                border: `2px solid ${isActive || isPast ? '#00f0ff' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive ? '0 0 10px #00f0ff' : 'none',
                color: isActive || isPast ? '#00f0ff' : 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem', fontWeight: 'bold'
              }}>
                {isPast ? <Check size={14} /> : stepNum}
              </div>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: isActive ? '#00f0ff' : 'rgba(255,255,255,0.5)', textShadow: isActive ? '0 0 8px rgba(0,240,255,0.5)' : 'none' }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'relative', minHeight: '400px' }}>
        <AnimatePresence mode="wait" custom={1}>
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
                {['ALL', 'AI', 'VPN', 'STREAMING', 'CLOUD', 'GAMING', 'OTHER'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as Category | 'ALL')}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid',
                      borderColor: selectedCategory === cat ? '#00f0ff' : 'rgba(255,255,255,0.1)',
                      background: selectedCategory === cat ? 'rgba(0,240,255,0.1)' : 'transparent',
                      color: selectedCategory === cat ? '#00f0ff' : '#fff',
                      cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '1rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {filteredProviders.map(provider => (
                  <div
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    className="glass-card-hover"
                    style={{
                      padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%', marginBottom: '1rem',
                      background: provider.color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', boxShadow: `0 0 15px ${provider.color || '#3b82f6'}80`
                    }}>
                      {getProviderInitials(provider.name)}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>{provider.name}</span>
                  </div>
                ))}
                <div
                  onClick={handleCustomSelect}
                  className="glass-card-hover"
                  style={{
                    padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)',
                    borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%', marginBottom: '1rem',
                    background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff'
                  }}>
                    <Plus size={24} />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>Custom</span>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {isCustom && (
                  <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Provider Name</label>
                      <input type="text" className="input-field" value={customProvider.name || ''} onChange={(e) => setCustomProvider({ ...customProvider, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Category</label>
                      <select className="input-field" value={customProvider.category || 'other'} onChange={(e) => setCustomProvider({ ...customProvider, category: e.target.value as Category })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                        {Object.keys(CATEGORY_CONFIG).map(cat => <option key={cat} value={cat} style={{ background: '#0a0a0f' }}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Plan Name</label>
                    <input type="text" placeholder="e.g., Premium, Family" className="input-field" value={formData.planName || ''} onChange={(e) => setFormData({ ...formData, planName: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Amount</label>
                      <input type="number" step="0.01" className="input-field" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Currency</label>
                      <select className="input-field" value={formData.currency || 'THB'} onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                        <option value="THB">THB</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="JPY">JPY</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Billing Cycle</label>
                    <select className="input-field" value={formData.billingCycle || 'monthly'} onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                      {Object.entries(BILLING_CYCLE_LABELS).map(([val, label]) => <option key={val} value={val} style={{ background: '#0a0a0f' }}>{label}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Start Date (Optional)</label>
                      <input type="date" className="input-field" value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Next Renewal Date</label>
                      <input type="date" className="input-field" value={formData.expiryDate || ''} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem', color: '#fff' }}>Auto Renew</span>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <div style={{ position: 'relative', width: '40px', height: '24px', background: formData.autoRenew ? '#00f0ff' : 'rgba(255,255,255,0.2)', borderRadius: '12px', transition: 'background 0.3s' }}>
                        <div style={{ position: 'absolute', top: '2px', left: formData.autoRenew ? '18px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s' }} />
                      </div>
                      <input type="checkbox" style={{ display: 'none' }} checked={!!formData.autoRenew} onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })} />
                    </label>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Tags (comma separated)</label>
                    <input type="text" placeholder="work, personal, shared" className="input-field" value={tagsInput} onChange={(e) => {
                      setTagsInput(e.target.value);
                      setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) });
                    }} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,240,255,0.2)', boxShadow: 'inset 0 0 20px rgba(0,240,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#00f0ff' }}>
                  <Shield size={20} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Secure Vault Area</span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                  These fields will be encrypted with AES-256-GCM before storage. They are completely optional.
                </p>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Account / Email</label>
                    <input type="text" className="input-field" value={formData.account || ''} onChange={(e) => setFormData({ ...formData, account: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? "text" : "password"} className="input-field" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }} />
                      <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Support Contact</label>
                    <input type="text" className="input-field" value={formData.supportContact || ''} onChange={(e) => setFormData({ ...formData, supportContact: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Private Notes</label>
                    <textarea className="input-field" rows={3} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff', resize: 'vertical' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 30px rgba(0,240,255,0.3)' }}>
                    <Sparkles size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>Review Subscription</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Please verify the details below before saving to vault.</p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Provider</span>
                      <strong style={{ color: '#fff', fontSize: '1rem' }}>{isCustom ? customProvider.name : formData.providerName}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Plan</span>
                      <strong style={{ color: '#fff', fontSize: '1rem' }}>{formData.planName || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Amount</span>
                      <strong style={{ color: '#00f0ff', fontSize: '1.1rem' }}>{formData.amount} {formData.currency}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginLeft: '0.5rem' }}>/ {formData.billingCycle?.toLowerCase()}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Next Renewal</span>
                      <strong style={{ color: '#fff', fontSize: '1rem' }}>{formData.expiryDate}</strong>
                    </div>
                  </div>

                  {formData.account && (
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Secured Credentials</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', background: 'rgba(0,240,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                        <Shield size={14} color="#00f0ff" />
                        <span>{formData.account}</span>
                        {formData.password && <span>• ••••••••••</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: '#fff', cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>

        {currentStep < 4 ? (
          <button
            onClick={nextStep}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(90deg, #00f0ff, #3b82f6)', color: '#000', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            style={{
              padding: '0.75rem 2rem', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(90deg, #00ff88, #00f0ff)', color: '#000', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 0 20px rgba(0,255,136,0.4)'
            }}
          >
            Save to Vault <Check size={18} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
