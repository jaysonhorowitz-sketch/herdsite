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
  if (e === "2 min")  return { bg: "#143820", color: "#7dd3fc", border: "#1e40af" }
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
    icon: "🌳",
    headline: "Explore Nonprofits",
    body: "Discover vetted organizations working on the issues you care about.",
    link: "/actions/donate",
  },
  {
    icon: "📍",
    headline: "Get Involved",
    body: "Events, actions, and opportunities near you.",
    link: "/actions/events",
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
    fontSize: 14, fontWeight: 400, color: "#5A6B5B",
    letterSpacing: "0.01em",
  }

  const ACCENT = "#16a34a"

  // Static: a specific topic is selected via filter
  if (activeCat !== "All" && activeCat !== "home") {
    const catColor = CAT_COLOR[activeCat] || "#6B7C6C"
    const count = catCounts[activeCat] ?? 0
    return (
      <div style={baseStyle}>
        <span style={{ color: ACCENT, fontSize: 9 }}>●</span>
        <span>Now showing: <strong style={{ color: "#6B7C6C", fontWeight: 600 }}>{count}</strong> issues in <strong style={{ color: catColor, fontWeight: 600 }}>{activeCat}</strong></span>
      </div>
    )
  }

  // Fallback: no user topics onboarded
  if (topics.length === 0) {
    return (
      <div style={baseStyle}>
        <span style={{ color: ACCENT, fontSize: 9 }}>●</span>
        <span>Now showing: <strong style={{ color: "#6B7C6C", fontWeight: 600 }}>{critWeekCount}</strong> critical issues this week</span>
      </div>
    )
  }

  // Single topic
  if (topics.length === 1) {
    const catColor = CAT_COLOR[topics[0].name] || "#6B7C6C"
    const count = catCounts[topics[0].name] ?? 0
    return (
      <div style={baseStyle}>
        <span style={{ color: ACCENT, fontSize: 9 }}>●</span>
        <span>Now showing: <strong style={{ color: "#6B7C6C", fontWeight: 600 }}>{count}</strong> issues in <strong style={{ color: catColor, fontWeight: 600 }}>{topics[0].name}</strong></span>
      </div>
    )
  }

  // Multi-topic rotation — only number + category fade, frame stays static
  const current  = topics[idx % topics.length]
  const catColor = CAT_COLOR[current?.name] || "#6B7C6C"
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
        <strong style={{ color: "#6B7C6C", fontWeight: 600, opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", display: "inline-block" }}>{count}</strong>
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
        background: hovered ? "#D8D4C6" : "#FDFAF3",
        border: "1px solid rgba(0,0,0,0.08)",
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
          fontSize: 14, fontWeight: 700, color: "#1C2E1E",
          lineHeight: 1.4, margin: 0,
        }}>{card.headline}</p>
      </div>

      {/* Body */}
      <p style={{
        fontSize: 12, color: "#5A6B5B", lineHeight: 1.6,
        margin: "0 0 16px", flex: 1,
      }}>{card.body}</p>

      {/* CTA */}
      <p style={{
        fontSize: 12, fontWeight: 600, color: "#16a34a",
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
  return             { label: "worth watching", color: "#6B7C6C", bar: "rgba(100,116,139,0.6)"  }
}

// ─── FeedCard ─────────────────────────────────────────────────────────────────
function FeedCard({ issue, weekCount, isArchived, onArchive, onCatClick }) {
  const tier     = severityTier(issue.severity_score)
  const catColor = CAT_COLOR[issue.category] || "#6B7C6C"
  const rgb      = hexToRgb(catColor)
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {/* Archive bookmark */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onArchive(issue.slug) }}
        style={{
          position: "absolute", top: 16, right: 16, zIndex: 2,
          background: isArchived ? `rgba(${rgb},0.12)` : "none",
          border: "none", cursor: "pointer",
          color: isArchived ? catColor : "#C5BFB0",
          fontSize: 15, padding: "4px 5px", lineHeight: 1,
          transition: "color 0.15s, background 0.15s",
          borderRadius: 4,
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
          display: "flex", flexDirection: "column",
          height: "100%", minHeight: 220,
          background: hovered ? "#FDFAF3" : "#fff",
          borderRadius: 16,
          borderTop: `3px solid ${catColor}`,
          borderRight: `1px solid ${hovered ? `rgba(${rgb},0.25)` : "rgba(0,0,0,0.07)"}`,
          borderBottom: `1px solid ${hovered ? `rgba(${rgb},0.25)` : "rgba(0,0,0,0.07)"}`,
          borderLeft: `1px solid ${hovered ? `rgba(${rgb},0.25)` : "rgba(0,0,0,0.07)"}`,
          boxShadow: hovered
            ? `0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(${rgb},0.12)`
            : "0 2px 8px rgba(0,0,0,0.05)",
          padding: "20px 20px 18px",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s, background 0.2s",
        }}
      >
        {/* Top: category + date */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingRight: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: catColor, flexShrink: 0 }} />
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
              color: catColor,
            }}>
              {issue.category}
            </span>
          </div>
          <span style={{ fontSize: 10, color: "#A8B5A9", fontWeight: 500, letterSpacing: "0.02em" }}>{issue.date}</span>
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: 17, fontWeight: 800, margin: "0 0 12px", color: "#1a2e1c",
          lineHeight: 1.35, letterSpacing: "-0.02em",
          fontFamily: "var(--font-fraunces), Georgia, serif",
          flex: "0 0 auto",
        }}>
          {issue.title}
        </h2>

        {/* Description */}
        <p style={{
          color: "#5A6B5B", fontSize: 13, lineHeight: 1.65,
          margin: "0 0 16px", flex: 1,
        }}>
          {issue.description}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 14 }} />

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span className="sev-pulse" style={{ "--c": tier.color }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tier.color }}>
              {tier.label}
            </span>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 12px", borderRadius: 6,
            background: `rgba(${rgb},0.1)`,
            border: `1px solid rgba(${rgb},0.25)`,
            color: catColor, fontSize: 10, fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
            transition: "background 0.15s",
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
  const [accountOpen,   setAccountOpen]   = useState(false)
  const [showMore,      setShowMore]      = useState(false)
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

  // Load category click history — Supabase for logged-in users, localStorage for guests
  useEffect(() => {
    async function loadClicks() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("user_prefs")
          .select("cat_clicks")
          .eq("user_id", user.id)
          .maybeSingle()
        if (data?.cat_clicks) {
          setCatClicks(data.cat_clicks)
          return
        }
      }
      // Fall back to localStorage for guests
      try {
        const stored = JSON.parse(localStorage.getItem("catClicks") || "{}")
        setCatClicks(stored)
      } catch {}
    }
    loadClicks()
  }, [])

  const recordCatClick = useCallback((category) => {
    setCatClicks(prev => {
      const next = { ...prev, [category]: (prev[category] || 0) + 1 }
      // Always persist locally
      try { localStorage.setItem("catClicks", JSON.stringify(next)) } catch {}
      // If logged in, sync to Supabase
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from("user_prefs")
            .update({ cat_clicks: next })
            .eq("user_id", user.id)
            .catch(() => {})
        }
      })
      return next
    })
  }, [])

  if (loading) return <div style={{ background: "#F4F0E6", minHeight: "100vh" }} />

  const userCats = prefs?.categories || []

  // Feed pool — filtered by current pill/dropdown state
  const pool = selectedCats.length > 0
               ? issues.filter(i => selectedCats.includes(i.category))
               : cat === "home" ? issues.filter(i => userCats.includes(i.category))
               : issues.filter(i => i.category === cat)

  const isHome = cat === "home" || selectedCats.length > 0

  let feedIssues

  if (isHome) {
    // ── Home / multi-filter: blended score + interleave (no back-to-back category) ──
    const maxClicks = Math.max(1, ...Object.values(catClicks))
    const poolDates = pool.map(i => parseDate(i.date))
    const minDate   = poolDates.length ? Math.min(...poolDates) : 0
    const dateRange = Math.max(1, (poolDates.length ? Math.max(...poolDates) : 1) - minDate)

    // Per-category severity ranges so each topic competes on equal footing
    const catSevBounds = {}
    pool.forEach(i => {
      if (!catSevBounds[i.category]) catSevBounds[i.category] = { min: i.severity_score, max: i.severity_score }
      if (i.severity_score > catSevBounds[i.category].max) catSevBounds[i.category].max = i.severity_score
      if (i.severity_score < catSevBounds[i.category].min) catSevBounds[i.category].min = i.severity_score
    })

    function blendScore(issue) {
      const affinity  = (catClicks[issue.category] || 0) / maxClicks
      const bounds    = catSevBounds[issue.category] || { min: 1, max: 10 }
      const sevRange  = Math.max(1, bounds.max - bounds.min)
      const severity  = (issue.severity_score - bounds.min) / sevRange  // relative within category
      const recency   = (parseDate(issue.date) - minDate) / dateRange
      // Weights: recency 50%, severity 30%, affinity 20%
      return (recency * 0.5) + (severity * 0.3) + (affinity * 0.2)
    }

    const scored = [...pool].sort((a, b) => blendScore(b) - blendScore(a))

    // Cap each category so no topic dominates the feed
    const uniqueCats = [...new Set(pool.map(i => i.category))]
    const perCatCap  = Math.max(2, Math.ceil(scored.length / uniqueCats.length))
    const catSeen    = {}
    const capped     = scored.filter(i => {
      catSeen[i.category] = (catSeen[i.category] || 0) + 1
      return catSeen[i.category] <= perCatCap
    })

    // Interleave: never place two issues from the same category back to back
    const interleaved = []
    const remaining   = [...capped]
    let lastCat       = null

    while (remaining.length > 0) {
      const idx = remaining.findIndex(i => i.category !== lastCat)
      if (idx === -1) { interleaved.push(...remaining); break }
      interleaved.push(remaining[idx])
      lastCat = remaining[idx].category
      remaining.splice(idx, 1)
    }

    feedIssues = interleaved
  } else {
    // ── Single category pill: newest first, severity breaks ties ──
    feedIssues = [...pool].sort((a, b) => {
      const dateDiff = parseDate(b.date) - parseDate(a.date)
      if (dateDiff !== 0) return dateDiff
      return b.severity_score - a.severity_score
    })
  }

  const since7 = Date.now() - 7 * 24 * 3600 * 1000
  const critWeekCount = issues.filter(i =>
    i.severity_score >= 8 && i.created_at && new Date(i.created_at).getTime() >= since7
  ).length

  const visibleActionCards = ACTION_CARDS

  const filterBtnStyle = (active) => ({
    background: "none", border: "none", cursor: "pointer",
    padding: "4px 0",
    fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? "#1C2E1E" : "#5A6B5B",
    textDecorationLine: active ? "underline" : "none",
    textDecorationColor: "rgba(255,255,255,0.35)",
    textUnderlineOffset: "5px",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
    letterSpacing: "0.01em",
  })

  return (
    <div style={{ minHeight: "100vh", background: "#F4F0E6", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#1C2E1E" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(244,240,230,0.97)" : "rgba(244,240,230,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="6" r="2.5" fill="white" opacity="0.9"/>
                  <circle cx="4" cy="10" r="2" fill="white" opacity="0.7"/>
                  <circle cx="12" cy="10" r="2" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
            </div>
            <div style={{ width: 1, height: 16, background: "rgba(0,0,0,0.12)" }} />
            <span style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 500, letterSpacing: "0.04em" }}>Civic Intelligence</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/profile" style={{
              fontSize: 12, fontWeight: 700, color: "#16a34a",
              background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)",
              textDecoration: "none", padding: "7px 16px", borderRadius: 6,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(22,163,74,0.18)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(22,163,74,0.1)" }}
            >My Impact</Link>
          <div ref={accountRef} style={{ position: "relative" }}>
            <button
              onClick={() => setAccountOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: accountOpen ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 8, padding: "7px 12px",
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = accountOpen ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4A5C4B" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {accountOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#E8E4D8", border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 10, padding: "6px", minWidth: 160,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100,
              }}>
                {[
                  { label: "My Impact", href: "/profile" },
                  { label: "Archive",   href: "/archive" },
                ].map(item => (
                  <Link key={item.label} href={item.href} onClick={() => setAccountOpen(false)}
                    style={{
                      display: "block", padding: "9px 14px", borderRadius: 7,
                      fontSize: 13, fontWeight: 600, color: "#2A3E2C",
                      textDecoration: "none", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >{item.label}</Link>
                ))}
                <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "4px 0" }} />
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
      <div style={{ position: "relative", background: "#F4F0E6" }}>
        {/* Decorative layer — clipped separately so it doesn't cut the dropdown */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #15803d 0%, #16a34a 40%, #4ade80 100%)" }} />
          <div style={{
            position: "absolute", top: -120, right: -80,
            width: 500, height: 500,
            background: "radial-gradient(ellipse at center, rgba(22,163,74,0.08) 0%, transparent 65%)",
          }} />
        </div>

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "28px 32px 12px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#4A5C4B", marginBottom: 8 }}>
              Civic Intelligence Feed
            </div>
            <h1 style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              margin: 0,
              color: "#1C2E1E",
            }}>Act<br/><span style={{ color: "#15803d" }}>Now.</span></h1>
          </div>

          {/* Ticker — secondary status line */}
          <div style={{ marginBottom: 12 }}>
            <TickerLine
              topics={topics}
              critWeekCount={critWeekCount}
              activeCat={cat}
              catCounts={catCounts}
            />
          </div>

        </div>
      </div>

      {/* Category filter strip */}
      {(() => {
        const personalizedCats = CAT_ORDER.filter(c => c !== "All" && userCats.includes(c))
        const otherCats = CAT_ORDER.filter(c => c !== "All" && !userCats.includes(c))
        const allCats = showMore ? [...personalizedCats, ...otherCats] : personalizedCats

        const pillStyle = (active, color, isAll) => ({
          flexShrink: 0,
          padding: "5px 14px",
          minHeight: 32,
          borderRadius: 20,
          border: active
            ? `1px solid ${isAll ? "rgba(0,0,0,0.2)" : color}`
            : "1px solid rgba(0,0,0,0.09)",
          background: active
            ? isAll ? "rgba(0,0,0,0.06)" : `rgba(${hexToRgb(color)},0.1)`
            : "transparent",
          color: active ? (isAll ? "#1C2E1E" : color) : "#6B7C6C",
          fontSize: 11, fontWeight: active ? 700 : 500,
          cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        })

        const allActive = selectedCats.length === 0 && (cat === "home" || !userCats.includes(cat) === false)
        const allSelected = selectedCats.length === CAT_ORDER.filter(c => c !== "All").length

        return (
          <div style={{
            position: "sticky", top: 56, zIndex: 40,
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            background: "rgba(244,240,230,0.97)",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{
              maxWidth: 1200, margin: "0 auto", padding: "8px 32px",
              display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            }}>
              {/* All */}
              <button
                onClick={() => { setSelectedCats([]); setCat("home") }}
                style={pillStyle(allActive, "#6B7C6C", true)}
              >All</button>

              {/* Personalized + expanded cats */}
              {allCats.map(c => {
                const active = selectedCats.includes(c)
                const color = CAT_COLOR[c] || "#6B7C6C"
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedCats(prev =>
                        prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                      )
                      setCat("home")
                    }}
                    style={pillStyle(active, color, false)}
                  >{c}</button>
                )
              })}

              {/* Select All — only visible when expanded */}
              {showMore && <button
                onClick={() => {
                  if (allSelected) {
                    setSelectedCats([])
                  } else {
                    setSelectedCats(CAT_ORDER.filter(c => c !== "All"))
                    setCat("home")
                    setShowMore(true)
                  }
                }}
                className="pill-ctrl"
                style={{
                  flexShrink: 0, padding: "5px 14px", minHeight: 32, borderRadius: 20,
                  border: allSelected ? "1px solid rgba(21,128,61,0.4)" : "1px solid rgba(0,0,0,0.09)",
                  background: allSelected ? "rgba(21,128,61,0.08)" : "transparent",
                  color: allSelected ? "#15803d" : "#6B7C6C",
                  fontSize: 11, fontWeight: allSelected ? 700 : 500,
                  cursor: "pointer", letterSpacing: "0.02em",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                {allSelected ? "✓ All selected" : "Select all"}
              </button>}

              {/* More / Less expander — sits right of Select all */}
              {otherCats.length > 0 && (
                <button
                  onClick={() => setShowMore(v => !v)}
                  className="pill-ctrl"
                  style={{
                    flexShrink: 0, padding: "5px 14px", minHeight: 32, borderRadius: 20,
                    border: "1px solid rgba(0,0,0,0.09)",
                    background: showMore ? "rgba(0,0,0,0.06)" : "transparent",
                    color: "#6B7C6C", fontSize: 11, fontWeight: 500,
                    cursor: "pointer", letterSpacing: "0.02em",
                    transition: "all 0.15s", whiteSpace: "nowrap",
                  }}
                >
                  {showMore ? "Less ▴" : `+${otherCats.length} more ▾`}
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Section header */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px 10px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 16, background: "#15803d", borderRadius: 2 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#2A3E2C", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            What&apos;s Happening
          </span>
        </div>
        <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
        <span style={{ fontSize: 11, color: "#6B7C6C", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          <strong style={{ color: "#3A4B3B" }}>{feedIssues.length}</strong> issues
        </span>
      </div>

      {/* Flat feed */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 40px" }}>
        {feedIssues.length === 0 && (
          <p style={{ color: "#4A5C4B", fontSize: 14, padding: "40px 0", textAlign: "center" }}>No issues match your current filter.</p>
        )}
        <div className="feed-grid" style={{ alignItems: "stretch" }}>
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
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#EAE6DA" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="6" r="2.5" fill="white" opacity="0.9"/>
                <circle cx="4" cy="10" r="2" fill="white" opacity="0.7"/>
                <circle cx="12" cy="10" r="2" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <span style={{ fontSize: 11, color: "#3A4B3B", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Herd</span>
          </div>
          <p style={{ fontSize: 11, color: "#5A6B5B", margin: 0, maxWidth: 520, textAlign: "right", lineHeight: 1.7 }}>
            Impact ratings are editorial assessments based on institutional impact, scope, reversibility, and legal precedent. Not affiliated with any political party. Always verify with primary sources.
          </p>
        </div>
      </div>

      {/* Sticky action bar — always visible */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(248,245,238,0.98)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(0,0,0,0.09)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "stretch", height: 80 }}>
          {ACTION_CARDS.map((card, i) => (
            <Link
              key={i}
              href={card.link}
              style={{
                flex: 1,
                display: "flex", alignItems: "center", gap: 14,
                textDecoration: "none",
                borderLeft: i > 0 ? "1px solid rgba(0,0,0,0.07)" : "none",
                padding: "0 32px",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(21,128,61,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, filter: "grayscale(0.6) saturate(0.6)" }}>{card.icon}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E", letterSpacing: "-0.01em" }}>{card.headline}</span>
                <span style={{ fontSize: 11, color: "#6B7C6C", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.body}</span>
              </div>
              <span style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#15803d",
                background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.2)",
                padding: "4px 10px", borderRadius: 20, letterSpacing: "0.02em",
              }}>Go →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer so content isn't hidden behind sticky bar */}
      <div style={{ height: 80 }} />

      <style>{`
        ::-webkit-scrollbar { display: none; }

        .feed-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media (min-width: 1080px) {
          .feed-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .feed-grid { grid-template-columns: 1fr; }
        }

        .pill-ctrl:hover { background: rgba(0,0,0,0.05) !important; }

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
        @media (prefers-reduced-motion: reduce) {
          .sev-pulse::after { animation: none; }
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}
