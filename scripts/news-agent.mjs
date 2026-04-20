/**
 * How Bad Is It? — News Agent
 *
 * Fetches recent US policy news, asks Claude to evaluate and structure each
 * story as a tracker issue, deduplicates against existing issues, then
 * inserts genuinely new ones into Supabase.
 *
 * Requires env vars:
 *   ANTHROPIC_API_KEY      — claude API key
 *   NEWS_API_KEY           — newsapi.org key (free tier is fine)
 *   SUPABASE_URL           — your supabase project URL
 *   SUPABASE_SERVICE_KEY   — service-role key (not anon — needs write access)
 */

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase  = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80)
}

// ── Step 1: Fetch news ─────────────────────────────────────────────────────

async function fetchArticles() {
  const QUERIES = [
    "US federal government policy executive order",
    "Trump administration agency cut fired",
    "US tariff trade policy Congress",
    "US immigration deportation border policy",
    "US healthcare Medicare Medicaid federal",
    "US environment EPA climate federal ruling",
    "US Supreme Court federal court ruling",
    "US military NATO foreign policy",
    "US press freedom media government",
    "US federal budget spending cut",
  ]

  const from = daysAgo(7)
  const seen = new Set()
  const articles = []

  for (const q of QUERIES) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=10&from=${from}&apiKey=${process.env.NEWS_API_KEY}`
    const res  = await fetch(url)
    const data = await res.json()

    if (data.status !== "ok") {
      console.warn(`NewsAPI error for "${q}":`, data.message)
      continue
    }

    for (const a of (data.articles || [])) {
      if (!a.url || !a.title || !a.description) continue
      if (seen.has(a.url)) continue
      seen.add(a.url)
      articles.push(a)
    }
  }

  return articles
}

// ── Step 2: Load existing issues ───────────────────────────────────────────

async function getExisting() {
  const { data, error } = await supabase
    .from("issues")
    .select("title, slug, category, date, severity_score")
    .order("created_at", { ascending: false })

  if (error) throw new Error("Supabase read error: " + error.message)
  return data || []
}

// ── Step 3: Ask Claude to evaluate ────────────────────────────────────────

async function evaluateWithClaude(articles, existing, sessionIssues = []) {
  const existingList = [...existing, ...sessionIssues]
    .map(i => `- [${i.slug}] ${i.title} (${i.category}, ${i.date}, score ${i.severity_score})`)
    .join("\n")

  const articleList = articles
    .map((a, i) => [
      `### Article ${i}`,
      `Title: ${a.title}`,
      `Description: ${a.description}`,
      `Source: ${a.source?.name ?? "Unknown"}`,
      `URL: ${a.url}`,
      `Published: ${a.publishedAt?.slice(0, 10)}`,
    ].join("\n"))
    .join("\n\n")

  const prompt = `You are the editorial AI for "How Bad Is It?" — a nonpartisan U.S. policy severity tracker. Your job is to review recent news and extract SPECIFIC, GRANULAR policy actions worth tracking.

## RULES
- Tone must be neutral and factual — wire-service style, no opinion
- Each issue must be ONE specific action or event, not a broad theme
- Do NOT duplicate any existing issue (listed below)
- One issue per real-world event. If multiple articles cover the same underlying event from different angles, pick the most informative one and produce a single issue. Do not create two or three issues about the same event just because the articles frame it differently (e.g. "Trump signs X order", "White House moves on X", and "X policy takes effect" are all the same issue — pick one).
- Do NOT add opinion pieces, fundraising stories, or speculation
- Severity should be CONSERVATIVE: most routine policy actions are 2–5. Reserve 6–7 for clearly consequential actions. Reserve 8–10 for genuinely severe institutional threats with concrete, documented impact — not speculation about potential impact.
- Severity labels: "worth watching" (1–3), "notable impact" (4–6), "major impact" (7–8), "severe impact" (9–10)
- Categories (pick exactly one): Executive Power, Rule of Law, Economy, Civil Rights, Elections, National Security, Healthcare, Environment, Education, Science, Immigration, Democracy & Media, Foreign Policy, Human Rights
- Actions must be SPECIFIC and ACTIONABLE — real phone numbers, real organizations, real URLs when possible
- Date format: "Mon YYYY" e.g. "Mar 2025"

## CATEGORY DISAMBIGUATION
- Immigration enforcement, ICE, deportation, border, asylum, visa policy → Immigration (NOT Civil Rights or Human Rights)
- Voting access, election administration, redistricting, ballot rules → Elections (NOT Democracy & Media)
- Press freedom, journalist treatment, platform regulation → Democracy & Media (NOT Civil Rights)
- LGBTQ+ rights, racial discrimination, disability rights, religious liberty → Civil Rights
- International humanitarian issues, foreign atrocities, refugees abroad → Human Rights (NOT Civil Rights)
- US military, NATO, foreign treaties, sanctions, trade with adversaries → Foreign Policy (NOT National Security unless explicitly about domestic security threats)
- When in doubt between two categories, pick the one that best describes the PRIMARY action taken, not the population affected.

## HEADLINE STYLE
- Headlines must be readable as a sentence or a clear context-claim structure, not a run-on noun phrase.
- Avoid stacking nouns without connectors. "Iran War Strait of Hormuz Disruption Threatens Global Commerce" is bad — it reads as a search query, not a headline. Better: "Strait of Hormuz disruption from Iran war threatens global oil supply" OR "Iran war — Hormuz disruption hits 20% of global oil supply."
- When two distinct ideas need to be in the same headline (a context and a claim, or a topic and an event), separate them with an em dash (—) or a colon (:). Do not smash them together.
- Use sentence case, not Title Case. Capitalize only the first word and proper nouns.
- Write for a smart non-specialist, not an industry insider. Translate jargon and unfamiliar acronyms into plain English. 'CVE entries' → 'cybersecurity vulnerability records'. 'NDAA markup' → 'defense bill draft'. If a term is universally known (FBI, EPA, Medicare), keep it. If it requires industry context to parse, rewrite it.
- Never include filler connectors like "amid", "as", "following" if they make the headline harder to parse.
- Aim for under 70 characters, hard cap at 80.

## FACTUAL ACCURACY
- Only report what the source article actually states as fact. Do not convert speculation, predictions, warnings, or hypotheticals into reported events.
- If an article says "experts warn X could happen" or "concerns grow that Y may occur" — do NOT write a headline saying X or Y happened. Either skip the article or write a headline that accurately reflects that it is a warning or concern, not an event.
- If the article is an opinion piece, editorial, or commentary, skip it entirely.
- If you cannot write a headline that is literally supported by the article's reported facts (not its speculation), skip the article and return fewer issues. Returning [] is always acceptable.
- Do not combine information across articles to make a claim that no single article supports.
- Headlines must describe what happened, not what might happen or what people fear will happen.

## EXISTING ISSUES (do not duplicate)
${existingList}

## ARTICLES TO EVALUATE
${articleList}

## OUTPUT
Return ONLY a valid JSON array. No prose, no markdown fences, no explanation — just the raw JSON array.
If no articles warrant a new issue, return [].

Each element must match this exact shape:
{
  "title": "Sentence-case headline: clear subject + verb or context — claim structure, under 85 chars. No Title Case. No stacked noun phrases.",
  "slug": "url-safe-slug-max-60-chars",
  "category": "one of the categories above",
  "date": "Mon YYYY",
  "severity_score": integer 1–10,
  "severity_label": "worth watching | notable impact | major impact | severe impact",
  "description": "2–3 sentences, factual, no editorializing. Explain what happened, who it affects, and why it matters institutionally.",
  "actions": [
    {"effort": "2 min",  "text": "Specific short action", "url": "https://..."},
    {"effort": "20 min", "text": "Deeper action"},
    {"effort": "ongoing","text": "Sustained engagement"}
  ],
  "sources": [
    {"label": "Source name — article headline", "url": "https://..."}
  ],
  "is_published": true
}`

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: "[" },
    ],
  })

  const raw = "[" + msg.content[0].text.trim()

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error("⚠️  Claude returned invalid JSON. Raw output:")
    console.error(raw.slice(0, 500))

    // Fallback: extract first valid JSON array from the text
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return Array.isArray(parsed) ? parsed : []
      } catch (e2) {
        console.error("⚠️  Fallback extraction also failed.")
      }
    }
    return []
  }
}

