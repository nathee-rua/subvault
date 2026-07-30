-- ============================================
-- SubVault RLS Security Policy Verification Queries
-- ============================================
-- Execute in Supabase SQL Editor to verify cross-tenant isolation

BEGIN;

-- 1. Create 2 mock test user IDs (UUID format)
DO $$
DECLARE
  user_a UUID := '11111111-1111-4111-a111-111111111111';
  user_b UUID := '22222222-2222-4222-b222-222222222222';
  sub_a_id UUID;
  count_b INTEGER;
BEGIN
  -- Insert mock subscriptions for User A and User B
  INSERT INTO public.subscriptions (user_id, provider_name, category, billing_cycle, amount, currency, expiry_date, auto_renew, status, source)
  VALUES (user_a, 'Fake Provider A', 'ai', 'monthly', 10, 'USD', CURRENT_DATE + 30, true, 'active', 'manual')
  RETURNING id INTO sub_a_id;

  INSERT INTO public.subscriptions (user_id, provider_name, category, billing_cycle, amount, currency, expiry_date, auto_renew, status, source)
  VALUES (user_b, 'Fake Provider B', 'vpn', 'annual', 50, 'USD', CURRENT_DATE + 365, false, 'active', 'manual');

  -- Test Case 1: Simulate User A session
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Count rows User A can see (Must equal 1)
  SELECT COUNT(*) INTO count_b FROM public.subscriptions WHERE user_id = user_b;
  IF count_b > 0 THEN
    RAISE EXCEPTION 'RLS VIOLATION: User A was able to select User B subscription records!';
  END IF;

  RAISE NOTICE 'SUCCESS: RLS Isolation verified. User A cannot access User B data.';
END $$;

ROLLBACK;
