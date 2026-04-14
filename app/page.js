"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

const supabase = createClient()


// ─── Action URL derivation (mirrors issue detail page logic) ──────────────────
const CALL_RE     = /\b(call|contact|write|email|reach out)\b/i
const CIVIC_RE    = /\b(senator|representative|congress(man|woman|person)?|rep\b|member of congress|official|lawmaker|commerce department|state department|white house)\b/i
const PETITION_RE = /\b(petition|sign a? ?petition)\b/i
const DONATE_RE   = /\bdonate\b/i
const ATTEND_RE   = /\b(attend|join|volunteer)\b/i
const GOVT_RE     = /\b(committee|hearing|bill|legislation|congress|senate|house|federal|agency|regulation|foia|vote|voting)\b/i
const SOURCE_PATTERNS = [
  { re: /\bcongress\.gov\b/i,          url: t => `https://congress.gov/search?q=${encodeURIComponent(t)}` },
  { re: /\bopensecrets\b/i,            url: () => "https://www.opensecrets.org" },
  { re: /\bscotus\b|supreme court\b/i, url: () => "https://www.supremecourt.gov" },
  { re: /\bfec\.gov\b|federal election commission\b/i, url: () => "https://www.fec.gov" },
]
function getActionUrl(actionText, issueTitle, issueSlug) {
  const t = actionText
  if (CALL_RE.test(t) || CIVIC_RE.test(t)) return "https://5calls.org"
  if (PETITION_RE.test(t)) return `https://www.change.org/search?q=${encodeURIComponent(issueTitle)}`
  if (DONATE_RE.test(t)) return `/issue/${issueSlug}#take-action`
  if (ATTEND_RE.test(t)) return `https://www.volunteermatch.org/search?k=${encodeURIComponent(issueTitle)}`
  if (/\b(read|review|research|track|monitor|follow|learn|understand|explore)\b/i.test(t)) {
    for (const { re, url } of SOURCE_PATTERNS) {
      if (re.test(t)) return url(issueTitle)
    }
    if (GOVT_RE.test(t)) return `https://congress.gov/search?q=${encodeURIComponent(issueTitle)}`
    return `https://congress.gov/search?q=${encodeURIComponent(issueTitle)}`
  }
  return "https://5calls.org"
}

function effortStyle(e) {
  if (e === "2 min")  return { bg: "#1e3a5f", color: "#7dd3fc", border: "#1e40af" }
  if (e === "20 min") return { bg: "#2e1a5e", color: "#c4b5fd", border: "#5b21b6" }
  return                     { bg: "#1a3d36", color: "#6ee7b7", border: "#065f46" }
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

const CAT_COLOR = {
  "Executive Power":    "#60a5fa",
  "Rule of Law":        "#a78bfa",
  "Economy":            "#34d399",
  "Civil Rights":       "#f87171",
  "National Security":  "#818cf8",
  "Healthcare":         "#f472b6",
  "Environment":        "#6ee7b7",
  "Education & Science":"#67e8f9",
  "Immigration":        "#fb923c",
  "Media & Democracy":  "#fbbf24",
}

function catSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// ─── Hardcoded action cards data ───────────────────────────────────────────────
const ACTION_CARDS = [
  {
    icon: "📞",
    effort: "2 MIN EACH",
    headline: "Call your representatives",
    body: "Find your senators and house rep, with a script for the issues you care about.",
    cta: "→ Get started",
    link: "/actions/call",
  },
  {
    icon: "🌳",
    effort: "FREE",
    headline: "Explore nonprofits",
    body: "Discover vetted organizations working on the issues you care about.",
    cta: "→ Browse causes",
    link: "/actions/donate",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ),
    effort: "NEAR YOU",
    headline: "Get Involved",
    body: "Events, actions, and opportunities near you.",
    cta: "→ Find events",
    link: "/actions/events",
  },
  {
    icon: "📰",
    effort: "FREE",
    headline: "Stay informed",
    body: "Curated newsletters and Substacks covering the issues you follow — vetted by topic.",
    cta: "→ Browse newsletters",
    link: "/actions/newsletters",
  },
]

