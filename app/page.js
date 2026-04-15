"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { CAT_COLOR } from "@/lib/colors"

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


function catSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

// ─── Hardcoded action cards data ───────────────────────────────────────────────
const ACTION_CARDS = [
  {
    icon: "📞",
    headline: "Call your representatives",
    body: "Find your senators and house rep, with a script for the issues you care about.",
    cta: "→ Get started",
    link: "/actions/call",
  },
  {
    icon: <span style={{ filter: "grayscale(0.6)", fontSize: 20, lineHeight: 1 }}>🌳</span>,
    headline: "Explore nonprofits",
    body: "Discover vetted organizations working on the issues you care about.",
    cta: "→ Browse causes",
    link: "/actions/donate",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ),
    headline: "Get Involved",
    body: "Events, actions, and opportunities near you.",
    cta: "→ Find events",
    link: "/actions/events",
  },
  {
    icon: "📰",
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
      {/* Icon + headline on one row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ flexShrink: 0, lineHeight: 1 }}>{card.icon}</span>
        <p style={{
          fontSize: 14, fontWeight: 700, color: "#F5F1E8",
          lineHeight: 1.4, margin: 0,
        }}>{card.headline}</p>
      </div>

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

// ─── FeedCard ─────────────────────────────────────────────────────────────────
function FeedCard({ issue, weekCount, isArchived, onArchive, onCatClick }) {
  const tier     = severityTier(issue.severity_score)
  const catColor = CAT_COLOR[issue.category] || "#94a3b8"
  const rgb      = hexToRgb(catColor)
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {/* Archive bookmark */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onArchive(issue.slug) }}
        style={{
          position: "absolute", top: 14, right: 14, zIndex: 2,
          background: "none", border: "none", cursor: "pointer",
          color: isArchived ? catColor : "rgba(255,255,255,0.18)",
          fontSize: 16, padding: 4, lineHeight: 1,
          transition: "color 0.15s",
        }}
        title={isArchived ? "Remove from archive" : "Save to archive"}
      >{isArchived ? "★" : "☆"}</button>

      <Link
        href={"/issue/" + issue.slug}
        onClick={() => onCatClick(issue.category)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          textDecoration: "none", color: "inherit",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          height: 280,
          background: hovered ? `rgba(${rgb},0.11)` : `rgba(${rgb},0.06)`,
          border: `1px solid rgba(${rgb},${hovered ? 0.3 : 0.16})`,
          borderRadius: 16,
          padding: "24px 44px 22px 24px",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        {/* Top: category + date */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: catColor }}>
            {issue.category}
          </span>
          <span style={{ fontSize: 10, color: "rgba(245,241,232,0.25)" }}>{issue.date}</span>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px", color: "#F5F1E8", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
          {issue.title}
        </h2>

        {/* Description */}
        <p style={{ color: "rgba(245,241,232,0.62)", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {issue.description}
        </p>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="sev-pulse" style={{ "--c": tier.color }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: tier.color }}>
              {tier.label}
            </span>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "5px 12px", borderRadius: 6,
            background: `rgba(${rgb},0.14)`,
            border: `1px solid rgba(${rgb},0.32)`,
            color: catColor, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>Take Action →</span>
        </div>
      </Link>
    </div>
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
  const [actionCounts,  setActionCounts]  = useState({})
  const [completedKeys, setCompletedKeys] = useState(new Set())
  const [archivedSlugs, setArchivedSlugs] = useState(new Set())
  const [catClicks,     setCatClicks]     = useState({})
  const [selectedCats,  setSelectedCats]  = useState([])
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const [accountOpen,   setAccountOpen]   = useState(false)
  const dropdownRef    = useRef(null)
  const accountRef     = useRef(null)

  useEffect(() => {
    async function loadPrefs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const onboardingComplete = localStorage.getItem("onboardingComplete")
        if (!onboardingComplete) {
          window.location.href = "/login"
          return
        }
        // Guest who finished onboarding — load prefs from localStorage
        try {
          const raw = localStorage.getItem("howbadisite_prefs")
          const parsed = raw ? JSON.parse(raw) : {}
          setPrefs({ categories: parsed.categories || [], actionPref: parsed.actionPref || null })
        } catch {
          setPrefs({ categories: [], actionPref: null })
        }
        setLoading(false)
        return
      }

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

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("archivedIssues") || "[]")
      setArchivedSlugs(new Set(stored))
    } catch {}
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
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

  const toggleArchive = useCallback((slug) => {
    setArchivedSlugs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) { next.delete(slug) } else { next.add(slug) }
      try { localStorage.setItem("archivedIssues", JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  // Load category click history once on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("catClicks") || "{}")
      setCatClicks(stored)
    } catch {}
  }, [])

  const recordCatClick = useCallback((category) => {
    setCatClicks(prev => {
      const next = { ...prev, [category]: (prev[category] || 0) + 1 }
      try { localStorage.setItem("catClicks", JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  if (loading) return <div style={{ background: "#0B1120", minHeight: "100vh" }} />

  const userCats = prefs?.categories || []

  // Feed pool — filtered by current pill/dropdown state
  const pool = selectedCats.length > 0
               ? issues.filter(i => selectedCats.includes(i.category))
               : cat === "home" ? issues.filter(i => userCats.includes(i.category))
               : issues.filter(i => i.category === cat)

  // Blended feed score: equal weight of topic affinity, severity, recency
  const maxClicks  = Math.max(1, ...Object.values(catClicks))
  const poolDates  = pool.map(i => parseDate(i.date))
  const minDate    = poolDates.length ? Math.min(...poolDates) : 0
  const dateRange  = Math.max(1, (poolDates.length ? Math.max(...poolDates) : 1) - minDate)

  function blendScore(issue) {
    const affinity = (catClicks[issue.category] || 0) / maxClicks
    const severity = (issue.severity_score - 1) / 9
    const recency  = (parseDate(issue.date) - minDate) / dateRange
    return (affinity + severity + recency) / 3
  }

  const feedIssues = [...pool].sort((a, b) => blendScore(b) - blendScore(a))

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
    textDecorationLine: active ? "underline" : "none",
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/profile" style={{
              fontSize: 12, fontWeight: 700, color: "#60a5fa",
              background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)",
              textDecoration: "none", padding: "7px 16px", borderRadius: 6,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(96,165,250,0.18)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(96,165,250,0.1)" }}
            >My Impact</Link>
          <div ref={accountRef} style={{ position: "relative" }}>
            <button
              onClick={() => setAccountOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: accountOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "7px 12px",
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = accountOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {accountOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "6px", minWidth: 160,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100,
              }}>
                {[
                  { label: "My Impact", href: "/profile" },
                  { label: "Archive",   href: "/archive" },
                ].map(item => (
                  <Link key={item.label} href={item.href} onClick={() => setAccountOpen(false)}
                    style={{
                      display: "block", padding: "9px 14px", borderRadius: 7,
                      fontSize: 13, fontWeight: 600, color: "#e2e8f0",
                      textDecoration: "none", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >{item.label}</Link>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login" }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "9px 14px", borderRadius: 7, border: "none",
                    fontSize: 13, fontWeight: 600, color: "#f87171",
                    background: "transparent", cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >Sign Out</button>
              </div>
            )}
          </div>
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

          {/* Filter row: Home | Topic1 · Topic2 · Topic3  |  All Issues dropdown */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
              {/* Home button */}
              <button onClick={() => setCat("home")} style={filterBtnStyle(cat === "home")}>
                Home
              </button>
              {/* Vertical divider — visually groups topics under Home */}
              {userCats.length > 0 && (
                <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)", margin: "0 12px", display: "inline-block", flexShrink: 0 }} />
              )}
              {/* Topic buttons */}
              {userCats.map((c, i) => (
                <span key={c} style={{ display: "inline-flex", alignItems: "center" }}>
                  {i > 0 && (
                    <span style={{ color: "#475569", padding: "0 8px", userSelect: "none", fontSize: 14 }}>·</span>
                  )}
                  <button onClick={() => { setCat(c); setSelectedCats([]) }} style={filterBtnStyle(cat === c && selectedCats.length === 0)}>
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
                  color: selectedCats.length > 0 ? "#93c5fd" : "#e2e8f0",
                  transition: "all 0.15s",
                }}
              >
                {selectedCats.length > 0 ? `${selectedCats.length} topic${selectedCats.length > 1 ? "s" : ""} selected` : "All Issues"}
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
                      onClick={() => setSelectedCats(CAT_ORDER.filter(c => c !== "All"))}
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
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px 12px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          What&apos;s Happening
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>{feedIssues.length} issues</span>
      </div>

      {/* Flat feed */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 80px" }}>
        {feedIssues.length === 0 && (
          <p style={{ color: "#4b5563", fontSize: 14, padding: "40px 0", textAlign: "center" }}>No issues match your current filter.</p>
        )}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}>
          {feedIssues.map(issue => (
            <FeedCard
              key={issue.id}
              issue={issue}
              weekCount={actionCounts[issue.slug] || 0}
              isArchived={archivedSlugs.has(issue.slug)}
              onArchive={toggleArchive}
              onCatClick={recordCatClick}
            />
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

      {/* Sticky action bar — always visible */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(17,24,39,0.97)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "stretch",
          height: 68,
        }}>
          {ACTION_CARDS.map((card, i) => (
            <Link
              key={i}
              href={card.link}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                textDecoration: "none",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                padding: "0 12px",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{typeof card.icon === "string" ? card.icon : "🗺️"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>{card.headline}</span>
              <span style={{ fontSize: 11, color: "#475569", textAlign: "center", lineHeight: 1.4 }}>{card.body}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer so content isn't hidden behind sticky bar */}
      <div style={{ height: 68 }} />

      <style>{`
        ::-webkit-scrollbar { display: none; }
        @keyframes sev-pulse {
          0%   { transform: scale(1);   opacity: 1; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .sev-pulse {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--c);
          flex-shrink: 0;
          position: relative;
        }
        .sev-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: var(--c);
          animation: sev-pulse 1.8s ease-out infinite;
        }
      `}</style>
    </div>
  )
}
