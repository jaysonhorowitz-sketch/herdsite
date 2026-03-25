// POST /api/daily-digest
// Body: { email: string, categories: string[] }
// Fetches the top 3 highest-impact issues from the user's chosen categories today,
// then sends a personalized HTML email via Resend.
//
// Required env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
// Optional: DIGEST_FROM_EMAIL (defaults to digest@howbadisite.com)
//           DAILY_UPDATE_SECRET — if set, GET requests (cron) must include Authorization: Bearer <secret>

import { createClient } from "@supabase/supabase-js"

const IMPACT_COLOR = {
  NOTABLE:     "#22c55e",
  SIGNIFICANT: "#eab308",
  MAJOR:       "#f97316",
  CRITICAL:    "#ef4444",
}

function impactLabel(score) {
  if (score <= 3) return "NOTABLE"
  if (score <= 6) return "SIGNIFICANT"
  if (score <= 8) return "MAJOR"
  return "CRITICAL"
}

function buildEmail({ issues, categories }) {
  const issueBlocks = issues.map(issue => {
    const label  = issue.severity_label || impactLabel(issue.severity_score)
    const color  = IMPACT_COLOR[label] || "#60a5fa"
    const actions = (issue.actions || []).slice(0, 3)

    const actionRows = actions.map(a => `
      <tr>
        <td style="padding: 6px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="width: 60px; vertical-align: top; padding-right: 10px;">
                <span style="display:inline-block; background: rgba(255,255,255,0.06); color: #9ca3af;
                  font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
                  padding: 3px 7px; border-radius: 4px; white-space: nowrap;">${a.effort}</span>
              </td>
              <td style="color: #9ca3af; font-size: 13px; line-height: 1.5;">${a.text}</td>
            </tr>
          </table>
        </td>
      </tr>`).join("")

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background: #1a2236; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; margin-bottom: 16px; overflow: hidden;">
        <tr>
          <td style="padding: 22px 24px;">
            <!-- Category + score -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
              <tr>
                <td>
                  <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
                    text-transform: uppercase; color: ${color};
                    background: ${color}18; padding: 3px 9px; border-radius: 4px;
                    border: 1px solid ${color}30;">${issue.category}</span>
                </td>
                <td align="right">
                  <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
                    text-transform: uppercase; color: ${color};
                    background: ${color}15; padding: 4px 12px; border-radius: 99px;
                    border: 1px solid ${color}30;">${label} · ${issue.severity_score}/10</span>
                </td>
              </tr>
            </table>
            <!-- Title -->
            <h2 style="margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #f1f5f9;
              letter-spacing: -0.02em; line-height: 1.3;">${issue.title}</h2>
            <!-- Description -->
            <p style="margin: 0 0 18px; font-size: 14px; color: #6b7280; line-height: 1.7;">${issue.description || ""}</p>
            <!-- Actions -->
            ${actions.length > 0 ? `
            <p style="margin: 0 0 8px; font-size: 10px; font-weight: 700; color: #374151;
              text-transform: uppercase; letter-spacing: 0.1em;">What You Can Do</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${actionRows}
            </table>` : ""}
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
              <tr>
                <td>
                  <a href="https://howbadisite.vercel.app/issue/${issue.slug}"
                    style="display: inline-block; background: #3b82f6; color: #ffffff;
                      font-size: 12px; font-weight: 700; text-decoration: none;
                      padding: 8px 18px; border-radius: 6px; letter-spacing: 0.02em;">
                    Read more →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
  }).join("")

  const categoryPills = categories.map(c =>
    `<span style="display:inline-block; background: rgba(59,130,246,0.12); color: #93c5fd;
      font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 99px;
      border: 1px solid rgba(59,130,246,0.2); margin: 3px 4px 3px 0;">${c}</span>`
  ).join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Digest — How Bad Is It?</title>
</head>
<body style="margin: 0; padding: 0; background: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%"
    style="background: #111827; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600"
          style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 28px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
                      text-transform: uppercase; color: #374151;">How Bad Is It?</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; color: #374151;">Daily Digest</span>
                  </td>
                </tr>
              </table>
              <div style="height: 1px; background: rgba(255,255,255,0.07); margin-top: 14px;"></div>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding-bottom: 24px;">
              <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 900; color: #f1f5f9;
                letter-spacing: -0.03em; line-height: 1.1;">
                Today's top stories in your feed
              </h1>
              <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                The ${issues.length} highest-impact issue${issues.length !== 1 ? "s" : ""} from your chosen categories today.
              </p>
              <div>${categoryPills}</div>
            </td>
          </tr>

          <!-- Issues -->
          <tr>
            <td>${issueBlocks}</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px;">
              <div style="height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 20px;"></div>
              <p style="margin: 0; font-size: 11px; color: #1f2937; line-height: 1.6;">
                You're receiving this because you signed up for daily digests.<br>
                Not affiliated with any political party or organization.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function handler(request) {
  // Auth gate for GET (cron calls)
  if (request.method === "GET") {
    const secret = process.env.DAILY_UPDATE_SECRET
    if (secret) {
      const auth = request.headers.get("authorization") || ""
      if (auth !== `Bearer ${secret}`) {
        return Response.json({ error: "unauthorized" }, { status: 401 })
      }
    }
    return Response.json({ message: "Daily digest cron — send POST with {email, categories} to trigger." })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { email, categories } = body || {}
  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 })
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    return Response.json({ error: "categories must be a non-empty array" }, { status: 400 })
  }

  const resendKey   = process.env.RESEND_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  const missing = ["RESEND_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"].filter(k => !process.env[k])
  if (missing.length) {
    return Response.json({ error: "Missing env vars: " + missing.join(", ") }, { status: 500 })
  }

  // ── 1. Fetch top 3 issues from chosen categories ───────────────────────────
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: issues, error: dbErr } = await supabase
    .from("issues")
    .select("slug, title, category, severity_score, severity_label, description, actions")
    .in("category", categories)
    .eq("is_published", true)
    .order("severity_score", { ascending: false })
    .limit(3)

  if (dbErr) {
    return Response.json({ error: "DB error: " + dbErr.message }, { status: 500 })
  }

  if (!issues || issues.length === 0) {
    return Response.json({ message: "No issues found for given categories", categories })
  }

  // ── 2. Build and send email ────────────────────────────────────────────────
  const html = buildEmail({ issues, categories })
  const from = process.env.DIGEST_FROM_EMAIL || "digest@howbadisite.com"

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from,
      to:      [email],
      subject: `Today's top stories — How Bad Is It?`,
      html,
    }),
  })

  if (!resendRes.ok) {
    const errBody = await resendRes.text()
    return Response.json({ error: "Resend failed: " + errBody }, { status: 502 })
  }

  const resendData = await resendRes.json()
  return Response.json({
    message: `Digest sent to ${email}`,
    issues:  issues.map(i => ({ title: i.title, score: i.severity_score })),
    resend:  resendData,
  })
}

export async function POST(request) { return handler(request) }
export async function GET(request)  { return handler(request) }
