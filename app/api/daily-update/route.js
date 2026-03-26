// POST /api/daily-update  (also accepts GET for manual testing)
// 1. Fetches top 30 political headlines from mainstream outlets via NewsAPI
// 2. Sends to Claude to generate exactly 10 structured issues
// 3. Inserts new issues into Supabase (skips slugs that already exist)
// 4. Returns a summary of what was added
//
// Required env vars:
//   NEWS_API_KEY, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
// Optional:
//   DAILY_UPDATE_SECRET  — if set, requests must include Authorization: Bearer <secret>

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const DOMAINS = [
  "nytimes.com", "washingtonpost.com", "wsj.com", "politico.com",
  "thehill.com", "reuters.com", "apnews.com", "npr.org",
  "axios.com", "bbc.co.uk", "bloomberg.com", "foreignpolicy.com",
  "defenseone.com", "rollcall.com", "cq.com",
].join(",")

const CATEGORIES = [
  "Executive Power", "Rule of Law", "Economy", "Civil Rights",
  "National Security", "Healthcare", "Environment", "Education & Science",
  "Immigration", "Media & Democracy",
]

const CLAUDE_PROMPT = `You are a nonpartisan policy editor producing a civic tracker. Given these news headlines, identify exactly 10 significant policy stories happening today.

Rules:
- Generate EXACTLY 10 issues, no more, no fewer
- TITLE: Describe the policy event or situation, not the political actor. Write as a news headline about what is happening — not about who caused it. Bad: "Trump administration faces military defeat in Iran". Good: "U.S. Military Struggles in Iran Conflict". Bad: "Biden signs executive order on climate". Good: "New Executive Order Expands Climate Regulations". Focus on the ISSUE, not the person or party.
- DESCRIPTION: 2-3 sentences. State the facts of what is happening and why it matters institutionally. Do not assign blame, use partisan language, or characterize motivations. Describe impacts on people and institutions, not on political figures. No loaded words like "controversial", "radical", "dangerous", "assault on", "threat to".
- impact_score: 1-3 = routine (NOTABLE), 4-6 = notable policy shift (SIGNIFICANT), 7-8 = major institutional impact (MAJOR), 9-10 = constitutional/crisis level (CRITICAL) — use the full range
- impact_label must be exactly one of: "NOTABLE", "SIGNIFICANT", "MAJOR", "CRITICAL"
- category must be exactly one of: ${CATEGORIES.join(", ")}
- slug: lowercase, hyphens only, topic-focused not actor-focused (e.g. "senate-budget-vote-mar-2026" not "trump-budget-cut-mar-2026")
- actions: exactly 3 per issue, each with effort ("2 min", "20 min", or "ongoing") and a concrete civic action any citizen can take regardless of political affiliation
- sources: array of {label, url} from the articles that informed this issue
- date: current month and year like "Mar 2026"

Return ONLY a valid JSON array of exactly 10 issue objects. No markdown, no explanation, no other text.

Example shape (do not copy values, only structure):
[
  {
    "title": "Congress Considers Short-Term Spending Bill to Avoid Shutdown",
    "slug": "congress-spending-bill-mar-2026",
    "category": "Economy",
    "impact_score": 6,
    "impact_label": "SIGNIFICANT",
    "description": "Congress is debating a continuing resolution to fund the government through the end of the fiscal year after appropriations talks stalled. Without passage, federal agencies would face a partial shutdown affecting services relied on by millions of Americans.",
    "actions": [
      { "effort": "2 min", "text": "Call your representative to express your position on government funding" },
      { "effort": "20 min", "text": "Read the bill summary on congress.gov" },
      { "effort": "ongoing", "text": "Track appropriations committee hearings for updates" }
    ],
    "date": "Mar 2026",
    "sources": [
      { "label": "Reuters", "url": "https://reuters.com/..." }
    ]
  }
]`

