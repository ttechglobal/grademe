import { NextResponse }   from 'next/server'
import { verifyPayment } from '@/lib/paymentService'
import crypto             from 'crypto'

// Paystack sends this to our server directly when a payment completes.
// This is the reliable path — browser redirects can fail if the user
// closes the tab, but the webhook always fires.
export async function POST(request) {
  try {
    const body      = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    const secret    = process.env.PAYSTACK_SECRET_KEY

    if (!secret) {
      console.error('[webhook] PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    // ── Verify Paystack signature ──────────────────────────────────────────
    const expectedHash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')

    if (expectedHash !== signature) {
      console.warn('[webhook] Invalid signature — request may not be from Paystack')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // ── Process the event ──────────────────────────────────────────────────
    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const reference = event.data?.reference
      if (reference) {
        // verifyPayment is idempotent — safe to call even if already processed
        const result = await verifyPayment(reference)
        if (!result.success) {
          console.error('[webhook] verifyPayment failed for reference:', reference, result.error)
        }
      }
    }

    // Always return 200 to Paystack — they retry on non-200 responses
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[/api/payments/webhook]', err.message)
    // Still return 200 — we don't want Paystack to keep retrying on parse errors
    return NextResponse.json({ received: true })
  }
}