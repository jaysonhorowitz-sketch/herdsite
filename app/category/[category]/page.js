"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { useParams } from "next/navigation"

const supabase = createClient(
  "https://mwahckdqmiopkzrmdxyc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWhja2RxbWlvcGt6cm1keHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDgxMjgsImV4cCI6MjA4ODkyNDEyOH0.0Ua6sM8_zLzCdjJ8SGX-MVFkbbbyzDvrjtZuRoZVVxM"
)

// Slug → display name map (must match CAT_ORDER in page.js)
const SLUG_TO_CAT = {
  "executive-power":   "Executive Power",
  "rule-of-law":       "Rule of Law",
  "economy":           "Economy",
  "civil-rights":      "Civil Rights",
  "national-security": "National Security",
  "healthcare":        "Healthcare",
  "environment":       "Environment",
  "education-science": "Education & Science",
  "immigration":       "Immigration",
  "media-democracy":   "Media & Democracy",
}

function barColor(s) {
  if (s <= 3) return "#60a5fa"
  if (s <= 5) return "#facc15"
  if (s <= 7) return "#fb923c"
  if (s <= 9) return "#f87171"
  return "#ef4444"
}
function badgeBg(s) {
  if (s <= 3) return "rgba(96,165,250,0.09)"
  if (s <= 5) return "rgba(234,179,8,0.09)"
  if (s <= 7) return "rgba(249,115,22,0.09)"
  if (s <= 9) return "rgba(248,113,113,0.09)"
  return "rgba(239,68,68,0.11)"
}
function badgeText(s) {
  if (s <= 3) return "#93c5fd"
  if (s <= 5) return "#fde047"
  if (s <= 7) return "#fdba74"
  if (s <= 9) return "#fca5a5"
  return "#f87171"
}
function impactLabel(s) {
  if (s <= 3) return "Low Impact"
  if (s <= 5) return "Worth Watching"
  if (s <= 7) return "Notable"
  if (s <= 9) return "Major"
  return "Critical"
}
function effortStyle(e) {
  if (e === "2 min")  return { bg: "rgba(14,116,144,0.12)",  color: "#67e8f9", border: "rgba(103,232,249,0.15)" }
  if (e === "20 min") return { bg: "rgba(124,58,237,0.12)",  color: "#c4b5fd", border: "rgba(196,181,253,0.15)" }
  return                     { bg: "rgba(15,118,110,0.12)",  color: "#5eead4", border: "rgba(94,234,212,0.15)"  }
}

