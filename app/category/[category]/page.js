"use client"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { useParams } from "next/navigation"

const supabase = createClient(
  "https://mwahckdqmiopkzrmdxyc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWhja2RxbWlvcGt6cm1keHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDgxMjgsImV4cCI6MjA4ODkyNDEyOH0.0Ua6sM8_zLzCdjJ8SGX-MVFkbbbyzDvrjtZuRoZVVxM"
)

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

const CAT_ORDER = [
  "Executive Power", "Rule of Law", "Economy", "Civil Rights",
  "National Security", "Healthcare", "Environment", "Education & Science",
  "Immigration", "Media & Democracy",
]

const CAT_EMOJI = {
  "Executive Power":    "⚡",
  "Rule of Law":        "⚖️",
  "Economy":            "📈",
  "Civil Rights":       "✊",
  "National Security":  "🛡️",
  "Healthcare":         "🏥",
  "Environment":        "🌍",
  "Education & Science":"🔬",
  "Immigration":        "🌐",
  "Media & Democracy":  "📰",
}

const VOLUNTEER_KEYWORDS = {
  "Environment":         "environment",
  "Civil Rights":        "civil-rights",
  "Economy":             "economic-justice",
  "National Security":   "veterans",
  "Healthcare":          "health",
  "Immigration":         "immigration",
  "Education & Science": "education",
  "Media & Democracy":   "democracy",
  "Executive Power":     "civic-engagement",
  "Rule of Law":         "justice",
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function parseDate(d) {
  if (!d) return 0
  const [mon, yr] = d.split(" ")
  return (parseInt(yr) || 0) * 12 + (MONTHS.indexOf(mon) ?? 0)
}

function severityTier(s) {
  if (s >= 9) return { label: "severe impact",  color: "#ef4444", bar: "rgba(220,38,38,0.6)"   }
  if (s >= 7) return { label: "major impact",   color: "#ea580c", bar: "rgba(234,88,12,0.6)"   }
  if (s >= 4) return { label: "notable impact", color: "#d97706", bar: "rgba(217,119,6,0.6)"   }
  return             { label: "worth watching", color: "#64748b", bar: "rgba(100,116,139,0.6)" }
}

function effortStyle(e) {
  if (e === "2 min")  return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" }
  if (e === "20 min") return { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" }
  return                     { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4" }
}

function catSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function IssueCard({ issue, weekCount }) {
  const tier = severityTier(issue.severity_score)
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={"/issue/" + issue.slug}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: "none", color: "inherit", display: "block",
        background: hovered ? "#f9fafb" : "#ffffff",
        borderRadius: 12, border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden", transition: "background 0.15s",
      }}
    >
      <div style={{ padding: "14px 16px 0" }}>
        {/* Category + date */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280" }}>{issue.category}</span>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>{issue.date}</span>
        </div>
        {/* Headline */}
        <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 5px", color: "#111827", lineHeight: 1.35, letterSpacing: "-0.01em" }}>{issue.title}</h2>
        {/* Description */}
        <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{issue.description}</p>
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 14px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tier.color, transform: "translateY(5px)", display: "inline-block" }}>{tier.label}</span>
          {weekCount > 0 && (
            <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#22c55e", fontSize: 7 }}>●</span>
              <strong style={{ color: "#6b7280", fontWeight: 600 }}>{weekCount}</strong>&nbsp;took action
            </span>
          )}
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "#ffffff",
          background: "#111827", border: "1px solid #111827",
          padding: "6px 14px", borderRadius: 7,
          whiteSpace: "nowrap",
        }}>Take Action →</span>
      </div>

      {/* Tier bar */}
      <div style={{ height: 2, background: tier.bar }} />
    </Link>
  )
}

