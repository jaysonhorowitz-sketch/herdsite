"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { CAT_COLOR } from "@/lib/colors"

const MobilizeMap = dynamic(() => import("@/components/MobilizeMap"), { ssr: false })

const TYPE_COLOR = {
  "Volunteering": { bg: "rgba(22,163,74,0.12)", color: "#16a34a", border: "rgba(22,163,74,0.25)" },
  "Political":    { bg: "rgba(251,146,60,0.12)",  color: "#fdba74", border: "rgba(251,146,60,0.25)" },
}

const ALL_FILTERS = ["All", "Volunteering", "Political", "Environment", "Healthcare", "Civil Rights", "Elections", "Immigration", "Economy", "Education", "Science", "Foreign Policy", "Human Rights"]

export default function EventsPage() {
  const [zip,    setZip]    = useState("")
  const [filter, setFilter] = useState("All")
  const [events, setEvents] = useState([])
  const [error,  setError]  = useState(null)

  // Load saved zip
  useEffect(() => {
    const saved = localStorage.getItem("userZipCode")
    if (saved) setZip(saved)
  }, [])

  const visible = filter === "All" ? events : events.filter(e => e.type === filter || e.category === filter)

  return (
    <div style={{ minHeight: "100vh", background: "#F4F0E6", fontFamily: "'Inter', system-ui, sans-serif", color: "#2A3E2C" }}>

      {/* Nav */}
      <header style={{
        background: "rgba(244,240,230,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em" }}>Herd</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#4A5C4B", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            Back
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#15803d", marginBottom: 10 }}>Get Involved</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#1C2E1E", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
            Show up. Make a difference.
          </h1>
          <p style={{ fontSize: 15, color: "#4A5C4B", margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
            Events, actions, and opportunities near you.
          </p>
        </div>

        {/* Zip + filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#4A5C4B" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={zip}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 5)
                setZip(v)
                if (v.length === 5) localStorage.setItem("userZipCode", v)
              }}
              placeholder="Enter zip code"
              style={{
                paddingLeft: 34, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: "#FDFAF3", border: "1px solid rgba(0,0,0,0.1)",
                color: "#1C2E1E", outline: "none", width: 160, letterSpacing: "0.06em",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ALL_FILTERS.map(f => {
              const accent = f === "All" ? "#16a34a" : (CAT_COLOR[f] || "#16a34a")
              const active = filter === f
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "8px 14px", borderRadius: 99, border: "1px solid",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: active ? `${accent}20` : "transparent",
                  borderColor: active ? `${accent}66` : "rgba(0,0,0,0.1)",
                  color: active ? accent : "#4A5C4B",
                  transition: "all 0.15s",
                }}>{f}</button>
              )
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{ marginBottom: 28 }}>
          <MobilizeMap zip={zip} height={400} onEventsLoaded={setEvents} onErrorChange={setError} />
        </div>

        {/* Status */}
        {!zip || zip.length < 5 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, marginBottom: 24, background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.12)" }}>
            <span style={{ fontSize: 15 }}>📍</span>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Enter your zip code to find events near you.</p>
          </div>
        ) : error ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, marginBottom: 24, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
          </div>
        ) : events.length > 0 ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7C6C", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            {visible.length} event{visible.length !== 1 ? "s" : ""} near {zip}
          </div>
        ) : null}

        {/* Event cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map(event => {
            const catColor  = CAT_COLOR[event.category] || "#6B7C6C"
            const typeStyle = TYPE_COLOR[event.type] || TYPE_COLOR["Volunteering"]
            return (
              <div key={event.id} style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 12, padding: "16px 20px",
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}`,
                    }}>{event.type}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}33`,
                    }}>{event.category}</span>
                    {event.source && (
                      <span style={{ fontSize: 10, color: "#6B7C6C", marginLeft: "auto" }}>via {event.source}</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1C2E1E", margin: "0 0 3px", lineHeight: 1.3 }}>
                    {event.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "#4A5C4B", margin: "0 0 6px", fontWeight: 600 }}>{event.org}</p>
                  <p style={{ fontSize: 12, color: "#6B7C6C", margin: "0 0 10px", lineHeight: 1.6 }}>{event.description}</p>

                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {event.date && event.date !== "Flexible" && (
                      <span style={{ fontSize: 11, color: "#4A5C4B", display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {event.date}{event.time ? " · " + event.time : ""}
                      </span>
                    )}
                    {event.city && (
                      <span style={{ fontSize: 11, color: "#4A5C4B", display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        {event.city}{event.state ? ", " + event.state : ""}
                      </span>
                    )}
                  </div>
                </div>

                <a href={event.url} target="_blank" rel="noopener noreferrer" style={{
                  flexShrink: 0, padding: "8px 14px", borderRadius: 7,
                  fontSize: 11, fontWeight: 700, textDecoration: "none",
                  background: `${catColor}18`, color: catColor,
                  border: `1px solid ${catColor}33`,
                  whiteSpace: "nowrap", alignSelf: "flex-start",
                }}>
                  Register →
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