// ─── TickerLine (main headline) ────────────────────────────────────────────────
function TickerLine({ topics, critWeekCount, activeCat, catCounts }) {
  const [idx,     setIdx]     = useState(0)
  const [visible, setVisible] = useState(true)
  const [paused,  setPaused]  = useState(false)

  const shouldRotate = activeCat === "All" || activeCat === "home"

  useEffect(() => {
    if (!shouldRotate || topics.length <= 1 || paused) return
    const id = setInterval(() => {
      setVisible(false)
      const tid = setTimeout(() => {
        setIdx(i => (i + 1) % topics.length)
        setVisible(true)
      }, 300)
      return () => clearTimeout(tid)
    }, 4000)
    return () => clearInterval(id)
  }, [topics.length, paused, shouldRotate])

  const baseStyle = {
    display: "inline-flex", alignItems: "center", gap: 8,
    transition: "opacity 0.3s ease",
    fontSize: 14, fontWeight: 400, color: "#64748b",
    letterSpacing: "0.01em",
  }

  const ACCENT = "#60a5fa"

  // Static: a specific topic is selected via filter
  if (activeCat !== "All" && activeCat !== "home") {
    const catColor = CAT_COLOR[activeCat] || "#94a3b8"
    const count = catCounts[activeCat] ?? 0
    return (
      <div style={baseStyle}>
        <span style={{ color: ACCENT, fontSize: 9 }}>●</span>
        <span>Now showing: <strong style={{ color: "#94a3b8", fontWeight: 600 }}>{count}</strong> issues in <strong style={{ color: catColor, fontWeight: 600 }}>{activeCat}</strong></span>
      </div>
    )
  }

  // Fallback: no user topics onboarded
  if (topics.length === 0) {
    return (
      <div style={baseStyle}>
        <span style={{ color: ACCENT, fontSize: 9 }}>●</span>
        <span>Now showing: <strong style={{ color: "#94a3b8", fontWeight: 600 }}>{critWeekCount}</strong> critical issues this week</span>
      </div>
    )
  }

  // Single topic
  if (topics.length === 1) {
    const catColor = CAT_COLOR[topics[0].name] || "#94a3b8"
    const count = catCounts[topics[0].name] ?? 0
    return (
      <div style={baseStyle}>
        <span style={{ color: ACCENT, fontSize: 9 }}>●</span>
        <span>Now showing: <strong style={{ color: "#94a3b8", fontWeight: 600 }}>{count}</strong> issues in <strong style={{ color: catColor, fontWeight: 600 }}>{topics[0].name}</strong></span>
      </div>
    )
  }

  // Multi-topic rotation — only number + category fade, frame stays static
  const current  = topics[idx % topics.length]
  const catColor = CAT_COLOR[current?.name] || "#94a3b8"
  const count    = catCounts[current?.name] ?? 0
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={baseStyle}
    >
      <span style={{ color: ACCENT, fontSize: 9 }}>●</span>
      <span>
        Now showing:{" "}
        <strong style={{ color: "#94a3b8", fontWeight: 600, opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", display: "inline-block" }}>{count}</strong>
        {" "}issues in{" "}
        <strong style={{ color: catColor, fontWeight: 600, opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", display: "inline-block" }}>{current?.name}</strong>
      </span>
    </div>
  )
}

// ─── ActionCard ────────────────────────────────────────────────────────────────
function ActionCard({ card }) {
  const [hovered, setHovered] = useState(false)
  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 0,
        background: hovered ? "#1F2937" : "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6,
        padding: "20px 22px",
        cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.2)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
        textDecoration: "none",
        color: "inherit",
        flex: 1,
      }}
    >
      {/* Top row: icon + effort tag */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{card.icon}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#64748b",
        }}>{card.effort}</span>
      </div>

      {/* Headline */}
      <p style={{
        fontSize: 14, fontWeight: 700, color: "#F5F1E8",
        lineHeight: 1.4, margin: "0 0 8px",
      }}>{card.headline}</p>

      {/* Body */}
      <p style={{
        fontSize: 12, color: "#64748b", lineHeight: 1.6,
        margin: "0 0 16px", flex: 1,
      }}>{card.body}</p>

      {/* CTA */}
      <p style={{
        fontSize: 12, fontWeight: 600, color: "#60a5fa",
        margin: 0, letterSpacing: "0.02em",
      }}>{card.cta}</p>
    </div>
  )

  return (
    <Link href={card.link} style={{ flex: 1, textDecoration: "none", color: "inherit", display: "flex" }}>
      {inner}
    </Link>
  )
}

// ─── Severity tier ────────────────────────────────────────────────────────────
function severityTier(s) {
  if (s >= 9) return { label: "severe impact",  color: "#ef4444", bar: "rgba(220,38,38,0.6)"    }
  if (s >= 7) return { label: "major impact",   color: "#fb923c", bar: "rgba(234,88,12,0.6)"    }
  if (s >= 4) return { label: "notable impact", color: "#fbbf24", bar: "rgba(217,119,6,0.6)"    }
  return             { label: "worth watching", color: "#94a3b8", bar: "rgba(100,116,139,0.6)"  }
}

