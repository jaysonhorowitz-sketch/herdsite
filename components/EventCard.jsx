"use client"
import Link from "next/link"
import { CAT_COLOR } from "@/lib/colors"

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

export default function EventCard({ event }) {
  const catColor = CAT_COLOR[event.category] || "#6B7C6C"
  const rgb = hexToRgb(catColor)

  const location = [event.city, event.state].filter(Boolean).join(", ") || event.address || null

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "#fff",
      borderRadius: 12,
      borderTop: `2px solid ${catColor}`,
      border: `1px solid rgba(0,0,0,0.07)`,
      borderTopWidth: 2,
      borderTopColor: catColor,
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      {/* Category tag */}
      <span style={{
        alignSelf: "flex-start",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: catColor, background: `rgba(${rgb},0.1)`,
        border: `1px solid rgba(${rgb},0.2)`,
        padding: "2px 7px", borderRadius: 99,
      }}>{event.category}</span>

      {/* Title */}
      <div style={{
        fontFamily: "var(--font-fraunces), Georgia, serif",
        fontSize: 13, fontWeight: 800, color: "#1C2E1E",
        lineHeight: 1.3, letterSpacing: "-0.01em",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{event.title}</div>

      {/* Description */}
      {event.description && (
        <p style={{
          fontSize: 11, color: "#6B7C6C", lineHeight: 1.55, margin: 0, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{event.description}</p>
      )}

      {/* Date/location + Register button on same row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          {event.date && event.date !== "Flexible" && event.date !== "Upcoming" && (
            <span style={{ fontSize: 11, color: "#4A5C4B", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {event.date}{event.time ? " · " + event.time : ""}
            </span>
          )}
          {location && (
            <span style={{ fontSize: 11, color: "#6B7C6C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{location}</span>
          )}
        </div>
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            flexShrink: 0,
            fontSize: 10, fontWeight: 700, textDecoration: "none",
            color: catColor, background: `rgba(${rgb},0.1)`,
            border: `1px solid rgba(${rgb},0.25)`,
            padding: "4px 10px", borderRadius: 6,
            letterSpacing: "0.04em",
          }}
        >Register →</a>
      </div>
    </div>
  )
}
