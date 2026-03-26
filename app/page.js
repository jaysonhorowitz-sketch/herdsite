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

const SORTS = [
  { key: "severity", label: "Impact" },
  { key: "recent",   label: "Recent"  },
  { key: "az",       label: "A–Z"     },
]

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

const SCALE_WORDS = [
  { text: "Good",       color: "#22c55e", glow: "rgba(34,197,94,0.1)"   },
  { text: "Fine",       color: "#84cc16", glow: "rgba(132,204,22,0.09)" },
  { text: "Concerning", color: "#eab308", glow: "rgba(234,179,8,0.1)"   },
  { text: "Serious",    color: "#f97316", glow: "rgba(249,115,22,0.11)" },
  { text: "Bad",        color: "#ef4444", glow: "rgba(239,68,68,0.12)"  },
  { text: "Critical",   color: "#dc2626", glow: "rgba(220,38,38,0.14)"  },
]

function catSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function Home() {
  const [issues,        setIssues]        = useState([])
  const [cat,           setCat]           = useState("All")
  const [sort,          setSort]          = useState("recent")
  const [scrolled,      setScrolled]      = useState(false)
  const [wordIdx,       setWordIdx]       = useState(4)
  const [wordVisible,   setWordVisible]   = useState(true)
  const [loading,       setLoading]       = useState(true)
  const [prefs,         setPrefs]         = useState(null)
  const [showAll,       setShowAll]       = useState(false)
  const [expandedSlug,  setExpandedSlug]  = useState(null)
  const [actionCounts,  setActionCounts]  = useState({})   // slug → weekly count
  const [completedKeys, setCompletedKeys] = useState(new Set())

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

  // Load completed actions from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
      // Normalize: accept both new string format and old object format
      const keys = stored.map(item =>
        typeof item === "string" ? item : `${item.issueSlug}-${item.actionIndex ?? 0}`
      ).filter(Boolean)
      setCompletedKeys(new Set(keys))
    } catch {}
  }, [])

  // Fetch weekly action counts from Supabase
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
      .catch(() => {}) // table may not exist yet
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => { setWordIdx(i => (i + 1) % SCALE_WORDS.length); setWordVisible(true) }, 350)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  const handleActionClick = useCallback((issueSlug, actionIndex) => {
    const key = `${issueSlug}-${actionIndex}`

    setCompletedKeys(prev => {
      if (prev.has(key)) {
        // Toggle off
        const next = new Set(prev)
        next.delete(key)
        try {
          const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
          localStorage.setItem("completedActions", JSON.stringify(stored.filter(k => k !== key)))
        } catch {}
        return next
      }
      // Mark complete
      const next = new Set(prev)
      next.add(key)
      try {
        const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
        if (!stored.includes(key)) {
          stored.push(key)
          localStorage.setItem("completedActions", JSON.stringify(stored))
        }
      } catch {}
      // Record in Supabase (fire-and-forget)
      supabase.from("action_clicks").insert({
        issue_slug: issueSlug, action_index: actionIndex, clicked_at: new Date().toISOString(),
      }).then(() => setActionCounts(prev => ({ ...prev, [issueSlug]: (prev[issueSlug] || 0) + 1 }))).catch(() => {})
      return next
    })
  }, [])

  if (loading) return <div style={{ background: "#111827", minHeight: "100vh" }} />

  const userCats   = prefs.categories || []
  const isPersonal = userCats.length > 0 && !showAll

  const existingCats = new Set(issues.map(i => i.category))
  const cats = CAT_ORDER.filter(c => c === "All" || existingCats.has(c))

  const personalBase = isPersonal ? issues.filter(i => userCats.includes(i.category)) : issues
  const base     = cat === "All" ? personalBase : personalBase.filter(i => i.category === cat)
  const filtered = [...base].sort((a, b) => {
    if (sort === "severity") return b.severity_score - a.severity_score
    if (sort === "az")       return a.title.localeCompare(b.title)
    return parseDate(b.date) - parseDate(a.date)
  })

  const word = SCALE_WORDS[wordIdx]

  const critCount    = issues.filter(i => i.severity_score >= 8).length
  const majorCount   = issues.filter(i => i.severity_score >= 6 && i.severity_score < 8).length
  const totalActions = issues.reduce((acc, i) => acc + (i.actions?.length || 0), 0)

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
              <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>→ Politics & Governance</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Link href="/profile" style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa", textDecoration: "none" }}>My Impact</Link>
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
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
          <div style={{
            position: "absolute", top: -60, left: "25%",
            width: 600, height: 400,
            background: `radial-gradient(ellipse at center, ${word.glow} 0%, transparent 70%)`,
            pointerEvents: "none",
            transition: "background 0.8s ease",
          }} />

          <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "88px 32px 48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                background: `${word.color}12`, border: `1px solid ${word.color}28`,
                borderRadius: 99, padding: "5px 14px", transition: "all 0.5s ease",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: word.color, animation: "pulse 2s infinite", transition: "background 0.5s" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: word.color, letterSpacing: "0.12em", textTransform: "uppercase", transition: "color 0.5s" }}>Live Tracker</span>
              </div>
              <span style={{ fontSize: 12, color: "#4b5563" }}>Updated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>

            <h1 style={{
              display: "flex", alignItems: "baseline", flexWrap: "nowrap",
              gap: "0.22em", fontSize: "clamp(40px, 6.5vw, 80px)",
              fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", margin: "0 0 24px",
            }}>
              <span style={{ color: "#f1f5f9" }}>How</span>
              <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", lineHeight: 1.05 }}>
                <span style={{
                  display: "inline-block", color: word.color,
                  textShadow: `0 2px 40px ${word.color}33`,
                  opacity: wordVisible ? 1 : 0,
                  transform: wordVisible ? "translateY(0)" : "translateY(28px)",
                  transition: "opacity 0.32s ease, transform 0.32s ease, color 0.4s ease, text-shadow 0.4s ease",
                }}>{word.text}</span>
              </span>
              <span style={{ color: "#f1f5f9" }}>Is It?</span>
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

          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", width: "100%", marginBottom: -2 }}>
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="#f4f5f7"/>
          </svg>
        </div>
      </div>

      {/* ── Light section ── */}
      <div style={{ background: "#f4f5f7", minHeight: "60vh" }}>

        {/* Stats bar */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
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

        {/* Sort + count bar */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>
              {filtered.length} {cat !== "All" ? `issues in ${cat}` : isPersonal ? "issues in your feed" : "issues tracked"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sort</span>
              {SORTS.map(s => (
                <button key={s.key} onClick={() => setSort(s.key)} style={{
                  padding: "5px 14px", borderRadius: 99,
                  border: "1px solid " + (sort === s.key ? "#d1d5db" : "transparent"),
                  background: sort === s.key ? "#ffffff" : "transparent",
                  color: sort === s.key ? "#111827" : "#9ca3af",
                  fontSize: 12, fontWeight: sort === s.key ? 600 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: sort === s.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Issue cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 80 }}>
            {filtered.map(issue => {
              const cc       = cardColor(issue.severity_score)
              const isExpanded = expandedSlug === issue.slug
              const weekCount  = actionCounts[issue.slug] || 0

              return (
                <div key={issue.id} style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid #e5e7eb",
                  borderLeft: `4px solid ${cc.border}`,
                  boxShadow: isExpanded ? "0 4px 20px rgba(0,0,0,0.1)" : "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "box-shadow 0.2s",
                  overflow: "hidden",
                }}>
                  {/* Clickable area → issue page */}
                  <Link href={"/issue/" + issue.slug} style={{ textDecoration: "none", color: "inherit", display: "block", padding: "22px 24px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                            color: cc.text, background: cc.bg, padding: "3px 8px", borderRadius: 4,
                            border: `1px solid ${cc.border}33`,
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
                        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                          {impactLabel(issue.severity_score)}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Bottom bar: social proof + Take Action button */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 24px 16px", gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {weekCount > 0 && (
                        <span style={{
                          fontSize: 12, color: "#6b7280",
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <span style={{ color: "#22c55e", fontSize: 14 }}>●</span>
                          <span><strong style={{ color: "#374151" }}>{weekCount}</strong> {weekCount === 1 ? "person" : "people"} took action this week</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setExpandedSlug(s => s === issue.slug ? null : issue.slug)
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 18px", borderRadius: 8,
                        background: isExpanded ? "#f3f4f6" : "#111827",
                        border: isExpanded ? "1px solid #d1d5db" : "1px solid #111827",
                        color: isExpanded ? "#374151" : "#ffffff",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
                      }}
                    >
                      {isExpanded ? "Hide ↑" : "Take Action →"}
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, background: "#f3f4f6" }}>
                    <div style={{ width: issue.severity_score * 10 + "%", height: 3, background: cc.border, opacity: 0.5 }} />
                  </div>

                  {/* ── Expanded actions panel ── */}
                  {isExpanded && (
                    <div
                      onClick={e => { e.preventDefault(); e.stopPropagation() }}
                      style={{
                        borderTop: "1px solid #f3f4f6",
                        padding: "20px 24px 24px",
                        background: "#fafafa",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                        What You Can Do
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                        {(issue.actions || []).map((a, i) => {
                          const s    = effortStyle(a.effort)
                          const done = completedKeys.has(`${issue.slug}-${i}`)
                          return (
                            <div
                              key={i}
                              onClick={() => handleActionClick(issue.slug, i)}
                              style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "11px 14px", borderRadius: 10,
                                background: done ? "#f0fdf4" : "#ffffff",
                                border: `1px solid ${done ? "#86efac" : "#e5e7eb"}`,
                                cursor: "pointer", transition: "all 0.15s",
                              }}
                            >
                              <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                                textTransform: "uppercase", padding: "4px 9px", borderRadius: 5,
                                flexShrink: 0,
                                color: done ? "#16a34a" : s.color,
                                background: done ? "#dcfce7" : s.bg,
                                border: `1px solid ${done ? "#86efac" : s.border}`,
                              }}>{a.effort}</span>
                              <span style={{
                                fontSize: 14, color: done ? "#9ca3af" : "#374151",
                                lineHeight: 1.5, flex: 1,
                                textDecoration: done ? "line-through" : "none",
                              }}>{a.text}</span>
                              <span style={{ fontSize: 16, flexShrink: 0, color: done ? "#16a34a" : "#d1d5db" }}>
                                {done ? "✓" : "○"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <Link href={"/issue/" + issue.slug} style={{
                        fontSize: 13, color: "#3b82f6", fontWeight: 600,
                        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        Full issue details ↗
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
