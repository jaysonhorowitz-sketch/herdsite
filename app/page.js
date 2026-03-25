"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

const supabase = createClient("https://mwahckdqmiopkzrmdxyc.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWhja2RxbWlvcGt6cm1keHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDgxMjgsImV4cCI6MjA4ODkyNDEyOH0.0Ua6sM8_zLzCdjJ8SGX-MVFkbbbyzDvrjtZuRoZVVxM")

function barColor(s) {
  if (s <= 3) return "#22c55e"
  if (s <= 6) return "#eab308"
  if (s <= 8) return "#f97316"
  return "#ef4444"
}
function badgeBg(s) {
  if (s <= 3) return "rgba(34,197,94,0.1)"
  if (s <= 6) return "rgba(234,179,8,0.1)"
  if (s <= 8) return "rgba(249,115,22,0.1)"
  return "rgba(239,68,68,0.1)"
}
function badgeText(s) {
  if (s <= 3) return "#4ade80"
  if (s <= 6) return "#facc15"
  if (s <= 8) return "#fb923c"
  return "#f87171"
}
function effortStyle(e) {
  if (e === "2 min")  return { bg: "rgba(14,116,144,0.12)",  color: "#67e8f9", border: "rgba(103,232,249,0.12)" }
  if (e === "20 min") return { bg: "rgba(124,58,237,0.12)",  color: "#c4b5fd", border: "rgba(196,181,253,0.12)" }
  return                     { bg: "rgba(15,118,110,0.12)",  color: "#5eead4", border: "rgba(94,234,212,0.12)" }
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function parseDate(d) {
  if (!d) return 0
  const [mon, yr] = d.split(" ")
  return (parseInt(yr) || 0) * 12 + (MONTHS.indexOf(mon) ?? 0)
}

const SORTS = [
  { key: "recent",   label: "Most Recent" },
  { key: "severity", label: "Severity"    },
  { key: "az",       label: "A–Z"         },
]

const CAT_ORDER = [
  "All", "Executive Power", "Rule of Law", "Economy", "Civil Rights",
  "National Security", "Healthcare", "Environment", "Education & Science",
  "Immigration", "Media & Democracy",
]

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

  const existingCats = new Set(issues.map(i => i.category))
  const cats = CAT_ORDER.filter(c => c === "All" || existingCats.has(c))

  const base     = cat === "All" ? issues : issues.filter(i => i.category === cat)
  const filtered = [...base].sort((a, b) => {
    if (sort === "severity") return b.severity_score - a.severity_score
    if (sort === "az")       return a.title.localeCompare(b.title)
    return parseDate(b.date) - parseDate(a.date)
  })

  const word = SCALE_WORDS[wordIdx]

  return (
    <div style={{ background: "#111827", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(17,24,39,0.92)" : "rgba(17,24,39,0)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: word.color, boxShadow: `0 0 8px ${word.color}88`, transition: "all 0.5s ease" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>How Bad Is It</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontSize: 12, color: "#4b5563", letterSpacing: "0.04em" }}>United States · 2025</span>
            <Link href="/donate" style={{
              fontSize: 12, fontWeight: 600, color: "#cbd5e1",
              padding: "7px 16px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              textDecoration: "none", letterSpacing: "0.02em",
            }}>Support the project</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #1a2236 0%, #111827 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
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

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "88px 32px 56px" }}>
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
            <span style={{ fontSize: 12, color: "#4b5563" }}>Updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          </div>

          {/* Title — one horizontal line */}
          <h1 style={{
            display: "flex", alignItems: "baseline", flexWrap: "nowrap",
            gap: "0.22em",
            fontSize: "clamp(40px, 6.5vw, 80px)",
            fontWeight: 800, lineHeight: 1,
            letterSpacing: "-0.04em",
            margin: "0 0 28px",
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

          {/* Subtitle */}
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, maxWidth: 480, margin: 0, fontWeight: 400 }}>
            A nonpartisan severity index tracking U.S. policy actions — with institutional impact, legal context, and steps you can take.
          </p>
        </div>
      </div>

      {/* ── Filter / Sort bar ── */}
      <div style={{
        position: "sticky", top: 60, zIndex: 40,
        background: "rgba(17,24,39,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {cats.map(c => {
              const isAllActive = c === "All" && cat === "All"
              const base = {
                padding: "13px 16px",
                border: "none",
                borderBottom: isAllActive ? `2px solid ${word.color}` : "2px solid transparent",
                background: "transparent",
                color: isAllActive ? "#f1f5f9" : "#4b5563",
                fontSize: 13, fontWeight: isAllActive ? 600 : 400,
                whiteSpace: "nowrap", letterSpacing: "0.01em",
                transition: "color 0.15s, border-color 0.4s",
                marginBottom: -1, textDecoration: "none", display: "inline-block",
              }
              return c === "All" ? (
                <button key={c} onClick={() => setCat("All")} style={{ ...base, cursor: "pointer" }}>{c}</button>
              ) : (
                <Link key={c} href={`/category/${catSlug(c)}`} style={base}>{c}</Link>
              )
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0" }}>
            <span style={{ fontSize: 12, color: "#4b5563" }}>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>{filtered.length}</span>{" "}
              {cat !== "All" ? `results in ${cat}` : "issues tracked"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#374151", marginRight: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sort</span>
              {SORTS.map(s => (
                <button key={s.key} onClick={() => setSort(s.key)} style={{
                  padding: "5px 12px", borderRadius: 6,
                  border: "1px solid " + (sort === s.key ? "rgba(255,255,255,0.1)" : "transparent"),
                  background: sort === s.key ? "rgba(255,255,255,0.07)" : "transparent",
                  color: sort === s.key ? "#e2e8f0" : "#4b5563",
                  fontSize: 12, fontWeight: sort === s.key ? 600 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                }}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Issue list ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {filtered.map(issue => (
            <Link href={"/issue/" + issue.slug} key={issue.id} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  background: "#1a2236",
                  borderRadius: 10,
                  padding: "20px 24px",
                  cursor: "pointer",
                  transition: "background 0.15s, transform 0.15s",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: "3px solid " + barColor(issue.severity_score),
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1f2a42"; e.currentTarget.style.transform = "translateY(-1px)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1a2236"; e.currentTarget.style.transform = "translateY(0)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: badgeText(issue.severity_score),
                        background: badgeBg(issue.severity_score),
                        padding: "3px 8px", borderRadius: 4,
                        border: `1px solid ${barColor(issue.severity_score)}22`,
                      }}>{issue.category}</span>
                      <span style={{ fontSize: 11, color: "#374151" }}>{issue.date}</span>
                    </div>
                    <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 7px", color: "#e2e8f0", lineHeight: 1.45, letterSpacing: "-0.01em" }}>{issue.title}</h2>
                    <p style={{ color: "#4b5563", fontSize: 13, lineHeight: 1.65, margin: "0 0 12px" }}>{issue.description}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {issue.actions && issue.actions.map((a, i) => {
                        const s = effortStyle(a.effort)
                        return (
                          <span key={i} style={{
                            fontSize: 11, padding: "4px 10px", borderRadius: 5,
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
                      width: 46, height: 46, borderRadius: 9,
                      background: badgeBg(issue.severity_score),
                      border: `1px solid ${barColor(issue.severity_score)}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, fontWeight: 800, color: badgeText(issue.severity_score),
                      letterSpacing: "-0.02em",
                    }}>{issue.severity_score}</div>
                    <div style={{ fontSize: 9, color: "#374151", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>{issue.severity_label}</div>
                  </div>
                </div>

                <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 2, marginTop: 14 }}>
                  <div style={{ width: issue.severity_score * 10 + "%", height: 2, borderRadius: 99, background: barColor(issue.severity_score), opacity: 0.7 }} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#374151", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>How Bad Is It?</span>
          <p style={{ fontSize: 12, color: "#374151", margin: 0, maxWidth: 500, textAlign: "right", lineHeight: 1.7 }}>
            Severity ratings are editorial assessments based on institutional impact, scope, reversibility, and legal precedent. Not affiliated with any political party. Always verify with primary sources.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
