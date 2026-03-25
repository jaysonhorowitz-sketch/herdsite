"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

const supabase = createClient("https://mwahckdqmiopkzrmdxyc.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWhja2RxbWlvcGt6cm1keHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDgxMjgsImV4cCI6MjA4ODkyNDEyOH0.0Ua6sM8_zLzCdjJ8SGX-MVFkbbbyzDvrjtZuRoZVVxM")

// Light-mode card colors (border, badge bg, badge text)
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
  const [issues,      setIssues]      = useState([])
  const [cat,         setCat]         = useState("All")
  const [sort,        setSort]        = useState("severity")
  const [scrolled,    setScrolled]    = useState(false)
  const [wordIdx,     setWordIdx]     = useState(4)
  const [wordVisible, setWordVisible] = useState(true)
  const [loading,     setLoading]     = useState(true)
  const [prefs,       setPrefs]       = useState(null)
  const [showAll,     setShowAll]     = useState(false)

  useEffect(() => {
    let parsed = null
    try {
      const raw = localStorage.getItem("howbadisite_prefs")
      if (raw) parsed = JSON.parse(raw)
    } catch {}

    if (!parsed || !parsed.completedAt) {
      window.location.replace("/onboarding")
      return
    }

    setPrefs(parsed)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.from("issues").select("*").eq("is_published", true)
      .then(({ data }) => { if (data) setIssues(data) })
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

  const critCount  = issues.filter(i => i.severity_score >= 8).length
  const majorCount = issues.filter(i => i.severity_score >= 6 && i.severity_score < 8).length
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
          {/* Subtle grid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
          {/* Ambient glow */}
          <div style={{
            position: "absolute", top: -60, left: "25%",
            width: 600, height: 400,
            background: `radial-gradient(ellipse at center, ${word.glow} 0%, transparent 70%)`,
            pointerEvents: "none",
            transition: "background 0.8s ease",
          }} />

          <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "88px 32px 48px" }}>
            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                background: `${word.color}12`, border: `1px solid ${word.color}28`,
                borderRadius: 99, padding: "5px 14px",
                transition: "all 0.5s ease",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: word.color, animation: "pulse 2s infinite", transition: "background 0.5s" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: word.color, letterSpacing: "0.12em", textTransform: "uppercase", transition: "color 0.5s" }}>Live Tracker</span>
              </div>
              <span style={{ fontSize: 12, color: "#4b5563" }}>Updated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>

            {/* Title */}
            <h1 style={{
              display: "flex", alignItems: "baseline", flexWrap: "nowrap",
              gap: "0.22em",
              fontSize: "clamp(40px, 6.5vw, 80px)",
              fontWeight: 800, lineHeight: 1,
              letterSpacing: "-0.04em",
              margin: "0 0 24px",
            }}>
              <span style={{ color: "#f1f5f9" }}>How</span>
              <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", lineHeight: 1.05 }}>
                <span style={{
                  display: "inline-block",
                  color: word.color,
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

            {/* Category tabs in dark hero */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              {cats.map(c => {
                const isActive = c === cat
                return c === "All" ? (
                  <button
                    key={c}
                    onClick={() => setCat("All")}
                    style={{
                      flexShrink: 0,
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 99,
                      background: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                      border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                      color: isActive ? "#f1f5f9" : "#6b7280",
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      cursor: "pointer", transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>{CAT_EMOJI[c]}</span>
                    <span>{c}</span>
                  </button>
                ) : (
                  <Link
                    key={c}
                    href={`/category/${catSlug(c)}`}
                    style={{
                      flexShrink: 0,
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 99,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#6b7280",
                      fontSize: 13, fontWeight: 400,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{CAT_EMOJI[c]}</span>
                    <span>{c}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Wave divider */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 0, height: 56 }}>
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

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                {/* Personalized feed toggle */}
                {isPersonal && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      Your feed · {userCats.slice(0, 2).join(", ")}{userCats.length > 2 ? ` +${userCats.length - 2}` : ""}
                    </span>
                    <button onClick={() => setShowAll(true)} style={{
                      fontSize: 12, color: "#3b82f6", background: "none", border: "none",
                      cursor: "pointer", fontWeight: 600, padding: 0,
                    }}>See all →</button>
                  </div>
                )}
                {showAll && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>All issues</span>
                    <button onClick={() => setShowAll(false)} style={{
                      fontSize: 12, color: "#3b82f6", background: "none", border: "none",
                      cursor: "pointer", fontWeight: 600, padding: 0,
                    }}>← My feed</button>
                  </div>
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
              const cc = cardColor(issue.severity_score)
              return (
                <Link href={"/issue/" + issue.slug} key={issue.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 16,
                      padding: "22px 24px",
                      cursor: "pointer",
                      transition: "box-shadow 0.15s, transform 0.15s",
                      border: "1px solid #e5e7eb",
                      borderLeft: `4px solid ${cc.border}`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                            color: cc.text, background: cc.bg,
                            padding: "3px 8px", borderRadius: 4,
                            border: `1px solid ${cc.border}33`,
                          }}>{issue.category}</span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>{issue.date}</span>
                        </div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: "#111827", lineHeight: 1.4, letterSpacing: "-0.01em" }}>{issue.title}</h2>
                        <p style={{ color: "#4b5563", fontSize: 14, lineHeight: 1.65, margin: "0 0 12px" }}>{issue.description}</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {issue.actions && issue.actions.map((a, i) => {
                            const s = effortStyle(a.effort)
                            return (
                              <span key={i} style={{
                                fontSize: 11, padding: "4px 12px", borderRadius: 99,
                                background: s.bg, color: s.color,
                                border: `1px solid ${s.border}`,
                                fontWeight: 500,
                              }}>{a.effort} — {a.text}</span>
                            )
                          })}
                        </div>
                      </div>

                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 12,
                          background: cc.bg,
                          border: `2px solid ${cc.border}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 22, fontWeight: 800, color: cc.text,
                          letterSpacing: "-0.02em",
                        }}>{issue.severity_score}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                          {impactLabel(issue.severity_score)}
                        </div>
                      </div>
                    </div>

                    <div style={{ width: "100%", background: "#f3f4f6", borderRadius: 99, height: 3, marginTop: 16 }}>
                      <div style={{ width: issue.severity_score * 10 + "%", height: 3, borderRadius: 99, background: cc.border, opacity: 0.6 }} />
                    </div>
                  </div>
                </Link>
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
