// POST /api/refresh-news
// Fetches top 5 headlines per category from NewsAPI and upserts into news_cache.
// Requires: NEWS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY env vars.
// Protect with a simple bearer token (REFRESH_SECRET) so only you can trigger it.

import { createClient } from "@supabase/supabase-js"

const CATEGORY_QUERIES = {
  "Executive Power":    "US executive branch presidential power executive orders",
  "Rule of Law":        "US courts justice corruption rule of law",
  "Economy":            "US economy trade tariffs fiscal policy",
  "Civil Rights":       "US civil rights voting discrimination",
  "National Security":  "US military foreign policy national security",
  "Healthcare":         "US healthcare public health Medicare",
  "Environment":        "US environment climate EPA energy",
  "Education & Science":"US education science research funding",
  "Immigration":        "US immigration border deportation asylum",
  "Media & Democracy":  "US press freedom elections democracy disinformation",
}

// Deterministic cache key from category name
function categoryKey(cat) {
  return "category-" + cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export async function POST(request) {
  // Simple auth gate
  const auth = request.headers.get("authorization") || ""
  const secret = process.env.REFRESH_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const newsKey = process.env.NEWS_API_KEY
  if (!newsKey) return Response.json({ error: "NEWS_API_KEY not set" }, { status: 500 })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const results = {}

  for (const [category, query] of Object.entries(CATEGORY_QUERIES)) {
    const key = categoryKey(category)
    try {
      const url = new URL("https://newsapi.org/v2/everything")
      url.searchParams.set("q",          query)
      url.searchParams.set("language",   "en")
      url.searchParams.set("sortBy",     "publishedAt")
      url.searchParams.set("pageSize",   "5")
      url.searchParams.set("apiKey",     newsKey)

      const res  = await fetch(url.toString())
      const data = await res.json()

      if (data.status !== "ok") {
        results[key] = { ok: false, error: data.message }
        continue
      }

      const articles = (data.articles || []).slice(0, 5).map(a => ({
        title:       a.title,
        url:         a.url,
        source:      a.source?.name || "Unknown",
        publishedAt: a.publishedAt,
      }))

      const { error } = await supabase
        .from("news_cache")
        .upsert(
          { issue_slug: key, articles, updated_at: new Date().toISOString() },
          { onConflict: "issue_slug" }
        )

      results[key] = error ? { ok: false, error: error.message } : { ok: true, count: articles.length }
    } catch (err) {
      results[key] = { ok: false, error: err.message }
    }
  }

  const failed  = Object.values(results).filter(r => !r.ok).length
  const success = Object.values(results).filter(r => r.ok).length
  return Response.json({ success, failed, results })
}

// Allow GET for quick manual testing from the browser (same auth required)
export async function GET(request) {
  return POST(request)
}
