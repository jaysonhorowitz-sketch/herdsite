"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

// Parse "slug-actionIndex" strings from localStorage
// The slug may contain hyphens, so split on the LAST hyphen segment that is a digit
function parseActionKey(key) {
  const lastDash = key.lastIndexOf("-")
  if (lastDash === -1) return null
  const idx = parseInt(key.slice(lastDash + 1), 10)
  if (isNaN(idx)) return null
  return { slug: key.slice(0, lastDash), actionIndex: idx }
}

// Fake percentile — purely motivational, not real data
function percentile(n) {
  if (n >= 20) return 97
  if (n >= 10) return 89
  if (n >= 5)  return 74
  if (n >= 2)  return 55
  return 40
}

export default function ProfilePage() {
  const [keys,    setKeys]    = useState(null) // null = loading; array of strings when loaded
  const [issues,  setIssues]  = useState({})  // slug → { title } fetched lazily

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
      // Accept both new format (strings) and old format (objects) gracefully
      const normalized = stored.map(item =>
        typeof item === "string" ? item : `${item.issueSlug}-${item.actionIndex ?? 0}`
      ).filter(Boolean)
      setKeys(normalized)
    } catch {
      setKeys([])
    }
  }, [])

  // Group by slug
  const bySlug = {}
  if (keys) {
    for (const key of keys) {
      const parsed = parseActionKey(key)
      if (!parsed) continue
      if (!bySlug[parsed.slug]) bySlug[parsed.slug] = []
      bySlug[parsed.slug].push(parsed.actionIndex)
    }
  }

  const total = keys?.length ?? 0
  const slugCount = Object.keys(bySlug).length

  if (keys === null) {
    return (
      <div style={{ background: "#111827", minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#374151", fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading…
      </div>
    )
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
            {total === 0
              ? "Click any action item on an issue page to mark it done and track it here."
              : `You've completed ${total} action${total !== 1 ? "s" : ""} across ${slugCount} issue${slugCount !== 1 ? "s" : ""} — that's more than ${percentile(total)}% of readers.`}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total Actions",    value: total,      color: "#60a5fa" },
            { label: "Issues Acted On",  value: slugCount,  color: "#4ade80" },
          ].map(stat => (
            <div key={stat.label} style={{ ...S, textAlign: "center", padding: "20px 16px" }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: stat.color,
                letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151",
                textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

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
              letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Completed Actions by Issue
            </p>
            {Object.entries(bySlug).map(([slug, indices]) => (
              <div key={slug} style={{ marginBottom: 20 }}>
                <Link href={`/issue/${slug}`} style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd",
                  textDecoration: "none", display: "block", marginBottom: 8 }}>
                  {slug} ↗
                </Link>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {indices.map(idx => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 8,
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.15)",
                    }}>
                      <span style={{ fontSize: 13, color: "#4ade80" }}>✓</span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>Action {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                localStorage.removeItem("completedActions")
                setKeys([])
              }}
              style={{
                marginTop: 8, fontSize: 12, color: "#374151", background: "none",
                border: "none", cursor: "pointer", textDecoration: "underline", padding: 0,
              }}
            >
              Clear all
            </button>
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
    </div>
  )
}
