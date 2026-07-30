-- ============================================
-- SubVault - Complete Database Schema
-- Supabase Migration
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Profiles Table
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Providers Table
-- ============================================
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  website TEXT,
  logo_url TEXT,
  color TEXT NOT NULL DEFAULT '#94a3b8',
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX providers_category_idx ON public.providers(category);
CREATE INDEX providers_user_id_idx ON public.providers(user_id);

-- ============================================
-- Subscriptions Table
-- ============================================
CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'expired',
  'paused',
  'archived'
);

CREATE TYPE subscription_source AS ENUM (
  'manual',
  'telegram_text',
  'telegram_image',
  'import'
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  custom_provider_name TEXT,
  category TEXT NOT NULL DEFAULT 'other',

  plan_name TEXT,
  billing_cycle TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'THB',

  start_date DATE,
  expiry_date DATE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  status subscription_status NOT NULL DEFAULT 'active',

  account_encrypted TEXT,
  password_encrypted TEXT,
  notes_encrypted TEXT,
  support_contact_encrypted TEXT,

  receipt_storage_path TEXT,
  source subscription_source NOT NULL DEFAULT 'manual',
  last_reminder_snoozed_until DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_expiry_date_idx ON public.subscriptions(expiry_date);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX subscriptions_category_idx ON public.subscriptions(category);

-- ============================================
-- Subscription Tags Table
-- ============================================
CREATE TABLE public.subscription_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscription_id, tag)
);

CREATE INDEX subscription_tags_subscription_id_idx ON public.subscription_tags(subscription_id);

-- ============================================
-- Telegram Sessions Table
-- ============================================
CREATE TABLE public.telegram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Telegram Link Codes Table
-- ============================================
CREATE TABLE public.telegram_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Telegram Import Drafts Table
-- ============================================
CREATE TABLE public.telegram_import_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_message_id BIGINT,
  raw_input TEXT,
  parsed_data JSONB,
  confidence_scores JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Reminder Preferences Table
-- ============================================
CREATE TABLE public.reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_days INTEGER[] NOT NULL DEFAULT ARRAY[30, 14, 7, 3, 1, 0],
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  daily_digest_hour_utc INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Notification Logs Table
-- ============================================
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'telegram',
  days_before_expiry INTEGER,
  scheduled_for DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (
    subscription_id,
    notification_type,
    days_before_expiry,
    scheduled_for,
    channel
  )
);

CREATE INDEX notification_logs_subscription_id_idx ON public.notification_logs(subscription_id);
CREATE INDEX notification_logs_scheduled_for_idx ON public.notification_logs(scheduled_for);

-- ============================================
-- Audit Logs Table
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX audit_logs_entity_id_idx ON public.audit_logs(entity_id);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view preset and own providers" ON public.providers FOR SELECT USING (is_preset = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own providers" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own providers" ON public.providers FOR UPDATE USING (auth.uid() = user_id AND is_preset = false);
CREATE POLICY "Users can delete own providers" ON public.providers FOR DELETE USING (auth.uid() = user_id AND is_preset = false);

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Tags
ALTER TABLE public.subscription_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscription tags" ON public.subscription_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.subscriptions WHERE id = subscription_tags.subscription_id AND user_id = auth.uid())
);

-- Telegram Sessions
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own telegram session" ON public.telegram_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own telegram session" ON public.telegram_sessions FOR ALL USING (auth.uid() = user_id);

-- Link Codes
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own link codes" ON public.telegram_link_codes FOR ALL USING (auth.uid() = user_id);

-- Import Drafts
ALTER TABLE public.telegram_import_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own import drafts" ON public.telegram_import_drafts FOR ALL USING (auth.uid() = user_id);

-- Reminder Preferences
ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminder preferences" ON public.reminder_preferences FOR ALL USING (auth.uid() = user_id);

-- Notification Logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notification logs" ON public.notification_logs FOR SELECT USING (auth.uid() = user_id);

-- Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_telegram_sessions_updated_at BEFORE UPDATE ON public.telegram_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reminder_preferences_updated_at BEFORE UPDATE ON public.reminder_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_telegram_import_drafts_updated_at BEFORE UPDATE ON public.telegram_import_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
