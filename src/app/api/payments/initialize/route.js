import { NextResponse }   from 'next/server'
import { verifyPayment } from '@/lib/paymentService'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://grademee.app'

// Paystack redirects the browser here after payment.
// This is a GET because Paystack sends query params.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    // Paystack sends both 'reference' and 'trxref' — check both
    const reference = searchParams.get('reference') || searchParams.get('trxref')

    if (!reference) {
      return NextResponse.redirect(`${APP_URL}/dashboard/credits?error=missing_reference`)
    }

    const result = await verifyPayment(reference)

    if (result.success) {
      return NextResponse.redirect(
        `${APP_URL}/dashboard/credits?success=true&credits=${result.credits}`
      )
    } else {
      return NextResponse.redirect(`${APP_URL}/dashboard/credits?error=payment_failed`)
    }
  } catch (err) {
    console.error('[/api/payments/verify]', err.message)
    return NextResponse.redirect(`${APP_URL}/dashboard/credits?error=server_error`)
  }
}