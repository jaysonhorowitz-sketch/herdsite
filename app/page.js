"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { CAT_COLOR } from "@/lib/colors"
import { ANIMAL_MAP, DEFAULT_ANIMAL } from "@/lib/animals"

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
  "All", "Executive Power", "Rule of Law", "Economy", "Civil Rights", "Elections",
  "National Security", "Healthcare", "Environment", "Education", "Science",
  "Immigration", "Democracy & Media", "Foreign Policy", "Human Rights",
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

  const ACCENT = "#15803d"

  // Static: a specific topic is selected via filter
  if (activeCat !== "All" && activeCat !== "home") {
    const catColor = CAT_COLOR[activeCat] || "#6B7C6C"
    const count = catCounts[activeCat] ?? 0
    return (
      <div style={baseStyle}>
        <span className="sev-pulse" style={{ "--c": ACCENT }} />
        <span>Now showing: <strong style={{ color: "#6B7C6C", fontWeight: 600 }}>{count}</strong> issues in <strong style={{ color: catColor, fontWeight: 600 }}>{activeCat}</strong></span>
      </div>
    )
  }

  // Fallback: no user topics onboarded
  if (topics.length === 0) {
    return (
      <div style={baseStyle}>
        <span className="sev-pulse" style={{ "--c": ACCENT }} />
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
        <span className="sev-pulse" style={{ "--c": ACCENT }} />
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
      <span className="sev-pulse" style={{ "--c": ACCENT }} />
      <span style={{ whiteSpace: "nowrap" }}>
        Now showing:{" "}
        <strong style={{ color: "#6B7C6C", fontWeight: 600, opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", display: "inline-block", width: "2.5em", textAlign: "right" }}>{count}</strong>
        {" "}issues in{" "}
        <strong style={{ color: catColor, fontWeight: 600, opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", display: "inline-block", width: "155px" }}>{current?.name}</strong>
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
        <span style={{ flexShrink: 0, lineHeight: 1, fontSize: 22, filter: "none" }}>{card.icon}</span>
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
        fontSize: 12, fontWeight: 600, color: "#15803d",
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
function FeedCard({ issue, weekCount, isArchived, onArchive, onCatClick, followActionCount }) {
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
          borderTop: `2px solid ${catColor}`,
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
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#5A6B5B",
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

        {/* Social proof */}
        {followActionCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>👥</span>
            <span style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600 }}>
              {followActionCount} {followActionCount === 1 ? "person" : "people"} you follow took action
            </span>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 14 }} />

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span className="sev-pulse" style={{ "--c": tier.color }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6B5B" }}>
              {tier.label}
            </span>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 12px", borderRadius: 6,
            background: "#15803d",
            border: "1px solid #15803d",
            color: "#ffffff", fontSize: 10, fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}>Take Action →</span>
        </div>
      </Link>
    </div>
  )
}

// ─── Animal emoji lookup ──────────────────────────────────────────────────────
function animalEmoji(animalType) {
  if (!animalType) return DEFAULT_ANIMAL.emoji
  const entry = ANIMAL_MAP.find(a => a.animal === animalType)
  return entry ? entry.emoji : DEFAULT_ANIMAL.emoji
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── ActivityItem ─────────────────────────────────────────────────────────────
function ActivityItem({ activity, hasClapped, clapCount, onClap }) {
  const user = activity.user_prefs || {}
  const emoji = animalEmoji(user.animal_type)
  const name = user.display_name || (user.username ? `@${user.username}` : "Someone")
  const handle = user.username ? `@${user.username}` : null
  const [hovRow, setHovRow]   = useState(false)
  const [pressing, setPressing] = useState(false)
  const profileHref = user.username ? `/profile/${user.username}` : null

  const verb = activity.activity_type === "saved_issue" ? "saved"
    : activity.activity_type === "completed_action" ? "took action on"
    : "interacted with"

  return (
    <div
      onMouseEnter={() => setHovRow(true)}
      onMouseLeave={() => setHovRow(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 10px", margin: "0 -10px",
        borderBottom: "1px solid rgba(0,0,0,0.055)",
        borderRadius: 8,
        background: hovRow ? "rgba(0,0,0,0.025)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Avatar */}
      {profileHref ? (
        <Link href={profileHref} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", background: "rgba(21,128,61,0.09)", border: "1.5px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none", transition: "border-color 0.15s", boxShadow: hovRow ? "0 0 0 3px rgba(21,128,61,0.08)" : "none" }}>{emoji}</Link>
      ) : (
        <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", background: "rgba(21,128,61,0.09)", border: "1.5px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{emoji}</div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "#1C2E1E" }}>
          {profileHref ? (
            <Link href={profileHref} style={{ fontWeight: 700, color: "#1C2E1E", textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
            >{name}</Link>
          ) : <strong>{name}</strong>}
          {handle && <span style={{ color: "#A8B5A9", fontWeight: 400, marginLeft: 5, fontSize: 12 }}>{handle}</span>}
        </div>
        <div style={{ fontSize: 13, color: "#6B7C6C", lineHeight: 1.5, marginTop: 1 }}>
          {verb}{" "}
          {activity.issue_slug && activity.issue_title ? (
            <Link href={`/issue/${activity.issue_slug}`}
              style={{ color: "#15803d", fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
            >{activity.issue_title}</Link>
          ) : <span>an issue</span>}
        </div>
        <div style={{ fontSize: 11, color: "#A8B5A9", marginTop: 4, letterSpacing: "0.01em" }}>
          {timeAgo(activity.created_at)}
        </div>
      </div>

      {/* Clap */}
      <button
        onClick={() => onClap?.(activity.id)}
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
        style={{
          flexShrink: 0, alignSelf: "center",
          background: hasClapped ? "rgba(21,128,61,0.1)" : "transparent",
          border: hasClapped ? "1px solid rgba(21,128,61,0.25)" : "1px solid transparent",
          borderRadius: 20, cursor: "pointer",
          padding: "5px 10px", minWidth: 44, minHeight: 44,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          transform: pressing ? "scale(0.92)" : "scale(1)",
          transition: "transform 0.1s, background 0.15s, border-color 0.15s",
        }}
        title="Clap"
      >
        <span style={{ fontSize: 16, display: "block", transition: "transform 0.15s", transform: hasClapped ? "rotate(-10deg)" : "none" }}>👏</span>
        {clapCount > 0 && (
          <span style={{ fontSize: 12, color: hasClapped ? "#15803d" : "#9CAD9C", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{clapCount}</span>
        )}
      </button>
    </div>
  )
}

// ─── UserCard ─────────────────────────────────────────────────────────────────
function UserCard({ user, isFollowing, isPending, onToggle, commonTopics }) {
  const [hov, setHov] = useState(false)
  const emoji   = animalEmoji(user.animal_type)
  const href    = user.username ? `/profile/${user.username}` : null
  const nameEl  = user.display_name || user.username

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
        background: "#fff", borderRadius: 14, marginBottom: 8,
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: hov ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
    >
      {href ? (
        <Link href={href} style={{ flexShrink: 0, width: 48, height: 48, borderRadius: "50%", background: "rgba(21,128,61,0.08)", border: "1.5px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, textDecoration: "none" }}>{emoji}</Link>
      ) : (
        <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: "50%", background: "rgba(21,128,61,0.08)", border: "1.5px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{emoji}</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {href ? (
          <Link href={href} style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E", lineHeight: 1.3, textDecoration: "none", display: "block" }}>{nameEl}</Link>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E", lineHeight: 1.3 }}>{nameEl}</div>
        )}
        {user.username && (
          <div style={{ fontSize: 12, color: "#A8B5A9", marginTop: 1 }}>@{user.username}</div>
        )}
        {commonTopics > 0 ? (
          <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600, marginTop: 4 }}>
            {commonTopics} topic{commonTopics !== 1 ? "s" : ""} in common
          </div>
        ) : user.categories?.length > 0 && (
          <div style={{ fontSize: 11, color: "#6B7C6C", marginTop: 4 }}>
            {user.categories.slice(0, 2).join(" · ")}
          </div>
        )}
      </div>

      <button
        onClick={() => onToggle(user.user_id, user.is_private)}
        style={{
          flexShrink: 0, padding: "8px 18px", borderRadius: 20,
          fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
          minHeight: 36,
          ...(isFollowing
            ? { background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", color: "#15803d" }
            : isPending
            ? { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.12)", color: "#6B7C6C" }
            : { background: "#15803d", border: "1px solid #15803d", color: "#fff" }),
        }}
      >
        {isFollowing ? "Following" : isPending ? "Requested" : "Follow"}
      </button>
    </div>
  )
}

// ─── Skeleton feed row ────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.055)" }}>
      <div className="skeleton" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
        <div className="skeleton" style={{ height: 13, width: "40%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 13, width: "70%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 11, width: "20%", borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── NetworkTab ───────────────────────────────────────────────────────────────
function NetworkTab({ userId, userCategories }) {
  const [search,        setSearch]        = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [feed,          setFeed]          = useState([])
  const [following,     setFollowing]     = useState(new Set())
  const [pending,       setPending]       = useState(new Set())
  const [loadingFeed,   setLoadingFeed]   = useState(true)
  const [searching,     setSearching]     = useState(false)
  const [clapMap,       setClapMap]       = useState({ mySet: new Set(), countMap: {} })
  const [suggested,     setSuggested]     = useState([])
  const searchRef = useRef(null)

  // Load who current user follows
  useEffect(() => {
    if (!userId) { setLoadingFeed(false); return }
    supabase.from("follows")
      .select("following_id, status")
      .eq("follower_id", userId)
      .then(({ data }) => {
        if (data) {
          setFollowing(new Set(data.filter(f => f.status === "accepted").map(f => f.following_id)))
          setPending(new Set(data.filter(f => f.status === "pending").map(f => f.following_id)))
        }
        setLoadingFeed(false)
      })
  }, [userId])

  // Load activity feed from followed users
  useEffect(() => {
    if (!userId || following.size === 0) return
    supabase.from("user_activity")
      .select("id, user_id, activity_type, issue_slug, issue_title, created_at, user_prefs(display_name, username, animal_type)")
      .in("user_id", [...following])
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => setFeed(data || []))
  }, [userId, following])

  // Load clap counts + whether current user clapped
  useEffect(() => {
    if (!feed.length || !userId) return
    const ids = feed.map(f => f.id)
    Promise.all([
      supabase.from("activity_likes").select("activity_id").in("activity_id", ids).eq("user_id", userId),
      supabase.from("activity_likes").select("activity_id").in("activity_id", ids),
    ]).then(([mine, all]) => {
      const mySet = new Set((mine.data || []).map(l => l.activity_id))
      const countMap = {}
      for (const l of (all.data || [])) countMap[l.activity_id] = (countMap[l.activity_id] || 0) + 1
      setClapMap({ mySet, countMap })
    })
  }, [feed, userId])

  // Load suggested users (people with similar categories not yet followed)
  useEffect(() => {
    if (!userId || !userCategories?.length) return
    supabase.from("user_prefs")
      .select("user_id, display_name, username, animal_type, categories, is_private")
      .neq("user_id", userId)
      .limit(40)
      .then(({ data }) => {
        if (!data) return
        const scored = data
          .filter(u => u.username) // only show users with a username
          .map(u => {
            const overlap = (u.categories || []).filter(c => userCategories.includes(c)).length
            return { ...u, overlap }
          })
          .filter(u => u.overlap > 0)
          .sort((a, b) => b.overlap - a.overlap)
          .slice(0, 5)
        setSuggested(scored)
      })
  }, [userId, userCategories])

  // Debounced search — supports username, name, and 5-digit zip
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const q = search.trim()
      const isZip = /^\d{5}$/.test(q)
      let query = supabase.from("user_prefs")
        .select("user_id, display_name, username, animal_type, categories, is_private")
        .neq("user_id", userId || "00000000-0000-0000-0000-000000000000")
        .limit(10)

      if (isZip) {
        query = query.eq("zip_code", q)
      } else {
        query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      }

      const { data } = await query
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search, userId])

  async function toggleFollow(targetId, isPrivate) {
    if (following.has(targetId) || pending.has(targetId)) {
      await supabase.from("follows").delete()
        .eq("follower_id", userId).eq("following_id", targetId)
      setFollowing(p => { const s = new Set(p); s.delete(targetId); return s })
      setPending(p => { const s = new Set(p); s.delete(targetId); return s })
    } else {
      const status = isPrivate ? "pending" : "accepted"
      await supabase.from("follows").insert({ follower_id: userId, following_id: targetId, status })
      if (status === "accepted") setFollowing(p => new Set([...p, targetId]))
      else setPending(p => new Set([...p, targetId]))
    }
  }

  async function handleClap(activityId) {
    if (!userId) return
    const hasClapped = clapMap.mySet.has(activityId)
    if (hasClapped) {
      await supabase.from("activity_likes").delete().eq("user_id", userId).eq("activity_id", activityId)
      setClapMap(prev => ({
        mySet: new Set([...prev.mySet].filter(id => id !== activityId)),
        countMap: { ...prev.countMap, [activityId]: Math.max(0, (prev.countMap[activityId] || 1) - 1) },
      }))
    } else {
      await supabase.from("activity_likes").insert({ user_id: userId, activity_id: activityId })
      setClapMap(prev => ({
        mySet: new Set([...prev.mySet, activityId]),
        countMap: { ...prev.countMap, [activityId]: (prev.countMap[activityId] || 0) + 1 },
      }))
    }
  }

  const showSearch = search.trim().length > 0

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 32px 120px" }}>
      {/* Search bar */}
      <div style={{ marginBottom: 20, position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CAD9C", fontSize: 14, pointerEvents: "none" }}>🔍</span>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by username or name…"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 36px 12px 40px",
            fontSize: 14, color: "#1C2E1E",
            background: "#fff", border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 12, outline: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(21,128,61,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(21,128,61,0.08)" }}
          onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)" }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CAD9C", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>
            ×
          </button>
        )}
      </div>

      {/* Search results */}
      {showSearch && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C" }}>
              {searching ? "Searching…" : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
            </div>
            {/^\d{5}$/.test(search.trim()) && (
              <div style={{ fontSize: 11, fontWeight: 600, color: "#15803d", background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.2)", padding: "3px 10px", borderRadius: 20 }}>
                📍 By zip code
              </div>
            )}
          </div>
          {searching && [1,2].map(i => <SkeletonRow key={i} />)}
          {!searching && searchResults.map(user => (
            <UserCard key={user.user_id} user={user}
              isFollowing={following.has(user.user_id)}
              isPending={pending.has(user.user_id)}
              onToggle={toggleFollow}
            />
          ))}
          {!searching && searchResults.length === 0 && (
            <p style={{ color: "#6B7C6C", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              No users found for &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Feed / empty state */}
      {!showSearch && (
        loadingFeed ? (
          <div>
            {[1,2,3].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : following.size === 0 ? (
          <div>
            <div style={{ textAlign: "center", padding: "40px 20px 28px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🦌</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1C2E1E", margin: "0 0 8px", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                Find your herd
              </h3>
              <p style={{ fontSize: 14, color: "#6B7C6C", lineHeight: 1.65, margin: "0 0 20px", maxWidth: 300, marginInline: "auto" }}>
                Follow others who share your issues to see their actions here.
              </p>
              <button
                onClick={() => searchRef.current?.focus()}
                style={{ padding: "10px 24px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: "#15803d", color: "#fff", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#166534"}
                onMouseLeave={e => e.currentTarget.style.background = "#15803d"}
              >Search for people →</button>
            </div>

            {suggested.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 10 }}>
                  Suggested for you
                </div>
                {suggested.map(user => (
                  <UserCard
                    key={user.user_id}
                    user={user}
                    isFollowing={following.has(user.user_id)}
                    isPending={pending.has(user.user_id)}
                    onToggle={toggleFollow}
                    commonTopics={user.overlap || 0}
                  />
                ))}
              </div>
            )}
          </div>
        ) : feed.length === 0 ? (
          <div>
            <div style={{ padding: "32px 0 24px", textAlign: "center", color: "#9CAD9C", fontSize: 13 }}>
              No recent activity from people you follow yet.
            </div>
            {suggested.filter(u => !following.has(u.user_id)).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 10 }}>
                  More people to follow
                </div>
                {suggested.filter(u => !following.has(u.user_id)).map(user => (
                  <UserCard key={user.user_id} user={user}
                    isFollowing={false} isPending={pending.has(user.user_id)}
                    onToggle={toggleFollow}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          feed.map(activity => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              hasClapped={clapMap.mySet.has(activity.id)}
              clapCount={clapMap.countMap[activity.id] || 0}
              onClap={handleClap}
            />
          ))
        )
      )}
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
  const [selectedCats,      setSelectedCats]      = useState([])
  const [accountOpen,       setAccountOpen]       = useState(false)
  const [showMore,          setShowMore]          = useState(false)
  const [activeTab,         setActiveTab]         = useState("feed")
  const [userId,            setUserId]            = useState(null)
  const [hasNewActivity,    setHasNewActivity]    = useState(false)
  const [notifOpen,         setNotifOpen]         = useState(false)
  const [notifCount,        setNotifCount]        = useState(0)
  const [notifItems,        setNotifItems]        = useState([])
  const [socialProof,       setSocialProof]       = useState({})
  const accountRef     = useRef(null)
  const notifRef       = useRef(null)

  useEffect(() => {
    async function loadPrefs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const onboardingComplete = localStorage.getItem("onboardingComplete")
        if (!onboardingComplete) {
          window.location.href = "/login"
          return
        }
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

      setUserId(user.id)

      // Load notifications (new followers + likes since last check)
      const lastNotifCheck = localStorage.getItem("lastNotifCheck") || new Date(0).toISOString()
      const [newFollowsRes, newLikesRes] = await Promise.all([
        supabase.from("follows")
          .select("follower_id, created_at")
          .eq("following_id", user.id)
          .eq("status", "accepted")
          .gt("created_at", lastNotifCheck)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("activity_likes")
          .select("created_at, activity_id")
          .eq("activity_id", user.id)
          .gt("created_at", lastNotifCheck)
          .limit(10),
      ])
      const followerIds = (newFollowsRes.data || []).map(f => f.follower_id)
      let followerProfiles = []
      if (followerIds.length) {
        const { data: fp } = await supabase.from("user_prefs")
          .select("user_id, display_name, username, animal_type")
          .in("user_id", followerIds)
        followerProfiles = fp || []
      }
      const notifs = (newFollowsRes.data || []).map(f => {
        const p = followerProfiles.find(x => x.user_id === f.follower_id)
        return { type: "follow", name: p?.display_name || p?.username || "Someone", username: p?.username, created_at: f.created_at }
      })
      setNotifCount(notifs.length)
      setNotifItems(notifs)

      // Check for new network activity since last visit
      const lastCheck = localStorage.getItem("lastNetworkCheck")
      if (lastCheck) {
        supabase.from("follows").select("following_id").eq("follower_id", user.id).eq("status", "accepted")
          .then(({ data: follows }) => {
            if (follows?.length) {
              supabase.from("user_activity")
                .select("id")
                .in("user_id", follows.map(f => f.following_id))
                .gt("created_at", lastCheck)
                .limit(1)
                .then(({ data: newActs }) => { if (newActs?.length) setHasNewActivity(true) })
            }
          })
      } else {
        setHasNewActivity(true)
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
      if (data.categories?.length) setSelectedCats(data.categories)
      if (data.zip_code) localStorage.setItem("userZipCode", data.zip_code)
      setLoading(false)
    }
    loadPrefs()
  }, [])

  useEffect(() => {
    supabase.from("issues").select("*").eq("is_published", true)
      .then(({ data }) => { if (data) setIssues(data) })
  }, [])

  // Social proof: count how many followed users took action on each issue
  useEffect(() => {
    if (!userId) return
    async function loadSocialProof() {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId)
        .eq("status", "accepted")
      if (!follows?.length) return
      const ids = follows.map(f => f.following_id)
      const { data: acts } = await supabase
        .from("user_activity")
        .select("issue_slug")
        .in("user_id", ids)
        .eq("activity_type", "completed_action")
        .not("issue_slug", "is", null)
      if (!acts?.length) return
      const map = {}
      for (const a of acts) {
        if (a.issue_slug) map[a.issue_slug] = (map[a.issue_slug] || 0) + 1
      }
      setSocialProof(map)
    }
    loadSocialProof()
  }, [userId])

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
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
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
            // Log to activity feed
            const issue = issues.find(i => i.slug === issueSlug)
            supabase.from("user_activity").insert({
              user_id: user.id,
              activity_type: "completed_action",
              issue_slug: issueSlug,
              issue_title: issue?.title || null,
              created_at: new Date().toISOString(),
            }).catch(() => {})
          }
        })
      }
      return next
    })
  }, [])

  const toggleArchive = useCallback((slug) => {
    setArchivedSlugs(prev => {
      const next = new Set(prev)
      const adding = !prev.has(slug)
      if (adding) { next.add(slug) } else { next.delete(slug) }
      try { localStorage.setItem("archivedIssues", JSON.stringify([...next])) } catch {}
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        if (adding) {
          const issue = issues.find(i => i.slug === slug)
          supabase.from("user_activity").insert({
            user_id: user.id,
            activity_type: "saved_issue",
            issue_slug: slug,
            issue_title: issue?.title || null,
            created_at: new Date().toISOString(),
          }).catch(() => {})
        } else {
          supabase.from("user_activity")
            .delete()
            .eq("user_id", user.id)
            .eq("activity_type", "saved_issue")
            .eq("issue_slug", slug)
            .catch(() => {})
        }
      })
      return next
    })
  }, [issues])

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
              fontSize: 12, fontWeight: 700, color: "#15803d",
              background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)",
              textDecoration: "none", padding: "7px 16px", borderRadius: 6,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(22,163,74,0.18)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(22,163,74,0.1)" }}
            >My Impact</Link>

            {/* Notification bell */}
            {userId && (
              <div ref={notifRef} style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setNotifOpen(v => !v)
                    if (!notifOpen) {
                      localStorage.setItem("lastNotifCheck", new Date().toISOString())
                      setNotifCount(0)
                    }
                  }}
                  style={{
                    position: "relative", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                  aria-label="Notifications"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A5C4B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {notifCount > 0 && (
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      background: "#ef4444", color: "#fff", borderRadius: "50%",
                      width: 16, height: 16, fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #F4F0E6",
                    }}>{notifCount > 9 ? "9+" : notifCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "#E8E4D8", border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 12, minWidth: 280, maxWidth: 320,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 100,
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1C2E1E" }}>Notifications</span>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      {notifItems.length === 0 ? (
                        <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "#9CAD9C" }}>
                          You&rsquo;re all caught up!
                        </div>
                      ) : notifItems.map((n, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "12px 16px", borderBottom: i < notifItems.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                        }}>
                          <div style={{ fontSize: 20, flexShrink: 0 }}>👤</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1C2E1E" }}>
                              {n.username
                                ? <Link href={`/profile/${n.username}`} style={{ color: "#15803d", textDecoration: "none" }} onClick={() => setNotifOpen(false)}>{n.name}</Link>
                                : n.name}
                            </span>
                            <span style={{ fontSize: 13, color: "#6B7C6C" }}> started following you</span>
                            <div style={{ fontSize: 11, color: "#A8B5A9", marginTop: 2 }}>{timeAgo(n.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                <Link href="/settings" onClick={() => setAccountOpen(false)}
                  style={{
                    display: "block", padding: "9px 14px", borderRadius: 7,
                    fontSize: 13, fontWeight: 600, color: "#2A3E2C",
                    textDecoration: "none", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >Settings</Link>
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

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "14px 32px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#4A5C4B", marginBottom: 4 }}>
            Civic Intelligence Feed
          </div>
          <div style={{ marginBottom: 6 }}>
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
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(244,240,230,0.97)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { id: "feed", label: "What's Happening" },
              { id: "network", label: "Network" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id === "network") {
                    setHasNewActivity(false)
                    localStorage.setItem("lastNetworkCheck", new Date().toISOString())
                  }
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "12px 16px", fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? "#1C2E1E" : "#6B7C6C",
                  borderBottom: activeTab === tab.id ? "2px solid #15803d" : "2px solid transparent",
                  marginBottom: -1, transition: "color 0.15s, border-color 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
                {tab.id === "network" && hasNewActivity && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", flexShrink: 0, display: "inline-block" }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter strip — feed tab only */}
      {activeTab === "feed" && (() => {
        const personalizedCats = CAT_ORDER.filter(c => c !== "All" && userCats.includes(c))
        const otherCats = CAT_ORDER.filter(c => c !== "All" && !userCats.includes(c))
        const allCats = showMore ? [...personalizedCats, ...otherCats] : personalizedCats

        const pillStyle = (active, color) => ({
          flexShrink: 0,
          padding: "5px 14px",
          minHeight: 32,
          borderRadius: 20,
          border: active ? `1px solid ${color}` : "1px solid rgba(0,0,0,0.09)",
          background: active ? `rgba(${hexToRgb(color)},0.18)` : "transparent",
          color: active ? "#1C2E1E" : "#6B7C6C",
          fontSize: 11, fontWeight: active ? 700 : 500,
          cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        })

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
                    style={pillStyle(active, color)}
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
              <div className="ticker-wrap" style={{ marginLeft: "auto", flexShrink: 0, alignSelf: "center", display: "flex", whiteSpace: "nowrap" }}>
                <TickerLine
                  topics={topics}
                  critWeekCount={critWeekCount}
                  activeCat={cat}
                  catCounts={catCounts}
                />
              </div>
            </div>
          </div>
        )
      })()}

      {activeTab === "feed" ? (
        <>
          {/* Section sub-header */}
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px 10px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
            <span style={{ fontSize: 11, color: "#6B7C6C", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              <strong style={{ color: "#3A4B3B" }}>{feedIssues.length}</strong> issues
            </span>
          </div>

          {/* Feed grid */}
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
                  followActionCount={socialProof[issue.slug] || 0}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Network tab */
        <NetworkTab userId={userId} userCategories={userCats} />
      )}

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
              <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, filter: "saturate(0.7)" }}>{card.icon}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E", letterSpacing: "-0.01em" }}>{card.headline}</span>
                <span style={{ fontSize: 11, color: "#6B7C6C", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.body}</span>
              </div>
              <span style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#15803d",
                background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)",
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
        @media (max-width: 860px) { .ticker-wrap { display: none !important; } }

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
          .skeleton { animation: none; }
          * { transition-duration: 0.01ms !important; }
        }

        /* Skeleton shimmer */
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #E0DCD0 25%, #EAE6DA 50%, #E0DCD0 75%);
          background-size: 800px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }

        /* Focus-visible rings */
        button:focus-visible, a:focus-visible {
          outline: 2px solid #15803d;
          outline-offset: 2px;
          border-radius: 4px;
        }
        button:focus:not(:focus-visible), a:focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>
    </div>
  )
}