// ── Step 4: Validate + deduplicate ────────────────────────────────────────

function validateIssue(issue) {
  const required = ["title", "slug", "category", "date", "severity_score", "severity_label", "description"]
  for (const field of required) {
    if (!issue[field]) return `missing field: ${field}`
  }
  if (issue.severity_score < 1 || issue.severity_score > 10) return "severity_score out of range"
  return null // valid
}

// ── Step 5: Mark stale tariff/superseded issues ────────────────────────────

async function consolidateTariffIssues(newIssues) {
  // If the agent added a newer tariff summary, unpublish older granular ones
  const newTariffIssues = newIssues.filter(i =>
    i.category === "Economy" && /tariff/i.test(i.title)
  )
  if (newTariffIssues.length === 0) return

  const { data: oldTariffs } = await supabase
    .from("issues")
    .select("id, title, slug, date")
    .eq("category", "Economy")
    .ilike("title", "%tariff%")
    .eq("is_published", true)

  if (!oldTariffs?.length) return

  // Only unpublish ones that are strictly older
  const newDates = newTariffIssues.map(i => parseDateScore(i.date))
  const maxNewDate = Math.max(...newDates)

  const toUnpublish = oldTariffs.filter(o => parseDateScore(o.date) < maxNewDate)
  if (!toUnpublish.length) return

  const ids = toUnpublish.map(i => i.id)
  await supabase.from("issues").update({ is_published: false }).in("id", ids)
  console.log(`📦  Unpublished ${ids.length} older tariff issues (superseded by newer entries)`)
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function parseDateScore(d) {
  if (!d) return 0
  const [mon, yr] = d.split(" ")
  return (parseInt(yr) || 0) * 12 + (MONTHS.indexOf(mon) || 0)
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("━━━ How Bad Is It? — News Agent ━━━")
  console.log(`Run started: ${new Date().toISOString()}\n`)

  // 1. Fetch news
  console.log("🔍 Fetching recent news (last 7 days)...")
  const articles = await fetchArticles()
  console.log(`   Found ${articles.length} unique articles\n`)

  if (articles.length === 0) {
    console.log("No articles found. Exiting.")
    return
  }

  // 2. Load existing issues
  console.log("📋 Loading existing issues from Supabase...")
  const existing = await getExisting()
  const existingSlugs = new Set(existing.map(i => i.slug))
  console.log(`   ${existing.length} existing issues loaded\n`)

  // 3. Evaluate with Claude (process in batches of 20 articles)
  const BATCH = 20
  const allNewIssues = []
  const sessionIssues = [] // issues accepted this run, fed to subsequent batches
  for (let i = 0; i < articles.length; i += BATCH) {
    const batch = articles.slice(i, i + BATCH)
    console.log(`🤖 Sending batch ${Math.floor(i / BATCH) + 1} of ${Math.ceil(articles.length / BATCH)} to Claude...`)
    const issues = await evaluateWithClaude(batch, existing, sessionIssues)
    console.log(`   Claude identified ${issues.length} potential new issues`)
    // Feed accepted issues into subsequent batches so Claude doesn't re-propose them
    for (const issue of issues) {
      sessionIssues.push({
        title: issue.title,
        slug: issue.slug || slugify(issue.title),
        category: issue.category,
        date: issue.date,
        severity_score: issue.severity_score,
      })
    }
    allNewIssues.push(...issues)
  }

  // 4. Validate and deduplicate
  const toInsert = []
  for (const issue of allNewIssues) {
    // Ensure unique slug
    if (!issue.slug) issue.slug = slugify(issue.title)
    if (existingSlugs.has(issue.slug)) {
      console.log(`   ⏭  Skipping duplicate slug: ${issue.slug}`)
      continue
    }

    const err = validateIssue(issue)
    if (err) {
      console.log(`   ⚠️  Skipping invalid issue "${issue.title}": ${err}`)
      continue
    }

    existingSlugs.add(issue.slug) // prevent intra-batch duplicates
    toInsert.push(issue)
  }

  console.log(`\n✅ ${toInsert.length} new issues ready to insert`)

  // 5. Insert
  if (toInsert.length > 0) {
    const { error } = await supabase.from("issues").insert(toInsert)
    if (error) throw new Error("Supabase insert error: " + error.message)

    console.log("\nInserted:")
    toInsert.forEach(i => console.log(`   [${i.severity_score}/10] ${i.title}`))

    // 6. Consolidate superseded issues (e.g. old tariff entries)
    await consolidateTariffIssues(toInsert)
  } else {
    console.log("   Nothing new to insert.")
  }

  console.log(`\nRun complete: ${new Date().toISOString()}`)
}

main().catch(e => {
  console.error("Fatal error:", e)
  process.exit(1)
})
