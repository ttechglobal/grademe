/**
 * lib/paymentService.js
 *
 * Server-side only — never import from client components.
 * Handles Paystack payment initialization and verification.
 *
 * Uses service-role Supabase so RLS doesn't block payment inserts/updates.
 */

import { createClient as createAdmin } from '@supabase/supabase-js'
import { CREDIT_PACKAGES } from '@/lib/creditService'

// Service role client — bypasses RLS for payment operations
function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const PAYSTACK_SECRET = () => {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY not configured')
  return key
}

// ── Initialize a payment — returns Paystack checkout URL ─────────────────

/**
 * @returns {{ success: boolean, authorizationUrl?: string, reference?: string, error?: string }}
 */
export async function initializePayment(tutorId, tutorEmail, packageId) {
  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!creditPackage) {
    return { success: false, error: 'Invalid credit package selected.' }
  }

  const reference  = `gm_${tutorId.replace(/-/g, '').slice(0, 8)}_${Date.now()}`
  const amountKobo = creditPackage.amount_naira * 100  // Paystack uses smallest unit

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${PAYSTACK_SECRET()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:        tutorEmail,
        amount:       amountKobo,
        reference,
        metadata: {
          tutor_id:   tutorId,
          package_id: packageId,
          credits:    creditPackage.credits,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return { success: false, error: data.message ?? 'Payment initialization failed.' }
    }

    // Store pending payment record
    const db = adminDb()
    await db.from('payments').insert({
      tutor_id:           tutorId,
      paystack_reference: reference,
      amount_kobo:        amountKobo,
      credits_purchased:  creditPackage.credits,
      status:             'pending',
    })

    return {
      success:           true,
      authorizationUrl:  data.data.authorization_url,
      reference,
    }
  } catch (err) {
    console.error('[payment] initializePayment error:', err.message)
    return { success: false, error: 'Payment service unavailable. Please try again.' }
  }
}

// ── Verify a payment — called from callback URL and webhook ───────────────

/**
 * Idempotent — safe to call multiple times for the same reference.
 * @returns {{ success: boolean, credits?: number, tutorId?: string, error?: string }}
 */
export async function verifyPayment(reference) {
  const db = adminDb()

  try {
    // 1. Find the payment record
    const { data: payment, error: paymentErr } = await db
      .from('payments')
      .select('*')
      .eq('paystack_reference', reference)
      .single()

    if (paymentErr || !payment) {
      return { success: false, error: 'Payment record not found.' }
    }

    // 2. Idempotency — already processed
    if (payment.status === 'success') {
      return { success: true, credits: payment.credits_purchased, tutorId: payment.tutor_id }
    }

    // 3. Verify with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` } }
    )

    const data = await response.json()

    if (!data.status || data.data?.status !== 'success') {
      await db
        .from('payments')
        .update({ status: 'failed', paystack_response: data })
        .eq('paystack_reference', reference)

      return { success: false, error: 'Payment was not successful.' }
    }

    // 4. Add credits via atomic RPC
    const { error: rpcErr } = await db.rpc('add_credits_transaction', {
      p_tutor_id:     payment.tutor_id,
      p_amount:       payment.credits_purchased,
      p_description:  `Purchased ${payment.credits_purchased} credits`,
      p_action:       'purchase',
      p_reference_id: reference,
    })

    if (rpcErr) {
      // CRITICAL — payment succeeded but credits not added
      // Update payment record as success anyway — manual review via admin
      console.error('[payment] CRITICAL: credits RPC failed after verified payment', {
        reference,
        tutorId:  payment.tutor_id,
        credits:  payment.credits_purchased,
        error:    rpcErr.message,
      })
    }

    // 5. Mark payment as success
    await db
      .from('payments')
      .update({
        status:            'success',
        paystack_response: data.data,
        verified_at:       new Date().toISOString(),
      })
      .eq('paystack_reference', reference)

    return {
      success:  true,
      credits:  payment.credits_purchased,
      tutorId:  payment.tutor_id,
    }
  } catch (err) {
    console.error('[payment] verifyPayment error:', err.message)
    return { success: false, error: 'Payment verification failed. Please contact support.' }
  }
}