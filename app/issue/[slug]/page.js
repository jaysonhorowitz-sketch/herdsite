"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import Link from "next/link"
import { useParams } from "next/navigation"

// ─── Utilities ────────────────────────────────────────────────────────────────

function getSev(score) {
  if (score <= 3) return { accent: "#22c55e", label: "Notable"    }
  if (score <= 6) return { accent: "#eab308", label: "Significant" }
  if (score <= 8) return { accent: "#f97316", label: "Major"      }
  return                 { accent: "#ef4444", label: "Critical"   }
}

function effortConfig(effort) {
  if (effort === "2 min")  return { color: "#67e8f9", bg: "rgba(14,116,144,0.15)",  border: "rgba(103,232,249,0.2)" }
  if (effort === "20 min") return { color: "#c4b5fd", bg: "rgba(124,58,237,0.15)",  border: "rgba(196,181,253,0.2)" }
  return                          { color: "#5eead4", bg: "rgba(15,118,110,0.15)",  border: "rgba(94,234,212,0.2)"  }
}

function partyColor(p) {
  if (p === "R") return { bg: "rgba(239,68,68,0.12)",  text: "#f87171",  border: "rgba(239,68,68,0.2)"  }
  if (p === "D") return { bg: "rgba(59,130,246,0.12)", text: "#60a5fa",  border: "rgba(59,130,246,0.2)" }
  return               { bg: "rgba(168,85,247,0.12)", text: "#c084fc",  border: "rgba(168,85,247,0.2)" }
}

