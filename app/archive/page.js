"use client"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { CAT_COLOR } from "@/lib/colors"

const supabase = createClient()

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

function severityTier(s) {
  if (s >= 9) return { label: "Severe Impact",  color: "#ef4444" }
  if (s >= 7) return { label: "Major Impact",   color: "#fb923c" }
  if (s >= 4) return { label: "Notable Impact", color: "#fbbf24" }
  return             { label: "Worth Watching", color: "#6B7C6C" }
}

function ArchiveCard({ issue, onRemove }) {
  const tier     = severityTier(issue.severity_score)
  const catColor = CAT_COLOR[issue.category] || "#6B7C6C"
  const rgb      = hexToRgb(catColor)
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <button
        onClick={() => onRemove(issue.slug)}
        style={{
          position: "absolute", top: 18, right: 18, zIndex: 2,
          background: "none", border: "none", cursor: "pointer",
          color: catColor, fontSize: 19, padding: 4, lineHeight: 1,
          transition: "color 0.15s",
        }}
        title="Remove from archive"
      >★</button>

      <Link
        href={"/issue/" + issue.slug}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          textDecoration: "none", color: "inherit", display: "block",
          background: hovered ? `rgba(${rgb},0.1)` : `rgba(${rgb},0.06)`,
          border: `1px solid rgba(${rgb},${hovered ? 0.28 : 0.16})`,
          borderRadius: 12,
          padding: "22px 52px 20px 24px",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
          <span className="sev-pulse" style={{ "--c": tier.color }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: tier.color }}>
            {tier.label}
          </span>
          <span style={{ fontSize: 10, color: "rgba(245,241,232,0.28)", marginLeft: 4 }}>{issue.date}</span>
        </div>

        <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 10px", color: "#1C2E1E", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
          {issue.title}
        </h2>

        <p style={{ color: "rgba(245,241,232,0.58)", fontSize: 14, lineHeight: 1.68, margin: "0 0 18px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {issue.description}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "6px 16px", borderRadius: 6,
            background: `rgba(${rgb},0.14)`,
            border: `1px solid rgba(${rgb},0.32)`,
            color: catColor, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>Take Action →</span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: `rgba(${rgb},0.55)`, flexShrink: 0 }}>
            {issue.category}
          </span>
        </div>
      </Link>
    </div>
  )
}

export default function ArchivePage() {
  const [issues,   setIssues]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [slugs,    setSlugs]    = useState([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("archivedIssues") || "[]")
      setSlugs(stored)
    } catch {
      setSlugs([])
    }
  }, [])

  useEffect(() => {
    if (slugs.length === 0) { setLoading(false); return }
    supabase.from("issues").select("*").in("slug", slugs)
      .then(({ data }) => {
        if (data) {
          // Preserve user's save order (most recent first)
          const order = [...slugs].reverse()
          const map = Object.fromEntries(data.map(i => [i.slug, i]))
          setIssues(order.map(s => map[s]).filter(Boolean))
        }
        setLoading(false)
      })
  }, [slugs])

  const handleRemove = useCallback((slug) => {
    setSlugs(prev => {
      const next = prev.filter(s => s !== slug)
      try { localStorage.setItem("archivedIssues", JSON.stringify(next)) } catch {}
      return next
    })
    setIssues(prev => prev.filter(i => i.slug !== slug))
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#F4F0E6", fontFamily: "'Inter', system-ui, sans-serif", color: "#1C2E1E" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(244,240,230,0.95)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em" }}>Herd</span>
            </Link>
            <span style={{ color: "#6B7C6C", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6B7C6C" }}>Archive</span>
          </div>
          <Link href="/" style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none" }}>← Back to feed</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1C2E1E", margin: 0, letterSpacing: "-0.02em" }}>Saved Issues</h1>
          {issues.length > 0 && (
            <span style={{ fontSize: 12, color: "#4A5C4B", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: "3px 10px" }}>
              {issues.length}
            </span>
          )}
        </div>

        {loading && <p style={{ color: "#4A5C4B", fontSize: 14 }}>Loading...</p>}

        {!loading && issues.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 16, color: "#4A5C4B", marginBottom: 8 }}>No saved issues yet.</p>
            <p style={{ fontSize: 13, color: "#6B7C6C" }}>Star ☆ any issue on the feed to save it here.</p>
            <Link href="/" style={{ display: "inline-block", marginTop: 20, fontSize: 13, fontWeight: 600, color: "#16a34a", textDecoration: "none" }}>← Go to feed</Link>
          </div>
        )}

        {issues.map(issue => (
          <ArchiveCard key={issue.id} issue={issue} onRemove={handleRemove} />
        ))}
      </div>

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
