import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { name, email } = await request.json()
    if (!name || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const firstName = name.split(' ')[0]
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL || 'https://grademee.vercel.app'

    // HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to GradeMee</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e5e0; }
    .header { background: #1a1a2e; padding: 32px 40px; }
    .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .logo span { color: #f5a623; }
    .body { padding: 40px; }
    h1 { font-size: 26px; font-weight: 800; color: #1a1a2e; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #6b7280; margin: 0 0 16px; }
    .cta { display: inline-block; background: #1a1a2e; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 14px; margin: 8px 0 24px; }
    .detail-box { background: #f5f5f0; border-radius: 14px; padding: 16px 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .detail-label { color: #9ca3af; }
    .detail-value { color: #1a1a2e; font-weight: 600; }
    .footer { padding: 20px 40px; border-top: 1px solid #e5e5e0; text-align: center; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Grade<span>Mee</span></div>
    </div>
    <div class="body">
      <h1>Welcome, ${firstName}! 👋</h1>
      <p>You're all set. GradeMee is ready to help you create assessments faster, grade automatically, and understand how your students are doing — all in one place.</p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Name</span>
          <span class="detail-value">${name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${email}</span>
        </div>
      </div>

      <p>Your first assessment is one click away. Set up a quiz, test, or assignment in under 5 minutes.</p>

      <a href="${appUrl}/dashboard/assessments/new" class="cta">
        Create your first assessment →
      </a>

      <p style="font-size: 13px; color: #9ca3af;">If you have any questions or run into anything, just reply to this email. We read everything.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} GradeMee · Smart assessments for every teacher</p>
    </div>
  </div>
</body>
</html>`

    // Use Resend if configured, otherwise log
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from:    'GradeMee <hello@grademee.app>',
          to:      [email],
          subject: `Welcome to GradeMee, ${firstName}! 🎉`,
          html,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('Resend error:', err)
      }
    } else {
      console.log('Welcome email would send to:', email, '(RESEND_API_KEY not configured)')
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-welcome error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}