// ─── IssueCard ────────────────────────────────────────────────────────────────
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
        borderTop: "1px solid rgba(255,255,255,0.07)",
        transition: "background 0.15s",
        background: hovered ? "rgba(255,255,255,0.02)" : "transparent",
      }}
    >
      <div style={{ padding: "20px 0 0" }}>
        {/* Category + date */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,241,232,0.5)" }}>{issue.category}</span>
          <span style={{ fontSize: 10, color: "rgba(245,241,232,0.45)", letterSpacing: "0.04em" }}>{issue.date}</span>
        </div>
        {/* Headline */}
        <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 6px", color: "#F5F1E8", lineHeight: 1.35, letterSpacing: "-0.01em" }}>{issue.title}</h2>
        {/* Description */}
        <p style={{ color: "rgba(245,241,232,0.55)", fontSize: 13, lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{issue.description}</p>
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 16px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tier.color, transform: "translateY(5px)", display: "inline-block" }}>{tier.label}</span>
          {weekCount > 0 && (
            <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#22c55e", fontSize: 7 }}>●</span>
              <span><strong style={{ color: "#4b5563", fontWeight: 600 }}>{weekCount}</strong> took action</span>
            </span>
          )}
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "5px 14px", borderRadius: 3,
          background: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.88)",
          color: "#111827", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
          whiteSpace: "nowrap", textTransform: "uppercase",
        }}>Take Action →</span>
      </div>
      <div style={{ height: 2, background: tier.bar }} />
    </Link>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [issues,        setIssues]        = useState([])
  const [cat,           setCat]           = useState("home")
  const [scrolled,      setScrolled]      = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [prefs,         setPrefs]         = useState(null)
  const [topics,        setTopics]        = useState([])
  const [catCounts,     setCatCounts]     = useState({})
  const [expandedSlug,  setExpandedSlug]  = useState(null)
  const [actionCounts,  setActionCounts]  = useState({})
  const [completedKeys, setCompletedKeys] = useState(new Set())
  const [showRest,      setShowRest]      = useState(false)
  const [stickyVisible, setStickyVisible] = useState(true)
  const [selectedCats,  setSelectedCats]  = useState([])
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const actionCardsRef = useRef(null)
  const dropdownRef    = useRef(null)

  useEffect(() => {
    async function loadPrefs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // middleware handles redirect

      const { data } = await supabase
        .from("user_prefs")
        .select("categories, action_pref, zip_code")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!data) {
        window.location.href = "/onboarding"
        return
      }

      setPrefs({ categories: data.categories || [], actionPref: data.action_pref })
      if (data.zip_code) localStorage.setItem("userZipCode", data.zip_code)
      setLoading(false)
    }
    loadPrefs()
  }, [])

  useEffect(() => {
    supabase.from("issues").select("*").eq("is_published", true)
      .then(({ data }) => { if (data) setIssues(data) })
  }, [])

  // Dedicated query for total per-category counts (used by ticker only)
  useEffect(() => {
    supabase.from("issues").select("category").eq("is_published", true)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        for (const row of data) {
          if (row.category) counts[row.category] = (counts[row.category] || 0) + 1
        }
        setCatCounts(counts)
      })
  }, [])

  useEffect(() => {
    if (!issues.length) return
    const userCats = prefs?.categories ?? []
    const counts = {}
    for (const issue of issues) {
      if (userCats.length > 0 && !userCats.includes(issue.category)) continue
      counts[issue.category] = (counts[issue.category] || 0) + 1
    }
    setTopics(
      Object.entries(counts)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))
    )
  }, [issues, prefs])

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
    supabase.from("action_clicks").select("issue_slug").gte("clicked_at", since)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        for (const row of data) counts[row.issue_slug] = (counts[row.issue_slug] || 0) + 1
        setActionCounts(counts)
      }).catch(() => {})
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => { setShowRest(false); setExpandedSlug(null) }, [cat, selectedCats])

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    const el = actionCardsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

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
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from("user_actions")
              .delete()
              .eq("user_id", user.id)
              .eq("issue_slug", issueSlug)
              .eq("action_index", actionIndex)
              .catch(() => {})
          }
        })
      } else {
        next.add(key)
        try {
          const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
          if (!stored.includes(key)) { stored.push(key); localStorage.setItem("completedActions", JSON.stringify(stored)) }
        } catch {}
        supabase.from("action_clicks").insert({ issue_slug: issueSlug, action_index: actionIndex, clicked_at: new Date().toISOString() })
          .then(() => { setActionCounts(prev => ({ ...prev, [issueSlug]: (prev[issueSlug] || 0) + 1 })) })
          .catch(() => {})
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from("user_actions").upsert(
              { user_id: user.id, issue_slug: issueSlug, action_index: actionIndex, completed_at: new Date().toISOString() },
              { onConflict: "user_id,issue_slug,action_index" }
            ).catch(() => {})
          }
        })
      }
      return next
    })
  }, [])

  if (loading) return <div style={{ background: "#0B1120", minHeight: "100vh" }} />

  const userCats = prefs?.categories || []

  const cutoff = parseDate(new Date(Date.now() - 30 * 24 * 3600 * 1000)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" }))
  const byImpact = arr => [...arr].sort((a, b) => {
    const aR = parseDate(a.date) >= cutoff
    const bR = parseDate(b.date) >= cutoff
    if (aR !== bR) return aR ? -1 : 1
    return b.severity_score - a.severity_score
  })

  // "home" = personalized landing (one per saved topic)
  // specific category = that topic's list
  // "All" = everything sorted
  const isHome = cat === "home" && selectedCats.length === 0
  const pool   = selectedCats.length > 0
               ? issues.filter(i => selectedCats.includes(i.category))
               : cat === "home" ? issues.filter(i => userCats.includes(i.category))
               : issues

  let featured, smallA, smallB
  if (isHome && userCats.length >= 3) {
    featured = byImpact(issues.filter(i => i.category === userCats[0]))[0]
    smallA   = byImpact(issues.filter(i => i.category === userCats[1]))[0]
    smallB   = byImpact(issues.filter(i => i.category === userCats[2]))[0]
  } else if (isHome && userCats.length === 2) {
    const c1 = byImpact(issues.filter(i => i.category === userCats[0]))
    const c2 = byImpact(issues.filter(i => i.category === userCats[1]))
    featured = c1[0]; smallA = c1[1]; smallB = c2[0]
  } else {
    const top = byImpact(pool)
    featured = top[0]; smallA = top[1]; smallB = top[2]
  }

  const usedSlugs    = new Set([featured, smallA, smallB].filter(Boolean).map(i => i.slug))
  const expandIssues = byImpact(pool).filter(i => !usedSlugs.has(i.slug)).slice(0, 27)

  const since7 = Date.now() - 7 * 24 * 3600 * 1000
  const critWeekCount = issues.filter(i =>
    i.severity_score >= 8 && i.created_at && new Date(i.created_at).getTime() >= since7
  ).length

  const visibleActionCards = ACTION_CARDS

  const filterBtnStyle = (active) => ({
    background: "none", border: "none", cursor: "pointer",
    padding: "4px 0",
    fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? "#F5F1E8" : "#64748b",
    textDecoration: active ? "underline" : "none",
    textDecorationColor: "rgba(255,255,255,0.35)",
    textUnderlineOffset: "5px",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
    letterSpacing: "0.01em",
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#EDE9E0" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(17,24,39,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#F5F1E8", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
            <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 400 }}>Track. Act. Organize.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/profile" style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa", textDecoration: "none" }}>⚡ My Impact</Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login" }}
              style={{
                fontSize: 12, fontWeight: 600, color: "#fff",
                background: "#ef4444", border: "none", cursor: "pointer",
                padding: "7px 14px", borderRadius: 4,
              }}
            >Sign out</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: "relative", background: "linear-gradient(160deg, #1a2236 0%, #0B1120 100%)" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.35,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div style={{
          position: "absolute", top: -60, left: "25%",
          width: 600, height: 400,
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "48px 32px 32px" }}>

          {/* Static headline */}
          <h1 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(48px, 7vw, 96px)",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            margin: "0 0 14px",
            color: "#F5F1E8",
          }}>Act Now.</h1>

          {/* Ticker — secondary status line */}
          <div style={{ marginBottom: 28 }}>
            <TickerLine
              topics={topics}
              critWeekCount={critWeekCount}
              activeCat={cat}
              catCounts={catCounts}
            />
          </div>

          {/* Filter row: Home · Topic1 · Topic2 · Topic3 → All Issues  |  dropdown */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
              {["home", ...userCats].map((c, i) => (
                <span key={c} style={{ display: "inline-flex", alignItems: "center" }}>
                  {i > 0 && (
                    <span style={{ color: "#475569", padding: "0 8px", userSelect: "none", fontSize: 14 }}>·</span>
                  )}
                  <button onClick={() => setCat(c)} style={filterBtnStyle(cat === c)}>
                    {c === "home" ? "Home" : c}
                  </button>
                </span>
              ))}
            </div>

            {/* Multi-select category dropdown */}
            <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: selectedCats.length > 0 ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                  border: selectedCats.length > 0 ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6, padding: "6px 12px", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  color: selectedCats.length > 0 ? "#93c5fd" : "#64748b",
                  transition: "all 0.15s",
                }}
              >
                {selectedCats.length > 0 ? `${selectedCats.length} topic${selectedCats.length > 1 ? "s" : ""} selected` : "Filter topics"}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 200,
                  background: "#111827", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "8px 0", minWidth: 220,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                }}>
                  <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
                    <button
                      onClick={() => { setSelectedCats([]); setDropdownOpen(false) }}
                      style={{
                        flex: 1, textAlign: "left", padding: "8px 16px",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, color: "#60a5fa",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                      }}
                    >
                      Show all issues
                    </button>
                    {selectedCats.length > 0 && (
                      <button
                        onClick={() => setSelectedCats([])}
                        style={{
                          textAlign: "right", padding: "8px 16px",
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 11, fontWeight: 700, color: "#6b7280",
                          letterSpacing: "0.06em", textTransform: "uppercase",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {CAT_ORDER.filter(c => c !== "All").map(c => {
                    const checked = selectedCats.includes(c)
                    const toggle = () => setSelectedCats(prev =>
                      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                    )
                    return (
                      <div
                        key={c}
                        onClick={toggle}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "9px 16px", cursor: "pointer",
                          background: checked ? "rgba(59,130,246,0.08)" : "transparent",
                          transition: "background 0.1s",
                        }}
                      >
                        <div style={{
                          width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                          background: checked ? "#3b82f6" : "transparent",
                          border: checked ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                          {checked && (
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: 13, color: checked ? "#F5F1E8" : "#94a3b8", fontWeight: checked ? 600 : 400 }}>
                          {c}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section header */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px 0", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: "#475569",
          letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap",
        }}>What&apos;s Happening This Week</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Issue cards */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 48px" }}>

        {featured && (
          <IssueCard issue={featured} weekCount={actionCounts[featured.slug] || 0} />
        )}

        {(smallA || smallB) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {smallA && (
              <div style={{ paddingRight: 32, borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                <IssueCard issue={smallA} weekCount={actionCounts[smallA.slug] || 0} />
              </div>
            )}
            {smallB && (
              <div style={{ paddingRight: 32, paddingLeft: 32 }}>
                <IssueCard issue={smallB} weekCount={actionCounts[smallB.slug] || 0} />
              </div>
            )}
          </div>
        )}

        {expandIssues.length > 0 && (
          <div>
            <button
              onClick={() => setShowRest(o => !o)}
              style={{
                width: "100%", height: 44,
                background: "none", border: "none",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                color: "#4b5563", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                transition: "color 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
                style={{ transition: "transform 0.3s ease", transform: showRest ? "rotate(180deg)" : "rotate(0deg)" }}>
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {showRest ? "Show less" : `${expandIssues.length} more issues`}
            </button>
            {showRest && (
              <div>
                {expandIssues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} weekCount={actionCounts[issue.slug] || 0} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action cards — below the feed */}
      <div ref={actionCardsRef} style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#475569",
            letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>Take Action</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="action-grid" style={{
          display: "grid",
          gridTemplateColumns: `repeat(${visibleActionCards.length}, 1fr)`,
          gap: 16,
        }}>
          {visibleActionCards.map((card, i) => (
            <ActionCard key={i} card={card} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#060C18" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#1f2937", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>How Bad Is It?</span>
          <p style={{ fontSize: 11, color: "#1f2937", margin: 0, maxWidth: 500, textAlign: "right", lineHeight: 1.7 }}>
            Impact ratings are editorial assessments based on institutional impact, scope, reversibility, and legal precedent. Not affiliated with any political party. Always verify with primary sources.
          </p>
        </div>
      </div>

      {/* Sticky action bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(17,24,39,0.97)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px",
        opacity: stickyVisible ? 1 : 0,
        pointerEvents: stickyVisible ? "auto" : "none",
        transition: "opacity 0.3s ease",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "stretch",
          height: 56,
        }}>
          {ACTION_CARDS.map((card, i) => (
            <Link
              key={i}
              href={card.link}
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                textDecoration: "none",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{typeof card.icon === "string" ? card.icon : "🗺️"}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap" }}>{card.headline}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer so content isn't hidden behind sticky bar */}
      <div style={{ height: 56 }} />

      <style>{`
        ::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) {
          .action-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .action-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
