"use client"
import { CAT_COLOR } from "@/lib/colors"

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

export default function NonprofitCard({ org, category }) {
  const catColor = CAT_COLOR[category] || "#6B7C6C"
  const rgb = hexToRgb(catColor)

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "#fff",
      borderRadius: 16,
      borderTop: `2px solid ${catColor}`,
      borderRight: "1px solid rgba(0,0,0,0.07)",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
      borderLeft: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      padding: "20px 20px 18px",
      display: "flex", flexDirection: "column", gap: 0,
      minHeight: 220,
    }}>
      {/* Category tag */}
      <span style={{
        alignSelf: "flex-start",
        fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "#5A6B5B",
        marginBottom: 14,
      }}>{category}</span>

      {/* Name */}
      <div style={{
        fontFamily: "var(--font-fraunces), Georgia, serif",
        fontSize: 17, fontWeight: 800, color: "#1a2e1c",
        lineHeight: 1.35, letterSpacing: "-0.02em",
        marginBottom: 12, flex: 1,
      }}>{org.name}</div>

      {/* Description */}
      <p style={{
        color: "#5A6B5B", fontSize: 13, lineHeight: 1.65, margin: "0 0 16px",
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{org.description}</p>

      <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 14 }} />

      {/* Donate button */}
      <a
        href={org.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          alignSelf: "flex-start",
          display: "inline-flex", alignItems: "center",
          padding: "5px 12px", borderRadius: 6,
          background: `rgba(${rgb},0.1)`,
          border: `1px solid rgba(${rgb},0.3)`,
          color: catColor, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase",
          textDecoration: "none", whiteSpace: "nowrap",
        }}
      >Donate →</a>
    </div>
  )
}
