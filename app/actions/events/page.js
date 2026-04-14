"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const CAT_COLOR = {
  "Environment":         "#6ee7b7",
  "Civil Rights":        "#f87171",
  "Healthcare":          "#f472b6",
  "Immigration":         "#fb923c",
  "Economy":             "#34d399",
  "Education & Science": "#a78bfa",
  "Media & Democracy":   "#38bdf8",
  "National Security":   "#94a3b8",
  "Rule of Law":         "#fbbf24",
  "Executive Power":     "#f97316",
  "Community":           "#6b7280",
}

const TYPE_COLOR = {
  "Volunteering": { bg: "rgba(96,165,250,0.12)", color: "#93c5fd", border: "rgba(96,165,250,0.25)" },
  "Political":    { bg: "rgba(251,146,60,0.12)",  color: "#fdba74", border: "rgba(251,146,60,0.25)" },
}

const ALL_FILTERS = ["All", "Volunteering", "Political", "Environment", "Healthcare", "Civil Rights", "Immigration", "Economy", "Education & Science"]

export default function EventsPage() {
  const mapContainer = useRef(null)
  const mapInstance  = useRef(null)
  const markers      = useRef([])
  const [zip,      setZip]      = useState("")
  const [filter,   setFilter]   = useState("All")
  const [mapReady, setMapReady] = useState(false)
  const [events,   setEvents]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // Load saved zip
  useEffect(() => {
    const saved = localStorage.getItem("userZipCode")
    if (saved) setZip(saved)
  }, [])

  // Debounced live fetch — fires 700ms after user stops typing a valid zip
  useEffect(() => {
    if (!zip || zip.length !== 5) { setEvents([]); return }
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      fetch(`/api/events?zip=${zip}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) throw new Error(data.error)
          setEvents(data.events || [])
        })
        .catch(() => setError("Couldn't load events. Try again."))
        .finally(() => setLoading(false))
    }, 700)
    return () => clearTimeout(timer)
  }, [zip])

  // Init Mapbox map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-74.006, 40.7128],
        zoom: 11,
        attributionControl: false,
      })

      map.on("load", () => {
        mapInstance.current = map
        setMapReady(true)
      })
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Add / update markers when map is ready or filter changes
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      // Remove old markers
      markers.current.forEach(m => m.remove())
      markers.current = []

      const visible = filter === "All" ? events : events.filter(e => e.type === filter || e.category === filter)

      visible.forEach(event => {
        const catColor = CAT_COLOR[event.category] || "#94a3b8"

        const el = document.createElement("div")
        el.style.cssText = `
          width: 14px; height: 14px; border-radius: 50%;
          background: ${catColor};
          border: 2px solid rgba(255,255,255,0.6);
          box-shadow: 0 0 8px ${catColor}80;
          cursor: pointer;
        `

        const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
          .setHTML(`
            <div style="font-family: Inter, sans-serif; padding: 4px 2px;">
              <div style="font-size: 11px; font-weight: 700; color: ${catColor};
                text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
                ${event.type}
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #f1f5f9; line-height: 1.3;">
                ${event.title}
              </div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                ${event.date} · ${event.time}
              </div>
            </div>
          `)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([event.lng, event.lat])
          .setPopup(popup)
          .addTo(mapInstance.current)

        markers.current.push(marker)
      })
    })
  }, [mapReady, filter])

  // Geocode zip → fly map to that location
  useEffect(() => {
    if (!zip || zip.length !== 5 || !mapInstance.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?country=us&types=postcode&access_token=${token}`)
      .then(r => r.json())
      .then(data => {
        const center = data.features?.[0]?.center
        if (center) mapInstance.current.flyTo({ center, zoom: 12, duration: 1200 })
      })
      .catch(() => {})
  }, [zip])

  const visible = filter === "All" ? events : events.filter(e => e.type === filter)

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0" }}>

      {/* Mapbox CSS */}
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" />

      {/* Nav */}
      <header style={{
        background: "rgba(11,17,32,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, fontWeight: 800, color: "#F5F1E8", letterSpacing: "-0.02em" }}>Herd</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#3b82f6", marginBottom: 10 }}>Events near you</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#F5F1E8",
            letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
            Show up. Make a difference.
          </h1>
          <p style={{ fontSize: 15, color: "#4b5563", margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
            Volunteer shifts, political events, and town halls in your area.
          </p>
        </div>

        {/* Zip input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#4b5563" strokeWidth="2">
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
                background: "#111827", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f1f5f9", outline: "none", width: 160,
                letterSpacing: "0.06em",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ALL_FILTERS.map(f => {
              const accent = f === "All" ? "#93c5fd" : (CAT_COLOR[f] || "#93c5fd")
              const active = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "8px 16px", borderRadius: 99, border: "1px solid",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: active ? `${accent}20` : "transparent",
                    borderColor: active ? `${accent}66` : "rgba(255,255,255,0.1)",
                    color: active ? accent : "#4b5563",
                    transition: "all 0.15s",
                  }}
                >{f}</button>
              )
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 28, height: 380,
          background: "#111827",
        }}>
          <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Status banner */}
        {!zip || zip.length < 5 ? (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            padding: "14px 18px", borderRadius: 10, marginBottom: 28,
            background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
              Enter your zip code above to find real volunteer opportunities and civic events near you.
            </p>
          </div>
        ) : loading ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 18px", borderRadius: 10, marginBottom: 28,
            background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⏳</span>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Searching for events near {zip}…</p>
          </div>
        ) : error ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 18px", borderRadius: 10, marginBottom: 28,
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 18px", borderRadius: 10, marginBottom: 28,
            background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
            <p style={{ fontSize: 13, color: "#fbbf24", margin: 0 }}>No events found near {zip}. Try a nearby zip code.</p>
          </div>
        ) : null}

        {/* Event count */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          {visible.length} event{visible.length !== 1 ? "s" : ""}
          {zip.length === 5 ? ` near ${zip}` : ""}
        </div>

        {/* Event cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map(event => {
            const catColor = CAT_COLOR[event.category] || "#94a3b8"
            const typeStyle = TYPE_COLOR[event.type] || TYPE_COLOR["Volunteering"]
            return (
              <div
                key={event.id}
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "20px 22px",
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: 20,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}`,
                    }}>{event.type}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: catColor,
                      textTransform: "uppercase", letterSpacing: "0.1em" }}>{event.category}</span>
                    {event.source && (
                      <span style={{ fontSize: 10, color: "#374151", marginLeft: "auto" }}>via {event.source}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F5F1E8",
                    margin: "0 0 4px", lineHeight: 1.3 }}>{event.title}</h3>

                  {/* Org */}
                  <p style={{ fontSize: 12, color: "#4b5563", margin: "0 0 8px", fontWeight: 600 }}>
                    {event.org}
                  </p>

                  {/* Description */}
                  <p style={{ fontSize: 13, color: "#374151", margin: "0 0 12px", lineHeight: 1.6 }}>
                    {event.description}
                  </p>

                  {/* Date + location */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#4b5563", display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {event.date} · {event.time}
                    </span>
                    <span style={{ fontSize: 12, color: "#4b5563", display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      </svg>
                      {event.address}, {event.city}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flexShrink: 0, padding: "9px 18px", borderRadius: 7,
                    fontSize: 12, fontWeight: 700, textDecoration: "none",
                    background: "#1e3a5f", color: "#93c5fd",
                    border: "1px solid rgba(96,165,250,0.25)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Register →
                </a>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .mapboxgl-popup-content {
          background: #1a2236 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
          padding: 12px 14px !important;
        }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>
    </div>
  )
}