function oddsColor(n) {
  if (n >= 70) return { text: "#4ade80", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)"  }
  if (n >= 45) return { text: "#facc15", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.2)"  }
  return             { text: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)"  }
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player }) {
  const [odds,        setOdds]        = useState(null)
  const [oddsLoading, setOddsLoading] = useState(!!player.kalshi_ticker)
  const [expanded,    setExpanded]    = useState(false)

  const pc = partyColor(player.party)
  const photoUrl = player.bioguide_id
    ? `https://bioguide.congress.gov/bioguide/photo/${player.bioguide_id[0]}/${player.bioguide_id}.jpg`
    : null

  useEffect(() => {
    if (!player.kalshi_ticker) return
    fetch(`/api/kalshi/${player.kalshi_ticker}`)
      .then(r => r.json())
      .then(d => { if (d.odds !== undefined) setOdds(d.odds) })
      .catch(() => {})
      .finally(() => setOddsLoading(false))
  }, [player.kalshi_ticker])

  const oc = odds !== null ? oddsColor(odds) : null

  return (
    <div style={{
      background: "#1a2236",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px" }}>

        {/* Photo */}
        <div style={{
          width: 52, height: 52, borderRadius: 10, flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style="font-size:22px">👤</span>` }}
            />
          ) : (
            <span style={{ fontSize: 22 }}>👤</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>{player.name}</span>
            {/* Party badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2px 7px", borderRadius: 4,
              background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
            }}>{player.party}</span>
            {/* Kalshi odds badge */}
            {oddsLoading && (
              <span style={{ fontSize: 10, color: "#374151", fontStyle: "italic" }}>loading odds…</span>
            )}
            {!oddsLoading && odds !== null && oc && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "3px 9px", borderRadius: 99,
                background: oc.bg, color: oc.text, border: `1px solid ${oc.border}`,
              }}>
                {odds}% re-election · Kalshi
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 3, lineHeight: 1.4 }}>{player.role}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#374151" }}>
              {player.state} · {player.chamber}
            </span>
            {player.next_election && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: player.next_election <= 2026 ? "#fb923c" : "#6b7280",
              }}>
                Up for election: {player.next_election}
                {player.next_election <= 2026 && " ⚡"}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6, padding: "4px 8px", cursor: "pointer", flexShrink: 0,
            color: "#4b5563", fontSize: 11, fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          {expanded ? "Less ↑" : "More ↓"}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 18px",
          display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          {player.contact_url && (
            <a
              href={player.contact_url}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              ✉ Contact office
            </a>
          )}
          {player.bioguide_id && (
            <a
              href={`https://www.congress.gov/member/${player.name.toLowerCase().replace(/\s+/g, "-")}/${player.bioguide_id}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#60a5fa",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.15)",
                textDecoration: "none",
              }}
            >
              Congress.gov ↗
            </a>
          )}
          {player.opensecrets_id && (
            <a
              href={`https://www.opensecrets.org/members-of-congress/summary?cid=${player.opensecrets_id}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#a78bfa",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.15)",
                textDecoration: "none",
              }}
            >
              OpenSecrets ↗
            </a>
          )}
          {player.kalshi_ticker && odds !== null && (
            <a
              href={`https://kalshi.com/markets/${player.kalshi_ticker}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#4ade80",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.15)",
                textDecoration: "none",
              }}
            >
              Kalshi market ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function SiteHeader() {
  return (
    <header style={{
      background: "rgba(17,24,39,0.95)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>→ Politics & Governance</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/profile" style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa", textDecoration: "none", letterSpacing: "0.02em" }}>
            My Impact
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            All issues
          </Link>
        </div>
      </div>
    </header>
  )
}

function LoadingScreen() {
  return (
    <div style={{ background: "#111827", minHeight: "100vh" }}>
      <SiteHeader />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 120, gap: 10, color: "#374151" }}>
        <svg style={{ animation: "spin 1s linear infinite", width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
          <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span style={{ fontSize: 14 }}>Loading…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div style={{ background: "#111827", minHeight: "100vh" }}>
      <SiteHeader />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 80, fontWeight: 900, color: "#1f2937", margin: "0 0 16px" }}>404</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: "#d1d5db", marginBottom: 8 }}>Issue not found</p>
        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 32 }}>This issue may have been removed or the URL is incorrect.</p>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#ef4444", color: "white", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          ← Back to all issues
        </Link>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function categoryKey(cat) {
  return "category-" + (cat || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function relativeTime(iso) {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return "just now"
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function IssuePage() {
  const params            = useParams()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [news,       setNews]       = useState([])
  const [nonprofits,    setNonprofits]    = useState([])
  const [npoLoading,    setNpoLoading]    = useState(false)
  const [completedKeys, setCompletedKeys] = useState(new Set())

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
      setCompletedKeys(new Set(stored.map(a => `${a.issueSlug}::${a.actionText}`)))
    } catch {}
  }, [])

  useEffect(() => {
    supabase.from("issues").select("*").eq("slug", params.slug).eq("is_published", true).single()
      .then(({ data }) => { if (data) setIssue(data); setLoading(false) })
  }, [params.slug])

  function markDone(actionText) {
    const key = `${params.slug}::${actionText}`
    setCompletedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        try {
          const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
          localStorage.setItem("completedActions", JSON.stringify(stored.filter(a => !(a.issueSlug === params.slug && a.actionText === actionText))))
        } catch {}
      } else {
        next.add(key)
        try {
          const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
          stored.push({ issueSlug: params.slug, issueTitle: issue?.title || params.slug, actionText, timestamp: Date.now() })
          localStorage.setItem("completedActions", JSON.stringify(stored))
        } catch {}
      }
      return next
    })
  }

  useEffect(() => {
    if (!issue?.category) return
    supabase.from("news_cache").select("articles").eq("issue_slug", categoryKey(issue.category)).single()
      .then(({ data }) => { if (data?.articles) setNews(data.articles.slice(0, 5)) })
  }, [issue?.category])

  useEffect(() => {
    if (!issue?.title) return
    const apiKey = process.env.NEXT_PUBLIC_EVERYORG_API_KEY
    if (!apiKey) return
    setNpoLoading(true)
    fetch(`https://partners.every.org/v0.2/search/${encodeURIComponent(issue.title)}?apiKey=${apiKey}&take=3`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const orgs = (data.nonprofits || []).slice(0, 3)
        setNonprofits(orgs)
      })
      .catch(() => {})
      .finally(() => setNpoLoading(false))
  }, [issue?.title])

  if (loading) return <LoadingScreen />
  if (!issue)  return <NotFoundScreen />

  const sev        = getSev(issue.severity_score)
  const hasActions = issue.actions?.length > 0
  const hasSources = issue.sources?.length > 0
  const hasPlayers = issue.players?.length > 0

  // Light-mode section styles
  const S = {
    background: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "22px 24px",
    marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  }
  const SH = {
    fontSize: 10, fontWeight: 700, color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
    margin: "0 0 16px",
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Dark header section */}
      <div style={{ background: "#111827", color: "#e2e8f0" }}>
        <SiteHeader />

        {/* Dark hero with title + score */}
        <div style={{ background: "linear-gradient(160deg, #1a2236 0%, #111827 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: sev.accent, background: sev.accent + "18",
                padding: "4px 10px", borderRadius: 5, border: `1px solid ${sev.accent}30`,
              }}>{issue.category}</span>
              {issue.date && <span style={{ fontSize: 12, color: "#4b5563" }}>{issue.date}</span>}
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
              <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, flex: 1 }}>
                {issue.title}
              </h1>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 14,
                  background: sev.accent + "18",
                  border: `2px solid ${sev.accent}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 900, color: sev.accent, letterSpacing: "-0.03em",
                }}>{issue.severity_score}</div>
                <div style={{ fontSize: 9, color: "#4b5563", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{sev.label}</div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginTop: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 4, overflow: "hidden" }}>
                <div style={{ width: `${issue.severity_score * 10}%`, height: "100%", background: sev.accent, borderRadius: 99, opacity: 0.8 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "#374151" }}>Low</span>
                <span style={{ fontSize: 10, color: "#374151" }}>Critical</span>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", width: "100%", marginBottom: -2 }}>
            <path d="M0 40 L0 20 Q360 0 720 20 Q1080 40 1440 20 L1440 40 Z" fill="#f4f5f7"/>
          </svg>
        </div>
      </div>

      {/* Light content section */}
      <div style={{ background: "#f4f5f7" }}>
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "20px 24px 80px" }}>

          {/* ── What is happening ── */}
          <div style={S}>
            <p style={SH}>What Is Happening</p>
            <p style={{ color: "#374151", lineHeight: 1.75, fontSize: 15, margin: 0 }}>{issue.description}</p>
          </div>

          {/* ── Key Players ── */}
          {hasPlayers && (
            <div style={S}>
              <p style={SH}>Key Players</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {issue.players.map((player, i) => (
                  <PlayerCard key={i} player={player} />
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
                ⚡ = up for election in 2026 · Re-election odds sourced from Kalshi prediction markets · Contact links go directly to official government pages
              </p>
            </div>
          )}

          {/* ── What you can do ── */}
          {hasActions && (
            <div style={S}>
              <p style={SH}>What You Can Do</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {issue.actions.map((action, i) => {
                  const ef   = effortConfig(action.effort)
                  const done = completedKeys.has(`${params.slug}::${action.text}`)
                  const rowStyle = {
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderRadius: 10, cursor: "pointer", textDecoration: "none",
                    border:     `1px solid ${done ? "#86efac" : "#e5e7eb"}`,
                    background: done ? "#f0fdf4" : "#fafafa",
                    transition: "all 0.2s",
                  }
                  const inner = (
                    <>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "4px 9px", borderRadius: 5, flexShrink: 0,
                        color: done ? "#16a34a" : ef.color,
                        background: done ? "#dcfce7" : ef.bg,
                        border: `1px solid ${done ? "#86efac" : ef.border}`,
                      }}>{action.effort}</span>
                      <span style={{ fontSize: 14, color: done ? "#9ca3af" : "#374151", lineHeight: 1.5, flex: 1,
                        textDecoration: done ? "line-through" : "none" }}>
                        {action.text}
                      </span>
                      {done ? (
                        <span style={{ fontSize: 16, flexShrink: 0, color: "#16a34a" }}>✓</span>
                      ) : action.url ? (
                        <svg style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                        </svg>
                      ) : null}
                    </>
                  )
                  return action.url && !done ? (
                    <a key={i} href={action.url} target="_blank" rel="noopener noreferrer"
                      style={rowStyle} onClick={() => markDone(action.text)}>{inner}</a>
                  ) : (
                    <div key={i} style={rowStyle} onClick={() => markDone(action.text)}>{inner}</div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Sources ── */}
          {hasSources && (
            <div style={S}>
              <p style={SH}>Sources</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {issue.sources.map((src, i) => (
                  <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg style={{ width: 12, height: 12, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                    </svg>
                    {src.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Latest News ── */}
          {news.length > 0 && (
            <div style={S}>
              <p style={SH}>Latest News</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {news.map((article, i) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block", textDecoration: "none", padding: "11px 0",
                      borderBottom: i < news.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#374151", lineHeight: 1.45,
                      marginBottom: 4, transition: "color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#111827"}
                      onMouseLeave={e => e.currentTarget.style.color = "#374151"}>
                      {article.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{article.source}</span>
                      <span style={{ fontSize: 11, color: "#d1d5db" }}>·</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{relativeTime(article.publishedAt)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Organizations Taking Action ── */}
          {(npoLoading || nonprofits.length > 0) && (
            <div style={S}>
              <p style={SH}>Organizations Taking Action</p>
              {npoLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 }}>
                  <svg style={{ animation: "spin 1s linear infinite", width: 14, height: 14 }} fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {nonprofits.map((org, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                      padding: "14px 16px", borderRadius: 10,
                      background: "#fafafa",
                      border: "1px solid #e5e7eb",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                          {org.name}
                        </div>
                        {org.description && (
                          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                            {org.description.length > 100 ? org.description.slice(0, 100) + "…" : org.description}
                          </div>
                        )}
                      </div>
                      <a
                        href={`https://www.every.org/${org.slug}#donate`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flexShrink: 0,
                          fontSize: 12, fontWeight: 700,
                          padding: "7px 16px", borderRadius: 7,
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          color: "#1d4ed8",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Donate ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Back ── */}
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", textDecoration: "none", marginTop: 8, fontWeight: 500 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            Back to all issues
          </Link>

        </main>

        <footer style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>How Bad Is It?</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Not affiliated with any political party.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