function relativeTime(iso) {
  if (!iso) return ""
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return "just now"
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function CategoryPage() {
  const { category: slug } = useParams()
  const catName = SLUG_TO_CAT[slug]

  const [issues,    setIssues]    = useState([])
  const [news,      setNews]      = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!catName) { setLoading(false); return }

    // Fetch issues for this category, sorted by severity desc
    supabase
      .from("issues")
      .select("*")
      .eq("category", catName)
      .eq("is_published", true)
      .order("severity_score", { ascending: false })
      .then(({ data }) => { if (data) setIssues(data); setLoading(false) })

    // Fetch news cache for this category
    supabase
      .from("news_cache")
      .select("articles")
      .eq("issue_slug", "category-" + slug)
      .single()
      .then(({ data }) => { if (data?.articles) setNews(data.articles.slice(0, 5)) })
  }, [slug, catName])

  // Unknown category
  if (!catName) return (
    <div style={{ background: "#111827", minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", color: "#4b5563" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#1f2937", marginBottom: 12 }}>404</div>
        <div style={{ fontSize: 16, color: "#374151", marginBottom: 24 }}>Category not found</div>
        <Link href="/" style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none" }}>← Back to home</Link>
      </div>
    </div>
  )

  const accentColor = "#3b82f6" // neutral blue for category pages

  return (
    <div style={{ background: "#111827", minHeight: "100vh", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(17,24,39,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>→ Politics & Governance</span>
            </Link>
            <span style={{ color: "#1f2937", fontSize: 14, marginLeft: 2 }}>/</span>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{catName}</span>
          </div>
          <Link href="/donate" style={{
            fontSize: 12, fontWeight: 600, color: "#cbd5e1",
            padding: "7px 16px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            textDecoration: "none",
          }}>Support the project</Link>
        </div>
      </nav>

      {/* Category header */}
      <div style={{
        background: "linear-gradient(160deg, #1a2236 0%, #111827 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "52px 32px 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Link href="/" style={{ fontSize: 12, color: "#374151", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, fontWeight: 500 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            All issues
          </Link>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#f1f5f9",
            letterSpacing: "-0.03em", margin: "0 0 10px", lineHeight: 1.1 }}>
            {catName}
          </h1>
          {!loading && (
            <p style={{ fontSize: 13, color: "#4b5563", margin: 0 }}>
              {issues.length} issue{issues.length !== 1 ? "s" : ""} tracked · sorted by impact
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 80px" }}>

        {/* Latest News */}
        {news.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#374151" }}>Latest News</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              {news.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    flexShrink: 0, width: 220,
                    background: "#1a2236", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10, padding: "14px 16px", textDecoration: "none",
                    display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "#1f2a42" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "#1a2236" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1", lineHeight: 1.45,
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {article.title}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                      {article.source}
                    </span>
                    <span style={{ fontSize: 11, color: "#1f2937", flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 11, color: "#374151", flexShrink: 0 }}>{relativeTime(article.publishedAt)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Issues */}
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "#374151", fontSize: 14 }}>Loading…</div>
        ) : issues.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "#374151", fontSize: 14 }}>
            No issues found in this category.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {issues.map(issue => (
              <Link href={"/issue/" + issue.slug} key={issue.id} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  style={{
                    background: "#1e2a3a", borderRadius: 12, padding: "20px 24px", cursor: "pointer",
                    transition: "background 0.15s, transform 0.15s",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderLeft: "3px solid " + barColor(issue.severity_score),
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#243347"; e.currentTarget.style.transform = "translateY(-1px)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#1e2a3a"; e.currentTarget.style.transform = "translateY(0)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                          color: badgeText(issue.severity_score), background: badgeBg(issue.severity_score),
                          padding: "3px 8px", borderRadius: 4,
                          border: `1px solid ${barColor(issue.severity_score)}22`,
                        }}>{issue.category}</span>
                        <span style={{ fontSize: 11, color: "#374151" }}>{issue.date}</span>
                      </div>
                      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 7px", color: "#e2e8f0",
                        lineHeight: 1.45, letterSpacing: "-0.01em" }}>{issue.title}</h2>
                      <p style={{ color: "#8899aa", fontSize: 13, lineHeight: 1.65, margin: "0 0 12px" }}>{issue.description}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {issue.actions?.map((a, i) => {
                          const s = effortStyle(a.effort)
                          return (
                            <span key={i} style={{
                              fontSize: 11, padding: "4px 10px", borderRadius: 5,
                              background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 500,
                            }}>{a.effort} — {a.text}</span>
                          )
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10,
                        background: badgeBg(issue.severity_score),
                        border: `1px solid ${barColor(issue.severity_score)}33`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, fontWeight: 800, color: badgeText(issue.severity_score),
                        letterSpacing: "-0.02em",
                      }}>{issue.severity_score}</div>
                      <div style={{ fontSize: 9, color: "#374151", marginTop: 5,
                        textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>
                        {issue.severity_label}
                      </div>
                    </div>
                  </div>
                  <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 2, marginTop: 14 }}>
                    <div style={{ width: issue.severity_score * 10 + "%", height: 2, borderRadius: 99,
                      background: barColor(issue.severity_score), opacity: 0.7 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#374151", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>How Bad Is It?</span>
          <p style={{ fontSize: 12, color: "#374151", margin: 0, maxWidth: 500, textAlign: "right", lineHeight: 1.7 }}>
            Impact ratings are editorial assessments based on institutional impact, scope, reversibility, and legal precedent. Not affiliated with any political party.
          </p>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
