'use client';

import { useStore } from '@/lib/store';
import { 
  getDashboardStats, 
  getCategoryBreakdown, 
  getCurrencyBreakdown, 
  getUpcomingRenewals, 
  getExpiredSubscriptions, 
  getAutoRenewRisks, 
  getMonthlySpendingData, 
  formatCurrency, 
  daysUntil, 
  formatDate, 
  getUrgencyLabel 
} from '@/lib/calculations';
import { CATEGORY_CONFIG, CURRENCY_SYMBOLS, type Subscription, type Currency } from '@/types';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, AlertTriangle, Shield, Clock, Activity, Zap, ChevronRight, RefreshCw, Plus, PieChart as PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const COLORS = ['#00f0ff', '#8b5cf6', '#3b82f6', '#00ff88', '#ff6b6b', '#f59e0b', '#ec4899'];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  }
};

export default function DashboardPage() {
  const { subscriptions, user } = useStore();

  const stats = useMemo(() => getDashboardStats(subscriptions), [subscriptions]);
  const categoryData = useMemo(() => getCategoryBreakdown(subscriptions), [subscriptions]);
  const currencyData = useMemo(() => getCurrencyBreakdown(subscriptions), [subscriptions]);
  const upcomingRenewals = useMemo(() => getUpcomingRenewals(subscriptions), [subscriptions]);
  const expiredSubs = useMemo(() => getExpiredSubscriptions(subscriptions), [subscriptions]);
  const autoRenewRisks = useMemo(() => getAutoRenewRisks(subscriptions), [subscriptions]);
  const monthlyData = useMemo(() => getMonthlySpendingData(subscriptions), [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: 48,
            textAlign: 'center',
            maxWidth: 500,
            width: '100%'
          }}
        >
          <Zap size={64} color="#00f0ff" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: 32, margin: '0 0 16px', color: '#fff', textShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}>Vault Empty</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.6 }}>
            Initialize your SubVault by adding your first subscription. Track expenses, monitor renewals, and manage your digital life.
          </p>
          <Link href="/vault/add" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(45deg, #00f0ff, #3b82f6)',
              border: 'none',
              borderRadius: 12,
              padding: '16px 32px',
              color: '#000',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)'
            }}>
              <Plus size={20} />
              Add Subscription
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 40 }}
      >
        <h1 style={{ fontSize: 40, margin: '0 0 8px', color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
          System Overview
        </h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>
          Welcome back, {user?.username || 'Commander'}. Monitoring {subscriptions.length} active assets.
        </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 24,
          marginBottom: 40
        }}
      >
        {/* Total Active Stat */}
        <motion.div variants={itemVariants} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '4px solid #00f0ff',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Active Subs</span>
            <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: 8, borderRadius: 8 }}>
              <Activity size={20} color="#00f0ff" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}>
            {stats.totalActive}
          </div>
        </motion.div>

        {/* Monthly Cost Stat */}
        <motion.div variants={itemVariants} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '4px solid #00ff88',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Monthly Burn</span>
            <div style={{ background: 'rgba(0, 255, 136, 0.1)', padding: 8, borderRadius: 8 }}>
              <DollarSign size={20} color="#00ff88" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}>
            {formatCurrency(stats.monthlyCost, 'USD')}
          </div>
        </motion.div>

        {/* Annual Forecast Stat */}
        <motion.div variants={itemVariants} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '4px solid #8b5cf6',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Annual Forecast</span>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: 8, borderRadius: 8 }}>
              <TrendingUp size={20} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>
            {formatCurrency(stats.annualForecast, 'USD')}
          </div>
        </motion.div>

        {/* Renewals Stat */}
        <motion.div variants={itemVariants} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '4px solid #f59e0b',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Upcoming (30d)</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 8, borderRadius: 8 }}>
              <Calendar size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 0 20px rgba(245, 158, 11, 0.5)' }}>
            {upcomingRenewals.length}
          </div>
        </motion.div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Spending Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            padding: 24,
            gridColumn: '1 / -1'
          }}
        >
          <h3 style={{ margin: '0 0 24px', fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="#00f0ff" />
            6-Month Trajectory
          </h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  itemStyle={{ color: '#00f0ff' }}
                />
                <Bar dataKey="amount" fill="#00f0ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            padding: 24
          }}
        >
          <h3 style={{ margin: '0 0 24px', fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChartIcon size={20} color="#8b5cf6" />
            Category Distribution
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', height: 250 }}>
            <div style={{ width: '50%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: '50%', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryData.map((entry, index) => (
                <div key={entry.category} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                  <span style={{ flex: 1, textTransform: 'capitalize' }}>{entry.category}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(entry.amount, 'USD')}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Alerts & Risks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* Upcoming Renewals */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            padding: 24,
            flex: 1
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#f59e0b" />
              Impending Renewals
            </h3>
            {upcomingRenewals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingRenewals.slice(0, 4).map(sub => (
                  <div key={sub.subscription.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 8, borderLeft: `2px solid ${CATEGORY_CONFIG[sub.subscription.category]?.color || '#fff'}` }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{sub.subscription.providerName}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{formatDate(sub.subscription.expiryDate)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(sub.subscription.amount, sub.subscription.currency)}</div>
                      <div style={{ fontSize: 12, color: '#f59e0b' }}>In {daysUntil(sub.subscription.expiryDate)} days</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
                No renewals in the next 30 days.
              </div>
            )}
          </div>

          {/* Auto-Renew Risks */}
          {autoRenewRisks.length > 0 && (
            <div style={{
              background: 'rgba(255,107,107,0.05)',
              border: '1px solid rgba(255,107,107,0.2)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              padding: 24,
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} />
                Auto-Renew Alerts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {autoRenewRisks.slice(0, 2).map(sub => (
                  <div key={sub.subscription.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,107,107,0.1)', padding: '12px 16px', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{sub.subscription.providerName}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600 }}>
                      Renews in {daysUntil(sub.subscription.expiryDate)}d
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