async function handler(request) {
  // Auth gate
  const secret = process.env.DAILY_UPDATE_SECRET
  if (secret) {
    const auth = request.headers.get("authorization") || ""
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const newsKey       = process.env.NEWS_API_KEY
  const anthropicKey  = process.env.ANTHROPIC_API_KEY
  const supabaseUrl   = process.env.SUPABASE_URL
  const supabaseKey   = process.env.SUPABASE_SERVICE_KEY

  const missing = ["NEWS_API_KEY", "ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
    .filter(k => !process.env[k])
  if (missing.length) {
    return Response.json({ error: "Missing env vars: " + missing.join(", ") }, { status: 500 })
  }

  // ── 1. Fetch headlines ──────────────────────────────────────────────────────
  let articles
  try {
    const newsUrl = new URL("https://newsapi.org/v2/everything")
    newsUrl.searchParams.set("domains",   DOMAINS)
    newsUrl.searchParams.set("language",  "en")
    newsUrl.searchParams.set("sortBy",    "publishedAt")
    newsUrl.searchParams.set("pageSize",  "30")
    newsUrl.searchParams.set("q",         "politics policy government congress white house")
    newsUrl.searchParams.set("apiKey",    newsKey)

    const res  = await fetch(newsUrl.toString())
    const data = await res.json()
    if (data.status !== "ok") throw new Error(data.message || "NewsAPI error")
    articles = data.articles || []
  } catch (err) {
    return Response.json({ error: "NewsAPI fetch failed: " + err.message }, { status: 502 })
  }

  if (!articles.length) {
    return Response.json({ error: "No articles returned from NewsAPI" }, { status: 502 })
  }

  // ── 2. Build article summary for Claude ────────────────────────────────────
  const articleList = articles.map((a, i) =>
    `[${i + 1}] ${a.title}\nSource: ${a.source?.name || "Unknown"} — ${a.url}\n${a.description || ""}`
  ).join("\n\n")

  const userMessage = `Today's date: ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}\n\nHere are today's top political headlines:\n\n${articleList}`

  // ── 3. Ask Claude to generate issues ───────────────────────────────────────
  let rawJson
  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })
    const message   = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        { role: "user", content: CLAUDE_PROMPT + "\n\n" + userMessage }
      ],
    })
    rawJson = message.content[0]?.text?.trim() || ""
  } catch (err) {
    return Response.json({ error: "Claude API failed: " + err.message }, { status: 502 })
  }

  // ── 4. Parse and validate ──────────────────────────────────────────────────
  let issues
  try {
    // Strip markdown code fences if Claude wrapped the JSON
    const cleaned = rawJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
    issues = JSON.parse(cleaned)
    if (!Array.isArray(issues)) throw new Error("Expected a JSON array")
  } catch (err) {
    return Response.json({
      error:   "Failed to parse Claude response as JSON: " + err.message,
      raw:     rawJson.slice(0, 500),
    }, { status: 502 })
  }

  // Basic field validation — drop malformed entries
  const valid = issues.filter(issue =>
    issue.title && issue.slug && issue.category &&
    (issue.impact_score || issue.severity_score) &&
    CATEGORIES.includes(issue.category)
  )

  if (!valid.length) {
    return Response.json({ error: "No valid issues in Claude response", raw: rawJson.slice(0, 500) }, { status: 502 })
  }

  // ── 5. Deduplicate against existing slugs ─────────────────────────────────
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: existing } = await supabase
    .from("issues")
    .select("slug")
    .in("slug", valid.map(i => i.slug))

  const existingSlugs = new Set((existing || []).map(r => r.slug))
  const toInsert = valid.filter(i => !existingSlugs.has(i.slug))

  if (!toInsert.length) {
    return Response.json({ message: "All generated issues already exist", skipped: valid.length })
  }

  // ── 6. Insert into Supabase ────────────────────────────────────────────────
  const rows = toInsert.map(issue => ({
    title:          issue.title,
    slug:           issue.slug,
    category:       issue.category,
    severity_score: Number(issue.impact_score || issue.severity_score),
    severity_label: issue.impact_label || issue.severity_label || impactLabel(issue.impact_score || issue.severity_score),
    description:    issue.description || "",
    actions:        Array.isArray(issue.actions) ? issue.actions : [],
    sources:        Array.isArray(issue.sources) ? issue.sources : [],
    date:           issue.date || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    is_published:   true,
  }))

  const { data: inserted, error: insertErr } = await supabase
    .from("issues")
    .insert(rows)
    .select("id, title, slug, severity_score")

  if (insertErr) {
    return Response.json({ error: "Supabase insert failed: " + insertErr.message }, { status: 500 })
  }

  return Response.json({
    message:  `Added ${inserted?.length || 0} new issue(s)`,
    added:    inserted,
    skipped:  existingSlugs.size,
  })
}

function impactLabel(score) {
  const n = Number(score)
  if (n <= 3) return "NOTABLE"
  if (n <= 6) return "SIGNIFICANT"
  if (n <= 8) return "MAJOR"
  return "CRITICAL"
}

export async function POST(request) { return handler(request) }
export async function GET(request)  { return handler(request) }
