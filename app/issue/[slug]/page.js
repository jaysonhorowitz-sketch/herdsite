"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import Link from "next/link"
import { useParams } from "next/navigation"

// ─── Utilities ────────────────────────────────────────────────────────────────

function getSev(score) {
  if (score <= 3) return { accent: "#22c55e", bar: "bg-green-500",  label: "Worth Watching"        }
  if (score <= 6) return { accent: "#eab308", bar: "bg-amber-400",  label: "Notable Impact"        }
  if (score <= 8) return { accent: "#f97316", bar: "bg-orange-500", label: "Major Impact"          }
  return               { accent: "#ef4444", bar: "bg-red-500",    label: "Severe Impact"         }
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
        <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          How Bad Is It?
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          All issues
        </Link>
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
  const [news,    setNews]    = useState([])

  useEffect(() => {
    supabase.from("issues").select("*").eq("slug", params.slug).eq("is_published", true).single()
      .then(({ data }) => { if (data) setIssue(data); setLoading(false) })
  }, [params.slug])

  useEffect(() => {
    if (!issue?.category) return
    supabase.from("news_cache").select("articles").eq("issue_slug", categoryKey(issue.category)).single()
      .then(({ data }) => { if (data?.articles) setNews(data.articles.slice(0, 5)) })
  }, [issue?.category])

  if (loading) return <LoadingScreen />
  if (!issue)  return <NotFoundScreen />

  const sev        = getSev(issue.severity_score)
  const hasActions = issue.actions?.length > 0
  const hasSources = issue.sources?.length > 0
  const hasPlayers = issue.players?.length > 0

  const S = { // shared section style
    background: "#1a2236",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "22px 24px",
    marginBottom: 12,
  }
  const SH = { // section heading
    fontSize: 10, fontWeight: 700, color: "#374151",
    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
  }

  return (
    <div style={{ background: "#111827", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Category + date ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: sev.accent, background: sev.accent + "18",
            padding: "4px 10px", borderRadius: 5, border: `1px solid ${sev.accent}30`,
          }}>{issue.category}</span>
          {issue.date && <span style={{ fontSize: 12, color: "#374151" }}>{issue.date}</span>}
        </div>

        {/* ── Title ── */}
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 24 }}>
          {issue.title}
        </h1>

        {/* ── Severity panel ── */}
        <div style={{ ...S, borderColor: sev.accent + "33", marginBottom: 12 }}>
          <p style={{ ...SH, marginBottom: 12 }}>Severity Rating</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, color: sev.accent, letterSpacing: "-0.04em" }}>{issue.severity_score}</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: "#374151" }}>/10</span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: sev.accent, background: sev.accent + "15",
              padding: "6px 14px", borderRadius: 99, border: `1px solid ${sev.accent}30`,
            }}>{sev.label}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${issue.severity_score * 10}%`, height: "100%", background: sev.accent, borderRadius: 99, opacity: 0.8 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 10, color: "#374151" }}>Low</span>
            <span style={{ fontSize: 10, color: "#374151" }}>Severe</span>
          </div>
        </div>

        {/* ── What is happening ── */}
        <div style={S}>
          <p style={SH}>What Is Happening</p>
          <p style={{ color: "#9ca3af", lineHeight: 1.75, fontSize: 15, margin: 0 }}>{issue.description}</p>
        </div>

        {/* ── Key Players ── */}
        {hasPlayers && (
          <div style={{ ...S, padding: "22px 24px" }}>
            <p style={SH}>Key Players</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {issue.players.map((player, i) => (
                <PlayerCard key={i} player={player} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#1f2937", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
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
                const ef = effortConfig(action.effort)
                const inner = (
                  <>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "4px 9px", borderRadius: 5, flexShrink: 0,
                      color: ef.color, background: ef.bg, border: `1px solid ${ef.border}`,
                    }}>{action.effort}</span>
                    <span style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.5, flex: 1 }}>{action.text}</span>
                    {action.url && (
                      <svg style={{ width: 14, height: 14, color: "#374151", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                      </svg>
                    )}
                  </>
                )
                const rowStyle = {
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)", textDecoration: "none",
                }
                return action.url ? (
                  <a key={i} href={action.url} target="_blank" rel="noopener noreferrer" style={rowStyle}>{inner}</a>
                ) : (
                  <div key={i} style={rowStyle}>{inner}</div>
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
                  style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
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
                    borderBottom: i < news.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#cbd5e1", lineHeight: 1.45,
                    marginBottom: 4, transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f1f5f9"}
                    onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}>
                    {article.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 600 }}>{article.source}</span>
                    <span style={{ fontSize: 11, color: "#1f2937" }}>·</span>
                    <span style={{ fontSize: 11, color: "#374151" }}>{relativeTime(article.publishedAt)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Back ── */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", textDecoration: "none", marginTop: 8, fontWeight: 500 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          Back to all issues
        </Link>

      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 40 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#1f2937", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>How Bad Is It?</span>
          <span style={{ fontSize: 11, color: "#1f2937" }}>Not affiliated with any political party.</span>
        </div>
      </footer>
    </div>
  )
}