export default function CategoryPage() {
  const { category: slug } = useParams()
  const catName = SLUG_TO_CAT[slug]

  const [issues,        setIssues]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [scrolled,      setScrolled]      = useState(false)
  const [expandedSlug,  setExpandedSlug]  = useState(null)
  const [actionCounts,  setActionCounts]  = useState({})
  const [completedKeys, setCompletedKeys] = useState(new Set())
  const [showRest,      setShowRest]      = useState(true)
  const [zipCode,       setZipCode]       = useState("")

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
      const keys = stored.map(item =>
        typeof item === "string" ? item : `${item.issueSlug}-${item.actionIndex ?? 0}`
      ).filter(Boolean)
      setCompletedKeys(new Set(keys))
    } catch {}
    try {
      const z = localStorage.getItem("userZipCode")
      if (z) setZipCode(z)
    } catch {}
  }, [])

  useEffect(() => {
    if (!catName) { setLoading(false); return }
    supabase
      .from("issues")
      .select("*")
      .eq("category", catName)
      .eq("is_published", true)
      .then(({ data }) => { if (data) setIssues(data); setLoading(false) })
  }, [catName])

  useEffect(() => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    supabase
      .from("action_clicks")
      .select("issue_slug")
      .gte("clicked_at", since)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        for (const row of data) counts[row.issue_slug] = (counts[row.issue_slug] || 0) + 1
        setActionCounts(counts)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const handleActionClick = useCallback((issueSlug, actionIndex) => {
    const key = `${issueSlug}-${actionIndex}`
    setCompletedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        try {
          const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
          localStorage.setItem("completedActions", JSON.stringify(stored.filter(k => k !== key)))
        } catch {}
      } else {
        next.add(key)
        try {
          const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
          if (!stored.includes(key)) { stored.push(key); localStorage.setItem("completedActions", JSON.stringify(stored)) }
        } catch {}
        supabase.from("action_clicks").insert({ issue_slug: issueSlug, action_index: actionIndex, clicked_at: new Date().toISOString() })
          .then(() => setActionCounts(prev => ({ ...prev, [issueSlug]: (prev[issueSlug] || 0) + 1 })))
          .catch(() => {})
      }
      return next
    })
  }, [])

  if (!catName) return (
    <div style={{ background: "#111827", minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#1f2937", marginBottom: 12 }}>404</div>
        <div style={{ fontSize: 16, color: "#374151", marginBottom: 24 }}>Category not found</div>
        <Link href="/" style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none" }}>← Back to home</Link>
      </div>
    </div>
  )

  // Sort: recent (last 30 days) first by impact, then older by impact
  const cutoff = parseDate(new Date(Date.now() - 30 * 24 * 3600 * 1000)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" }))
  const sorted = [...issues].sort((a, b) => {
    const aR = parseDate(a.date) >= cutoff
    const bR = parseDate(b.date) >= cutoff
    if (aR !== bR) return aR ? -1 : 1
    return b.severity_score - a.severity_score
  })

  const featured     = sorted[0]
  const smallA       = sorted[1]
  const smallB       = sorted[2]
  const expandIssues = sorted.slice(3)

  const communityCount = issues.reduce((acc, i) => acc + (actionCounts[i.slug] || 0), 0)
  const critCount      = issues.filter(i => i.severity_score >= 8).length
  const majorCount     = issues.filter(i => i.severity_score >= 6 && i.severity_score < 8).length

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── Dark section ── */}
      <div style={{ background: "#111827", color: "#e2e8f0" }}>

        {/* Nav */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          background: scrolled ? "rgba(17,24,39,0.95)" : "rgba(17,24,39,0)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
          transition: "all 0.3s ease",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60,
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>→ Politics & Governance</span>
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Link href="/profile" style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa", textDecoration: "none" }}>⚡ My Impact</Link>
              <Link href="/donate" style={{
                fontSize: 12, fontWeight: 600, color: "#cbd5e1",
                padding: "7px 16px", borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                textDecoration: "none",
              }}>Support the project</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #1a2236 0%, #111827 100%)" }}>
          {/* Grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
          {/* Glow */}
          <div style={{
            position: "absolute", top: -60, left: "25%",
            width: 600, height: 400,
            background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "40px 32px 20px" }}>
            <div style={{ fontSize: 11, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Link href="/" style={{ color: "#374151", textDecoration: "none", fontWeight: 500 }}>All Issues</Link>
              <span>→</span>
              <span style={{ color: "#6b7280" }}>{catName}</span>
            </div>

            <h1 style={{
              fontSize: "clamp(18px, 3.6vw, 60px)",
              fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em",
              margin: "0 0 8px", color: "#f1f5f9",
            }}>
              {CAT_EMOJI[catName]} {catName}
            </h1>
            {!loading && (
              <p style={{ fontSize: 14, color: "#4b5563", margin: "0 0 20px" }}>
                {issues.length} issue{issues.length !== 1 ? "s" : ""} tracked · sorted by impact
              </p>
            )}

            {/* Category tabs */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              <Link href="/" style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 99,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6b7280", fontSize: 13, fontWeight: 400,
                textDecoration: "none", whiteSpace: "nowrap",
              }}>🗂️ All</Link>
              {CAT_ORDER.map(c => {
                const isActive = c === catName
                return (
                  <Link key={c} href={`/category/${catSlug(c)}`} style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 99,
                    background: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                    border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    color: isActive ? "#f1f5f9" : "#6b7280",
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.15s",
                  }}>
                    <span>{CAT_EMOJI[c]}</span><span>{c}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Wave */}
          <svg viewBox="0 0 1440 36" fill="none" style={{ display: "block", width: "100%", marginBottom: -2 }}>
            <path d="M0 36 L0 18 Q360 0 720 18 Q1080 36 1440 18 L1440 36 Z" fill="#f4f5f7"/>
          </svg>
        </div>
      </div>

      {/* ── Light section ── */}
      <div style={{ background: "#f4f5f7" }}>

        {/* Stats bar */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "flex", alignItems: "center", height: 56 }}>
              {[
                { value: issues.length,  label: catName + " issues" },
                { value: critCount,      label: "Critical" },
                { value: majorCount,     label: "Major" },
                { value: communityCount, label: "Actions this week" },
              ].map((stat, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  paddingRight: 32, marginRight: 32,
                  borderRight: i < 3 ? "1px solid #e5e7eb" : "none",
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>{stat.value}</span>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{stat.label}</span>
                </div>
              ))}
              <div style={{ marginLeft: "auto" }}>
                <Link href="/" style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>← All issues</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: "#6b7280", fontSize: 14 }}>Loading…</div>
          ) : issues.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: "#6b7280", fontSize: 14 }}>
              No issues found in this category yet.
            </div>
          ) : (
            <>
              {/* Featured card */}
              {featured && (
                <IssueCard issue={featured} weekCount={actionCounts[featured.slug] || 0} />
              )}

              {/* Two small cards */}
              {(smallA || smallB) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  {smallA && <IssueCard issue={smallA} weekCount={actionCounts[smallA.slug] || 0} />}
                  {smallB && <IssueCard issue={smallB} weekCount={actionCounts[smallB.slug] || 0} />}
                </div>
              )}

              {/* Two-column: Top Action + Get Involved */}
              {featured && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1px 1fr",
                  marginTop: 16,
                  borderTop: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                }}>
                  {/* Left: Top Action */}
                  <div style={{ padding: "24px 32px 24px 0" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>🔥 Top Action</div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", lineHeight: 1.35, margin: "0 0 6px" }}>{featured.title}</h3>
                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {featured.description?.split(/\.(?:\s|$)/)[0]?.trim()}.
                    </p>
                    <a
                      href="https://5calls.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 8,
                        background: "#111827", color: "#ffffff",
                        fontSize: 12, fontWeight: 700, textDecoration: "none",
                      }}
                    >Take Action in 2 Minutes →</a>
                  </div>

                  {/* Divider */}
                  <div style={{ background: "#e5e7eb" }} />

                  {/* Right: Get Involved */}
                  <div style={{ padding: "24px 0 24px 32px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Get Involved</div>
                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
                      {zipCode
                        ? <>Volunteer near <strong style={{ color: "#111827" }}>{zipCode}</strong> in {catName}</>
                        : <>Volunteer opportunities in {catName}</>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {(() => {
                        const kw = VOLUNTEER_KEYWORDS[catName] || "civic-engagement"
                        const url = zipCode
                          ? `https://www.idealist.org/en/volunteer?q=${kw}&location=${encodeURIComponent(zipCode)}`
                          : `https://www.idealist.org/en/volunteer?q=${kw}`
                        return (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
                            background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb",
                            textDecoration: "none",
                          }}>{CAT_EMOJI[catName]} {catName} →</a>
                        )
                      })()}
                    </div>
                    {communityCount > 0 && (
                      <div style={{ fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#22c55e", fontSize: 8 }}>●</span>
                        <span><strong style={{ color: "#111827" }}>{communityCount.toLocaleString()}</strong> people took action in {catName} this week</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Expand arrow */}
              {expandIssues.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => setShowRest(o => !o)}
                    style={{
                      width: "100%", height: 48, background: "#eaecef", border: "none", borderRadius: 12,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                      style={{ transition: "transform 0.3s ease", transform: showRest ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showRest && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                      {expandIssues.map(issue => (
                        <IssueCard key={issue.id} issue={issue} weekCount={actionCounts[issue.slug] || 0} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>How Bad Is It?</span>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, maxWidth: 500, textAlign: "right", lineHeight: 1.7 }}>
              Impact ratings are editorial assessments based on institutional impact, scope, reversibility, and legal precedent. Not affiliated with any political party.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
