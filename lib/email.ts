// Email notifications via Resend (resend.com)
// No npm package needed — uses plain fetch
// If RESEND_API_KEY is not set, emails are silently skipped

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'Fairway for Good <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// NOTE: On Resend free plan without a verified domain,
// use 'onboarding@resend.dev' as FROM and emails only
// deliver to your own Resend account email.
// Once you verify a domain, change FROM to your domain email.

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email to:', to)
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('[Email] Send failed:', err)
    } else {
      console.log('[Email] Sent to:', to, '| Subject:', subject)
    }
  } catch (err) {
    console.error('[Email] Error:', err)
  }
}

// ── 1. Welcome email after signup / payment ──────────────────
export async function sendWelcomeEmail(
  to: string,
  name: string,
  plan: string
) {
  const planLabel =
    plan === 'free'    ? 'Free (Testing)'  :
    plan === 'weekly'  ? 'Weekly — ₹1'     :
    plan === 'monthly' ? 'Monthly — ₹999'  :
    plan === 'yearly'  ? 'Yearly — ₹8,999' : plan

  const subject = `Welcome to Fairway for Good, ${name}! 🏌️`
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#050908;color:#f0ede8;padding:40px;border-radius:16px;border:1px solid rgba(201,168,76,0.2)">
      <div style="text-align:center;margin-bottom:28px">
        <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#9b7c30);display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#050908">F</div>
      </div>
      <h1 style="font-family:Georgia,serif;font-size:30px;color:#c9a84c;text-align:center;margin:0 0 8px">Welcome, ${name}!</h1>
      <p style="color:#7a9088;text-align:center;margin:0 0 28px;font-size:15px">You're now part of Fairway for Good — Golf. Win. Give.</p>

      <div style="background:#132218;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="color:#7a9088;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px">Your Plan</p>
        <p style="color:#c9a84c;font-family:Georgia,serif;font-size:22px;margin:0">${planLabel}</p>
      </div>

      <p style="color:#7a9088;font-size:14px;margin-bottom:10px">Here's what to do next:</p>
      <ol style="color:#f0ede8;font-size:14px;padding-left:20px;line-height:2.2;margin:0 0 24px">
        <li>Add your last 5 Stableford scores in the dashboard</li>
        <li>Your scores become your monthly draw numbers</li>
        <li>Match 3, 4, or 5 numbers each month to win prizes</li>
        <li>10% of your subscription goes to your chosen charity</li>
      </ol>

      <div style="text-align:center">
        <a href="${APP_URL}/dashboard"
          style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#9b7c30);color:#050908;font-weight:600;padding:14px 36px;border-radius:999px;text-decoration:none;font-size:14px">
          Go to Dashboard →
        </a>
      </div>

      <p style="color:#3a5048;font-size:11px;text-align:center;margin-top:32px">
        Fairway for Good · Golf. Win. Give.<br>
        <a href="${APP_URL}" style="color:#3a5048">${APP_URL}</a>
      </p>
    </div>
  `
  await sendEmail(to, subject, html)
}

// ── 2. Winner notification email ─────────────────────────────
export async function sendWinnerEmail(
  to: string,
  name: string,
  tier: string,
  amount: number,
  drawDate: string
) {
  const subject = `🏆 You won ₹${amount.toLocaleString()} in the ${drawDate} draw!`
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#050908;color:#f0ede8;padding:40px;border-radius:16px;border:1px solid rgba(201,168,76,0.2)">
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:48px">🏆</div>
      </div>
      <h1 style="font-family:Georgia,serif;font-size:30px;color:#c9a84c;text-align:center;margin:0 0 8px">
        Congratulations, ${name}!
      </h1>
      <p style="color:#7a9088;text-align:center;margin:0 0 28px;font-size:15px">
        You matched a <strong style="color:#f0ede8">${tier}</strong> in the ${drawDate} draw
      </p>

      <div style="background:#132218;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
        <p style="color:#7a9088;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Your Prize</p>
        <p style="font-family:Georgia,serif;font-size:52px;color:#c9a84c;margin:0;line-height:1">
          ₹${amount.toLocaleString()}
        </p>
      </div>

      <p style="color:#7a9088;font-size:14px;text-align:center;margin-bottom:24px">
        Log in to your dashboard, go to the <strong style="color:#f0ede8">Winnings</strong> tab,
        and upload your score screenshot to claim your prize.
      </p>

      <div style="text-align:center">
        <a href="${APP_URL}/dashboard"
          style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#9b7c30);color:#050908;font-weight:600;padding:14px 36px;border-radius:999px;text-decoration:none;font-size:14px">
          Claim Your Prize →
        </a>
      </div>

      <p style="color:#3a5048;font-size:11px;text-align:center;margin-top:32px">
        Fairway for Good · Golf. Win. Give.
      </p>
    </div>
  `
  await sendEmail(to, subject, html)
}

