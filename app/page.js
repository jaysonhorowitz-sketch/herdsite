"use client"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

const supabase = createClient("https://mwahckdqmiopkzrmdxyc.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWhja2RxbWlvcGt6cm1keHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDgxMjgsImV4cCI6MjA4ODkyNDEyOH0.0Ua6sM8_zLzCdjJ8SGX-MVFkbbbyzDvrjtZuRoZVVxM")

function cardColor(s) {
  if (s <= 4) return { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" }
  if (s <= 6) return { border: "#f59e0b", bg: "#fffbeb", text: "#92400e" }
  if (s <= 8) return { border: "#f97316", bg: "#fff7ed", text: "#9a3412" }
  return              { border: "#ef4444", bg: "#fef2f2", text: "#991b1b" }
}

function impactLabel(s) {
  if (s <= 3) return "Low Impact"
  if (s <= 5) return "Worth Watching"
  if (s <= 7) return "Notable"
  if (s <= 9) return "Major"
  return "Critical"
}

function effortStyle(e) {
  if (e === "2 min")  return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" }
  if (e === "20 min") return { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" }
  return                     { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4" }
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function parseDate(d) {
  if (!d) return 0
  const [mon, yr] = d.split(" ")
  return (parseInt(yr) || 0) * 12 + (MONTHS.indexOf(mon) ?? 0)
}

const CAT_ORDER = [
  "All", "Executive Power", "Rule of Law", "Economy", "Civil Rights",
  "National Security", "Healthcare", "Environment", "Education & Science",
  "Immigration", "Media & Democracy",
]

const CAT_EMOJI = {
  "All":                "🗂️",
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

const ACTION_WORDS = [
  { text: "Act",                   color: "#60a5fa", glow: "rgba(59,130,246,0.10)"  },
  { text: "Show Up",               color: "#34d399", glow: "rgba(52,211,153,0.09)"  },
  { text: "Make a Difference",     color: "#a78bfa", glow: "rgba(167,139,250,0.10)" },
  { text: "Take a Stand",          color: "#fb923c", glow: "rgba(251,146,60,0.10)"  },
  { text: "Get Involved",          color: "#f472b6", glow: "rgba(244,114,182,0.09)" },
  { text: "Make Your Voice Heard", color: "#38bdf8", glow: "rgba(56,189,248,0.10)"  },
]

function catSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function IssueCard({ issue, expanded, onToggle, completedKeys, onAction, weekCount }) {
  const cc = cardColor(issue.severity_score)
  return (
    <div style={{
      background: "#ffffff", borderRadius: 16,
      border: "1px solid #e5e7eb", borderLeft: `4px solid ${cc.border}`,
      boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.1)" : "0 1px 4px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.2s", overflow: "hidden",
    }}>
      <Link href={"/issue/" + issue.slug} style={{ textDecoration: "none", color: "inherit", display: "block", padding: "22px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: cc.text, background: cc.bg, padding: "3px 8px", borderRadius: 4, border: `1px solid ${cc.border}33`,
              }}>{issue.category}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{issue.date}</span>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: "#111827", lineHeight: 1.4, letterSpacing: "-0.01em" }}>{issue.title}</h2>
            <p style={{ color: "#4b5563", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{issue.description}</p>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: cc.bg, border: `2px solid ${cc.border}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: cc.text, letterSpacing: "-0.02em",
            }}>{issue.severity_score}</div>
            <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{impactLabel(issue.severity_score)}</div>
          </div>
        </div>
      </Link>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 16px", gap: 12 }}>
        <div>
          {weekCount > 0 && (
            <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "#22c55e", fontSize: 14 }}>●</span>
              <span><strong style={{ color: "#374151" }}>{weekCount}</strong> {weekCount === 1 ? "person" : "people"} took action this week</span>
            </span>
          )}
        </div>
        <button onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle() }} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8,
          background: expanded ? "#f3f4f6" : "#111827",
          border: expanded ? "1px solid #d1d5db" : "1px solid #111827",
          color: expanded ? "#374151" : "#ffffff",
          fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
        }}>{expanded ? "Hide ↑" : "Take Action →"}</button>
      </div>
      <div style={{ height: 3, background: "#f3f4f6" }}>
        <div style={{ width: `${issue.severity_score * 10}%`, height: 3, background: cc.border, opacity: 0.5 }} />
      </div>
      {expanded && (
        <div onClick={e => { e.preventDefault(); e.stopPropagation() }} style={{ borderTop: "1px solid #f3f4f6", padding: "20px 24px 24px", background: "#fafafa" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>What You Can Do</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {(issue.actions || []).map((a, i) => {
              const s = effortStyle(a.effort)
              const done = completedKeys.has(`${issue.slug}-${i}`)
              return (
                <div key={i} onClick={() => onAction(issue.slug, i)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10,
                  background: done ? "#f0fdf4" : "#ffffff", border: `1px solid ${done ? "#86efac" : "#e5e7eb"}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 5, flexShrink: 0, color: done ? "#16a34a" : s.color, background: done ? "#dcfce7" : s.bg, border: `1px solid ${done ? "#86efac" : s.border}` }}>{a.effort}</span>
                  <span style={{ fontSize: 14, color: done ? "#9ca3af" : "#374151", lineHeight: 1.5, flex: 1, textDecoration: done ? "line-through" : "none" }}>{a.text}</span>
                  <span style={{ fontSize: 16, flexShrink: 0, color: done ? "#16a34a" : "#d1d5db" }}>{done ? "✓" : "○"}</span>
                </div>
              )
            })}
          </div>
          <Link href={"/issue/" + issue.slug} style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Full issue details ↗
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [issues,        setIssues]        = useState([])
  const [cat,           setCat]           = useState("All")
  const [scrolled,      setScrolled]      = useState(false)
  const [wordIdx,       setWordIdx]       = useState(0)
  const [wordVisible,   setWordVisible]   = useState(true)
  const [loading,       setLoading]       = useState(true)
  const [prefs,         setPrefs]         = useState(null)
  const [showAll,       setShowAll]       = useState(false)

  const [expandedSlug,  setExpandedSlug]  = useState(null)
  const [actionCounts,  setActionCounts]  = useState({})
  const [completedKeys, setCompletedKeys] = useState(new Set())
  const [showRest,      setShowRest]      = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const done = localStorage.getItem('onboardingComplete')
      if (!done) {
        window.location.href = '/onboarding'
        return
      }
    }
    try {
      const raw = localStorage.getItem("howbadisite_prefs")
      if (raw) setPrefs(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.from("issues").select("*").eq("is_published", true)
      .then(({ data }) => { if (data) setIssues(data) })
  }, [])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
      const keys = stored.map(item =>
        typeof item === "string" ? item : `${item.issueSlug}-${item.actionIndex ?? 0}`
      ).filter(Boolean)
      setCompletedKeys(new Set(keys))
    } catch {}
  }, [])

  useEffect(() => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    supabase
      .from("action_clicks")
      .select("issue_slug")
      .gte("clicked_at", since)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        for (const row of data) {
          counts[row.issue_slug] = (counts[row.issue_slug] || 0) + 1
        }
        setActionCounts(counts)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => { setShowRest(false) }, [cat, showAll])

  useEffect(() => {
    let tid
    const id = setInterval(() => {
      setWordVisible(false)
      tid = setTimeout(() => { setWordIdx(i => (i + 1) % ACTION_WORDS.length); setWordVisible(true) }, 350)
    }, 4000)
    return () => { clearInterval(id); clearTimeout(tid) }
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
        supabase.from("action_clicks").insert({ issue_slug: issueSlug, action_index: actionIndex, clicked_at: new Date().toISOString() }).then(() => {
          setActionCounts(prev => ({ ...prev, [issueSlug]: (prev[issueSlug] || 0) + 1 }))
        }).catch(() => {})
      }
      return next
    })
  }, [])

  if (loading) return <div style={{ background: "#111827", minHeight: "100vh" }} />

  const userCats   = prefs?.categories || []
  const isPersonal = userCats.length > 0 && !showAll

  const existingCats = new Set(issues.map(i => i.category))
  const cats = CAT_ORDER.filter(c => c === "All" || existingCats.has(c))

  // Sort: recent issues (last 30 days) first by impact, then older ones by impact
  const cutoff = parseDate(new Date(Date.now() - 30 * 24 * 3600 * 1000)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" }))
  const byImpact = arr => [...arr].sort((a, b) => {
    const aRecent = parseDate(a.date) >= cutoff
    const bRecent = parseDate(b.date) >= cutoff
    if (aRecent !== bRecent) return aRecent ? -1 : 1
    return b.severity_score - a.severity_score
  })

  const pool = isPersonal ? issues.filter(i => userCats.includes(i.category)) : issues

  let featured, smallA, smallB
  if (!isPersonal || userCats.length <= 1) {
    const top = byImpact(pool)
    featured = top[0]; smallA = top[1]; smallB = top[2]
  } else if (userCats.length === 2) {
    const c1 = byImpact(issues.filter(i => i.category === userCats[0]))
    const c2 = byImpact(issues.filter(i => i.category === userCats[1]))
    featured = c1[0]; smallA = c1[1]; smallB = c2[0]
  } else {
    const c1 = byImpact(issues.filter(i => i.category === userCats[0]))
    const c2 = byImpact(issues.filter(i => i.category === userCats[1]))
    const c3 = byImpact(issues.filter(i => i.category === userCats[2]))
    featured = c1[0]; smallA = c2[0]; smallB = c3[0]
  }

  const usedSlugs = new Set([featured, smallA, smallB].filter(Boolean).map(i => i.slug))
  const expandIssues = byImpact(pool).filter(i => !usedSlugs.has(i.slug)).slice(0, 6)

  const word = ACTION_WORDS[wordIdx] || ACTION_WORDS[0]

  const critCount    = issues.filter(i => i.severity_score >= 8).length
  const majorCount   = issues.filter(i => i.severity_score >= 6 && i.severity_score < 8).length
  const totalActions = issues.reduce((acc, i) => acc + (i.actions?.length || 0), 0)

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* Dark section */}
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
              <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>→ Politics & Governance</span>
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
          {/* grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
          {/* glow */}
          <div style={{
            position: "absolute", top: -60, left: "25%",
            width: 600, height: 400,
            background: `radial-gradient(ellipse at center, ${word.glow} 0%, transparent 70%)`,
            pointerEvents: "none",
            transition: "background 0.8s ease",
          }} />

          <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "88px 32px 48px" }}>

            {/* Personal dashboard bar */}
            <div style={{
              paddingBottom: 20, marginBottom: 32,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)", letterSpacing: "0.02em", fontStyle: "italic" }}>
                Your issues. Your action. Your impact.
              </span>
            </div>

            {/* Animated title */}
            <h1 style={{
              fontSize: "clamp(18px, 3.6vw, 60px)",
              fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em",
              margin: "0 0 24px", color: "#f1f5f9",
              whiteSpace: "nowrap",
            }}>
              How Will You{" "}
              <span style={{
                color: word.color,
                textShadow: `0 2px 40px ${word.color}44`,
                opacity: wordVisible ? 1 : 0,
                transition: "opacity 0.35s ease, color 0.35s ease, text-shadow 0.35s ease",
              }}>{word.text} Today?</span>
            </h1>

            <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, maxWidth: 480, margin: "0 0 48px", fontWeight: 400 }}>
              Connect with the issues you care about — understand what's happening, why it matters, and how you can make a difference.
            </p>

            {/* Category tabs */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              {cats.map(c => {
                const isActive = c === cat
                return c === "All" ? (
                  <button key={c} onClick={() => setCat("All")} style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 99,
                    background: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                    border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    color: isActive ? "#f1f5f9" : "#6b7280",
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                  }}>
                    <span>{CAT_EMOJI[c]}</span><span>{c}</span>
                  </button>
                ) : (
                  <Link key={c} href={`/category/${catSlug(c)}`} style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 99,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#6b7280", fontSize: 13, fontWeight: 400,
                    textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.15s",
                  }}>
                    <span>{CAT_EMOJI[c]}</span><span>{c}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Wave SVG divider */}
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", width: "100%", marginBottom: -2 }}>
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="#f4f5f7"/>
          </svg>
        </div>
      </div>

      {/* Light section */}
      <div style={{ background: "#f4f5f7" }}>

        {/* Stats bar */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            {userCats.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>👋 Your Feed</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {userCats.map(cat => {
                    return (
                      <span key={cat} style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
                        background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb",
                      }}>{cat}</span>
                    )
                  })}
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", height: 56 }}>
              {[
                { value: issues.length, label: "Issues Tracked" },
                { value: critCount,     label: "Critical" },
                { value: majorCount,    label: "Major" },
                { value: totalActions,  label: "Actions Available" },
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
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                {isPersonal && (
                  <>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      Your feed · {userCats.slice(0, 2).join(", ")}{userCats.length > 2 ? ` +${userCats.length - 2}` : ""}
                    </span>
                    <button onClick={() => setShowAll(true)} style={{
                      fontSize: 12, color: "#3b82f6", background: "none", border: "none",
                      cursor: "pointer", fontWeight: 600, padding: 0,
                    }}>See all →</button>
                  </>
                )}
                {showAll && (
                  <>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>All issues</span>
                    <button onClick={() => setShowAll(false)} style={{
                      fontSize: 12, color: "#3b82f6", background: "none", border: "none",
                      cursor: "pointer", fontWeight: 600, padding: 0,
                    }}>← My feed</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Issue cards + expand */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px 32px" }}>

          {/* Featured card — full width */}
          {featured && <IssueCard issue={featured} expanded={expandedSlug === featured.slug} onToggle={() => setExpandedSlug(s => s === featured.slug ? null : featured.slug)} completedKeys={completedKeys} onAction={handleActionClick} weekCount={actionCounts[featured.slug] || 0} />}

          {/* Two small cards */}
          {(smallA || smallB) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              {smallA && <IssueCard issue={smallA} expanded={expandedSlug === smallA.slug} onToggle={() => setExpandedSlug(s => s === smallA.slug ? null : smallA.slug)} completedKeys={completedKeys} onAction={handleActionClick} weekCount={actionCounts[smallA.slug] || 0} />}
              {smallB && <IssueCard issue={smallB} expanded={expandedSlug === smallB.slug} onToggle={() => setExpandedSlug(s => s === smallB.slug ? null : smallB.slug)} completedKeys={completedKeys} onAction={handleActionClick} weekCount={actionCounts[smallB.slug] || 0} />}
            </div>
          )}

          {/* Expand bar */}
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
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ transition: "transform 0.3s ease", transform: showRest ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showRest && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                  {expandIssues.map(issue => (
                    <IssueCard key={issue.id} issue={issue} expanded={expandedSlug === issue.slug} onToggle={() => setExpandedSlug(s => s === issue.slug ? null : issue.slug)} completedKeys={completedKeys} onAction={handleActionClick} weekCount={actionCounts[issue.slug] || 0} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>How Bad Is It?</span>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, maxWidth: 500, textAlign: "right", lineHeight: 1.7 }}>
              Impact ratings are editorial assessments based on institutional impact, scope, reversibility, and legal precedent. Not affiliated with any political party. Always verify with primary sources.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
