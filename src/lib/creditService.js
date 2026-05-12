/**
 * lib/creditService.js
 *
 * All credit operations. Every mutation goes through an atomic database
 * function (RPC) so concurrent requests cannot overdraw a balance.
 *
 * Server-side functions (validateCredits, deductCredits, addCredits) use
 * the service role client so they work correctly inside API routes where
 * there is no browser session. The service role bypasses RLS safely because
 * these functions are only ever called from authenticated server routes.
 *
 * Client-side functions (getUserCredits, getCreditHistory) use the anon
 * browser client with the user's session — RLS enforces row isolation.
 */

import { createClient } from '@/lib/supabase/client'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// ── Service role client — server-side only, bypasses RLS ──────────────────
function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service role credentials')
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── Credit costs per action ────────────────────────────────────────────────
export const CREDIT_COSTS = {
  MCQ_GENERATION_PER_QUESTION:        1,
  TRUE_FALSE_GENERATION_PER_QUESTION: 1,
  STEPWISE_GENERATION_PER_QUESTION:   3,   // future
  SCENARIO_GENERATION_PER_QUESTION:   5,   // future
}

export const CREDIT_PACKAGES = [
  {
    id:            'starter',
    credits:       100,
    amount_naira:  500,
    amount_usd:    0.50,
    label:         'Starter',
    popular:       false,
    description:   '100 AI-generated questions',
    per:           '₦5 per question',
    value_label:   null,
  },
  {
    id:            'standard',
    credits:       500,
    amount_naira:  2000,
    amount_usd:    2.00,
    label:         'Standard',
    popular:       true,
    description:   '500 AI-generated questions',
    per:           '₦4 per question',
    value_label:   'Save 20%',
  },
  {
    id:            'pro',
    credits:       1000,
    amount_naira:  3500,
    amount_usd:    3.50,
    label:         'Pro',
    popular:       false,
    description:   '1,000 AI-generated questions',
    per:           '₦3.50 per question',
    value_label:   'Best value',
  },
]

// ── Read operations ────────────────────────────────────────────────────────

/**
 * Get current credit balance for a tutor.
 * Returns 0 if no credits row exists yet.
 */
export async function getUserCredits(tutorId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credits')
    .select('balance')
    .eq('tutor_id', tutorId)
    .single()

  if (error || !data) return 0
  return data.balance
}

/**
 * Validate whether a tutor has enough credits.
 * Server-side only — uses service role to bypass RLS.
 */
export async function validateCredits(tutorId, requiredAmount) {
  const supabase = serverClient()
  const { data, error } = await supabase
    .from('credits')
    .select('balance')
    .eq('tutor_id', tutorId)
    .single()

  const balance = (error || !data) ? 0 : (data.balance ?? 0)
  return {
    valid:    balance >= requiredAmount,
    balance,
    required: requiredAmount,
  }
}

/**
 * Get full credits row — server-side, uses service role.
 */
export async function getCreditsRow(tutorId) {
  const supabase = serverClient()
  const { data } = await supabase
    .from('credits')
    .select('balance, total_earned, total_spent')
    .eq('tutor_id', tutorId)
    .single()
  return data ?? { balance: 0, total_earned: 0, total_spent: 0 }
}

/**
 * Get transaction history for a tutor.
 */
export async function getCreditHistory(tutorId, limit = 20) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data ?? [], error }
}

// ── Write operations (via atomic RPC) ─────────────────────────────────────
// These use SECURITY DEFINER database functions to prevent race conditions.
// See the SQL migration for the function definitions.

/**
 * Deduct credits — server-side only, uses service role client.
 * Only call AFTER successful generation.
 */
export async function deductCredits(tutorId, amount, description, action, referenceId = null) {
  const supabase = serverClient()
  const { data, error } = await supabase.rpc('deduct_credits_transaction', {
    p_tutor_id:    tutorId,
    p_amount:      amount,
    p_description: description,
    p_action:      action,
    p_reference_id: referenceId,
  })

  if (error || !data?.success) {
    return {
      success:    false,
      newBalance: 0,
      error:      error?.message ?? data?.error ?? 'Failed to deduct credits',
    }
  }
  return { success: true, newBalance: data.new_balance }
}

/**
 * Add credits — server-side only, uses service role client.
 * Called after successful payment verification.
 */
export async function addCredits(tutorId, amount, description, referenceId = null) {
  const supabase = serverClient()
  const { data, error } = await supabase.rpc('add_credits_transaction', {
    p_tutor_id:    tutorId,
    p_amount:      amount,
    p_description: description,
    p_action:      'purchase',
    p_reference_id: referenceId,
  })

  if (error || !data?.success) {
    return {
      success:    false,
      newBalance: 0,
      error:      error?.message ?? data?.error ?? 'Failed to add credits',
    }
  }
  return { success: true, newBalance: data.new_balance }
}