// ── 3. Draw results email (sent to all subscribers after draw) ─
export async function sendDrawPublishedEmail(
  to: string,
  name: string,
  drawDate: string,
  winningNumbers: number[],
  userNumbers: number[],
  matchedCount: number
) {
  const hasWon = matchedCount >= 3
  const subject = hasWon
    ? `🎯 You matched ${matchedCount} numbers in the ${drawDate} draw!`
    : `📢 ${drawDate} draw results are in — check your numbers!`

  const numberDots = winningNumbers.map(n => `
    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#9b7c30);display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:17px;font-weight:700;color:#050908;margin:3px">
      ${n}
    </div>
  `).join('')

  const userDots = userNumbers.map(n => {
    const matched = winningNumbers.includes(n)
    return `
      <div style="width:38px;height:38px;border-radius:50%;background:${matched ? 'linear-gradient(135deg,#c9a84c,#9b7c30)' : '#0a1410'};border:1px solid ${matched ? 'transparent' : 'rgba(201,168,76,0.2)'};display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:15px;color:${matched ? '#050908' : '#7a9088'};margin:3px">
        ${n}
      </div>
    `
  }).join('')

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#050908;color:#f0ede8;padding:40px;border-radius:16px;border:1px solid rgba(201,168,76,0.2)">
      <h1 style="font-family:Georgia,serif;font-size:26px;color:#c9a84c;text-align:center;margin:0 0 6px">
        ${drawDate} Draw Results
      </h1>
      <p style="color:#7a9088;text-align:center;margin:0 0 28px;font-size:14px">Hi ${name}, here are this month's winning numbers</p>

      <div style="background:#132218;border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
        <p style="color:#7a9088;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px">Winning Numbers</p>
        <div>${numberDots}</div>
      </div>

      <div style="background:#0a1410;border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <p style="color:#7a9088;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px">Your Numbers</p>
        <div>${userDots}</div>
        ${matchedCount > 0
          ? `<p style="color:${hasWon ? '#4ade80' : '#c9a84c'};font-size:13px;margin:14px 0 0;font-weight:600">
              ${hasWon
                ? `✓ You matched ${matchedCount} number${matchedCount !== 1 ? 's' : ''} — check your winnings!`
                : `You matched ${matchedCount} number${matchedCount !== 1 ? 's' : ''} (need 3+ to win)`}
             </p>`
          : `<p style="color:#7a9088;font-size:13px;margin:14px 0 0">No matches this time — keep playing!</p>`
        }
      </div>

      <div style="text-align:center">
        <a href="${APP_URL}/dashboard"
          style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#9b7c30);color:#050908;font-weight:600;padding:14px 36px;border-radius:999px;text-decoration:none;font-size:14px">
          View Dashboard →
        </a>
      </div>

      <p style="color:#3a5048;font-size:11px;text-align:center;margin-top:32px">
        Fairway for Good · Golf. Win. Give.
      </p>
    </div>
  `
  await sendEmail(to, subject, html)
}