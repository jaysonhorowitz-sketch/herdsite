"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

function computeStreak(actions) {
  if (!actions.length) return 0
  // Get unique calendar days (local time) that have at least one action
  const days = new Set(
    actions.map(a => new Date(a.timestamp).toLocaleDateString("en-CA")) // YYYY-MM-DD
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (days.has(d.toLocaleDateString("en-CA"))) {
      streak++
    } else if (i > 0) {
      break // gap found
    }
  }
  return streak
}

function actionsThisMonth(actions) {
  const now = new Date()
  return actions.filter(a => {
    const d = new Date(a.timestamp)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
}

// Fake percentile — purely motivational, not real data
function percentile(n) {
  if (n >= 20) return 97
  if (n >= 10) return 89
  if (n >= 5)  return 74
  if (n >= 2)  return 55
  return 40
}

function motivatingLine(monthly) {
  if (monthly === 0) return "Take your first action below to start your streak."
  const pct = percentile(monthly)
  return `You've taken ${monthly} action${monthly !== 1 ? "s" : ""} this month — that's more than ${pct}% of users.`
}

function timeAgo(ts) {
  const diff  = Date.now() - ts
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return "just now"
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function ProfilePage() {
  const [actions, setActions] = useState(null) // null = loading

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
      setActions(stored.sort((a, b) => b.timestamp - a.timestamp))
    } catch {
      setActions([])
    }
  }, [])

  if (actions === null) {
    return (
      <div style={{ background: "#111827", minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#374151", fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading…
      </div>
    )
  }

  const streak  = computeStreak(actions)
  const monthly = actionsThisMonth(actions)
  const total   = actions.length

  // Group by issue
  const byIssue = {}
  for (const a of actions) {
    if (!byIssue[a.issueSlug]) byIssue[a.issueSlug] = { title: a.issueTitle || a.issueSlug, items: [] }
    byIssue[a.issueSlug].items.push(a)
  }

  const S = {
    background: "#1a2236",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "22px 24px",
    marginBottom: 12,
  }

  return (
    <div style={{ background: "#111827", minHeight: "100vh", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <header style={{
        background: "rgba(17,24,39,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>→ Politics & Governance</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            All issues
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "#3b82f6", marginBottom: 10 }}>Your Impact</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "#f1f5f9",
            letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
            {total === 0 ? "Start making a difference" : "You're making a difference"}
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
            {motivatingLine(monthly)}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total Actions",   value: total,  unit: "",        color: "#60a5fa" },
            { label: "This Month",      value: monthly, unit: "",       color: "#a78bfa" },
            { label: "Day Streak",      value: streak,  unit: streak === 1 ? " day" : " days", color: "#4ade80" },
          ].map(stat => (
            <div key={stat.label} style={{ ...S, textAlign: "center", padding: "20px 16px" }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: stat.color,
                letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>
                {stat.value}{stat.unit}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151",
                textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Streak bar */}
        {streak > 0 && (
          <div style={{ ...S, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
                🔥 {streak}-day streak
              </span>
              <span style={{ fontSize: 11, color: "#374151" }}>
                Keep it going — take an action today
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: Math.min(streak, 14) }, (_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 99,
                  background: i < streak ? "#4ade80" : "rgba(255,255,255,0.05)",
                  opacity: 0.6 + (i / Math.max(streak - 1, 1)) * 0.4,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Actions list */}
        {total === 0 ? (
          <div style={{ ...S, textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✊</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
              No actions tracked yet
            </p>
            <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 24, lineHeight: 1.6 }}>
              Click any action item on an issue page to mark it done and track it here.
            </p>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 700, color: "#fff",
              padding: "10px 22px", borderRadius: 8, background: "#3b82f6",
              textDecoration: "none",
            }}>Browse issues →</Link>
          </div>
        ) : (
          <div style={S}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 16, margin: "0 0 16px" }}>
              Completed Actions
            </p>
            {Object.entries(byIssue).map(([slug, group]) => (
              <div key={slug} style={{ marginBottom: 20 }}>
                <Link href={`/issue/${slug}`} style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd",
                  textDecoration: "none", display: "block", marginBottom: 8 }}>
                  {group.title} ↗
                </Link>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.items.map((a, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      padding: "10px 14px", borderRadius: 8,
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.15)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, color: "#4ade80", flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.4 }}>{a.actionText}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#374151", flexShrink: 0 }}>{timeAgo(a.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px", display: "flex",
          justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#1f2937", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase" }}>How Bad Is It?</span>
          <span style={{ fontSize: 11, color: "#1f2937" }}>Not affiliated with any political party.</span>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
