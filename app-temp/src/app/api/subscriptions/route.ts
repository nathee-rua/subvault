// ============================================
// SubVault - Subscriptions API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// GET /api/subscriptions - List all subscriptions
export async function GET() {
  // In production, this would query Supabase with RLS
  // For now, the app uses client-side Zustand store with localStorage
  return NextResponse.json({
    message: 'Subscriptions API - Connect Supabase to enable',
    status: 'demo_mode',
  });
}

// POST /api/subscriptions - Create a subscription
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // In production:
  // 1. Validate the request body
  // 2. Encrypt sensitive fields (account, password, notes)
  // 3. Insert into Supabase
  // 4. Return the created subscription
  
  return NextResponse.json({
    message: 'Subscription created (demo mode)',
    data: body,
    status: 'demo_mode',
  }, { status: 201 });
}
