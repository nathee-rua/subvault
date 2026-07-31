// ============================================
// SubVault - Subscriptions API Route (Full CRUD)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encrypt, decrypt } from '@/lib/encryption';

export const runtime = 'nodejs';

const keyHex = process.env.VAULT_ENCRYPTION_KEY;

// GET /api/subscriptions - List all subscriptions from Supabase
export async function GET(request: NextRequest) {
  try {
    const isCloudConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    
    if (!isCloudConfigured) {
      return NextResponse.json({
        message: 'Subscriptions API - Running in demo mode',
        status: 'demo_mode',
        subscriptions: [],
      });
    }

    const { data: rows, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Decrypt encrypted fields if key is available
    const subscriptions = await Promise.all((rows || []).map(async (row) => {
      let account = row.account_encrypted;
      let password = row.password_encrypted;
      let notes = row.notes_encrypted;
      let supportContact = row.support_contact_encrypted;

      if (keyHex) {
        if (account) { try { account = await decrypt(account, keyHex); } catch {} }
        if (password) { try { password = await decrypt(password, keyHex); } catch {} }
        if (notes) { try { notes = await decrypt(notes, keyHex); } catch {} }
        if (supportContact) { try { supportContact = await decrypt(supportContact, keyHex); } catch {} }
      }

      return {
        id: row.id,
        userId: row.user_id,
        providerId: row.provider_id,
        providerName: row.provider_name,
        customProviderName: row.custom_provider_name,
        category: row.category,
        planName: row.plan_name,
        billingCycle: row.billing_cycle,
        amount: Number(row.amount),
        currency: row.currency,
        startDate: row.start_date,
        expiryDate: row.expiry_date,
        autoRenew: row.auto_renew,
        status: row.status,
        account,
        password,
        notes,
        supportContact,
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
      };
    }));

    return NextResponse.json({
      status: 'success',
      subscriptions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/subscriptions - Create a new subscription in Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const isCloudConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    
    if (!isCloudConfigured) {
      return NextResponse.json({
        message: 'Subscription created (demo mode)',
        data: body,
        status: 'demo_mode',
      }, { status: 201 });
    }

    // Encrypt credential fields if keyHex is available
    let account_encrypted = body.account;
    let password_encrypted = body.password;
    let notes_encrypted = body.notes;
    let support_contact_encrypted = body.supportContact;

    if (keyHex) {
      if (body.account) account_encrypted = await encrypt(body.account, keyHex);
      if (body.password) password_encrypted = await encrypt(body.password, keyHex);
      if (body.notes) notes_encrypted = await encrypt(body.notes, keyHex);
      if (body.supportContact) support_contact_encrypted = await encrypt(body.supportContact, keyHex);
    }

    const newRow = {
      user_id: body.userId || '00000000-0000-0000-0000-000000000000',
      provider_name: body.providerName,
      custom_provider_name: body.customProviderName,
      category: body.category || 'other',
      plan_name: body.planName || 'API Key / Sub',
      billing_cycle: body.billingCycle || 'monthly',
      amount: body.amount || 0,
      currency: body.currency || 'THB',
      start_date: body.startDate || null,
      expiry_date: body.expiryDate,
      auto_renew: body.autoRenew ?? true,
      status: body.status || 'active',
      account_encrypted,
      password_encrypted,
      notes_encrypted,
      support_contact_encrypted,
      source: body.source || 'manual',
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(newRow)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      data,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/subscriptions - Update subscription in Supabase (including soft-delete)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const isCloudConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (!isCloudConfigured) {
      return NextResponse.json({ status: 'demo_mode', data: body });
    }

    const updateRow: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.providerName !== undefined) updateRow.provider_name = updates.providerName;
    if (updates.customProviderName !== undefined) updateRow.custom_provider_name = updates.customProviderName;
    if (updates.category !== undefined) updateRow.category = updates.category;
    if (updates.planName !== undefined) updateRow.plan_name = updates.planName;
    if (updates.billingCycle !== undefined) updateRow.billing_cycle = updates.billingCycle;
    if (updates.amount !== undefined) updateRow.amount = updates.amount;
    if (updates.currency !== undefined) updateRow.currency = updates.currency;
    if (updates.startDate !== undefined) updateRow.start_date = updates.startDate;
    if (updates.expiryDate !== undefined) updateRow.expiry_date = updates.expiryDate;
    if (updates.autoRenew !== undefined) updateRow.auto_renew = updates.autoRenew;
    if (updates.status !== undefined) updateRow.status = updates.status;
    if (updates.deletedAt !== undefined) updateRow.deleted_at = updates.deletedAt;

    // Encrypt sensitive credential fields if updated
    if (keyHex) {
      if (updates.account !== undefined) updateRow.account_encrypted = updates.account ? await encrypt(updates.account, keyHex) : null;
      if (updates.password !== undefined) updateRow.password_encrypted = updates.password ? await encrypt(updates.password, keyHex) : null;
      if (updates.notes !== undefined) updateRow.notes_encrypted = updates.notes ? await encrypt(updates.notes, keyHex) : null;
      if (updates.supportContact !== undefined) updateRow.support_contact_encrypted = updates.supportContact ? await encrypt(updates.supportContact, keyHex) : null;
    } else {
      if (updates.account !== undefined) updateRow.account_encrypted = updates.account;
      if (updates.password !== undefined) updateRow.password_encrypted = updates.password;
      if (updates.notes !== undefined) updateRow.notes_encrypted = updates.notes;
      if (updates.supportContact !== undefined) updateRow.support_contact_encrypted = updates.supportContact;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/subscriptions - Permanently delete subscription from Supabase
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const isCloudConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    
    if (!isCloudConfigured) {
      return NextResponse.json({ message: 'Deleted (demo mode)', status: 'demo_mode' });
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
