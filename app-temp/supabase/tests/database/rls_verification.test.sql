-- ============================================
-- SubVault RLS Security Policy pgTAP Tests
-- ============================================
-- Supabase CLI Test Suite: supabase test db

begin;
select plan(5);

-- Anonymous access check
set local role anon;
select is_empty(
  'select * from public.subscriptions',
  'Anonymous user cannot view any subscriptions'
);

-- User A session simulation
set local role authenticated;
set local "request.jwt.claims" = '{"sub": "11111111-1111-4111-a111-111111111111"}';

-- Insert fake subscription for User A
insert into public.subscriptions (id, user_id, provider_name, category, billing_cycle, amount, currency, expiry_date, auto_renew, status, source)
values (
  'a1111111-1111-4111-a111-111111111111',
  '11111111-1111-4111-a111-111111111111',
  'Fake Provider A',
  'ai',
  'monthly',
  10,
  'USD',
  '2026-12-31',
  true,
  'active',
  'manual'
);

-- User B session simulation
set local role authenticated;
set local "request.jwt.claims" = '{"sub": "22222222-2222-4222-b222-222222222222"}';

-- Test 1: User B cannot select User A's subscription
select is_empty(
  'select * from public.subscriptions where user_id = ''11111111-1111-4111-a111-111111111111''',
  'User B cannot select User A subscription rows'
);

-- Test 2: User B update on User A subscription affects 0 rows
update public.subscriptions set provider_name = 'Hacked' where id = 'a1111111-1111-4111-a111-111111111111';
select results_eq(
  'select provider_name from public.subscriptions where id = ''a1111111-1111-4111-a111-111111111111''',
  ARRAY[]::text[],
  'User B update on User A row is blocked by RLS'
);

-- Test 3: User B delete on User A subscription affects 0 rows
delete from public.subscriptions where id = 'a1111111-1111-4111-a111-111111111111';
select is_empty(
  'select * from public.subscriptions where id = ''a1111111-1111-4111-a111-111111111111''',
  'User B delete on User A row is blocked by RLS'
);

-- Test 4: User A verifies row remains unchanged
set local role authenticated;
set local "request.jwt.claims" = '{"sub": "11111111-1111-4111-a111-111111111111"}';

select results_eq(
  'select provider_name from public.subscriptions where id = ''a1111111-1111-4111-a111-111111111111''',
  ARRAY['Fake Provider A'],
  'User A subscription remains intact and unchanged'
);

select * from finish();
rollback;
