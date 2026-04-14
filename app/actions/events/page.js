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
  const mapContainer  = useRef(null)
  const mapInstance   = useRef(null)
  const markers       = useRef([])
  const hubMarker     = useRef(null)
  const [zip,         setZip]         = useState("")
  const [filter,      setFilter]      = useState("All")
  const [mapReady,    setMapReady]    = useState(false)
  const [events,      setEvents]      = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [expanded,    setExpanded]    = useState(false)  // whether dots are exploded out
  const [mapCenter,   setMapCenter]   = useState(null)   // [lng, lat] of current zip

  // Load saved zip
  useEffect(() => {
    const saved = localStorage.getItem("userZipCode")
    if (saved) setZip(saved)
  }, [])

  // Debounced live fetch when zip changes
  useEffect(() => {
    if (!zip || zip.length !== 5) {
      setEvents([])
      setExpanded(false)
      return
    }
    setLoading(true)
    setError(null)
    setExpanded(false)
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
        center: [-98.5795, 39.8283],
        zoom: 4,
        attributionControl: false,
      })
      map.on("load", () => {
        mapInstance.current = map
        setMapReady(true)
      })
    })
    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [])

  // When zip changes → fly map, show hub dot, clear old markers
  useEffect(() => {
    if (!zip || zip.length !== 5 || !mapReady || !mapInstance.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?country=us&types=postcode&access_token=${token}`)
      .then(r => r.json())
      .then(data => {
        const center = data.features?.[0]?.center
        if (!center) return
        setMapCenter(center)
        mapInstance.current.flyTo({ center, zoom: 11, duration: 1200 })
      })
      .catch(() => {})
  }, [zip, mapReady])

  // Show hub dot when we have a center + events loaded
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !mapCenter) return
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      // Remove previous hub + event markers
      if (hubMarker.current) { hubMarker.current.remove(); hubMarker.current = null }
      markers.current.forEach(m => m.remove())
      markers.current = []
      setExpanded(false)

      if (events.length === 0) return

      // Hub dot — white glowing pulse
      const hub = document.createElement("div")
      hub.style.cssText = `
        width: 22px; height: 22px; border-radius: 50%;
        background: white;
        box-shadow: 0 0 0 0 rgba(255,255,255,0.6);
        animation: hub-pulse 1.8s ease-out infinite;
        cursor: pointer;
        position: relative;
        z-index: 10;
      `
      hub.title = `${events.length} events — click to explore`

      hub.onclick = () => explodeDots(mapboxgl, mapCenter, events, filter)

      hubMarker.current = new mapboxgl.Marker(hub)
        .setLngLat(mapCenter)
        .addTo(mapInstance.current)
    })
  }, [mapReady, mapCenter, events])

  // Re-filter visible dots when filter changes (only if already expanded)
  useEffect(() => {
    if (!expanded || !mapReady || !mapInstance.current || !mapCenter) return
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      markers.current.forEach(m => m.remove())
      markers.current = []
      const visible = filter === "All" ? events : events.filter(e => e.type === filter || e.category === filter)
      placeDots(mapboxgl, mapCenter, visible)
    })
  }, [filter, expanded])

  function explodeDots(mapboxgl, center, allEvents, currentFilter) {
    // Remove hub
    if (hubMarker.current) { hubMarker.current.remove(); hubMarker.current = null }
    // Clear old event dots
    markers.current.forEach(m => m.remove())
    markers.current = []

    const visible = currentFilter === "All" ? allEvents : allEvents.filter(e => e.type === currentFilter || e.category === currentFilter)
    setExpanded(true)
    placeDots(mapboxgl, center, visible)
  }

  function placeDots(mapboxgl, center, eventsToShow) {
    const [cLng, cLat] = center
    eventsToShow.forEach((event, i) => {
      const catColor = CAT_COLOR[event.category] || "#94a3b8"

      // Spread dots in a rough circle + some randomness
      const angle   = (i / eventsToShow.length) * 2 * Math.PI + Math.random() * 0.5
      const radius  = 0.018 + Math.random() * 0.022  // ~1-3km spread
      const lat = cLat + radius * Math.sin(angle)
      const lng = cLng + radius * Math.cos(angle)

      const el = document.createElement("div")
      el.style.cssText = `
        width: 13px; height: 13px; border-radius: 50%;
        background: ${catColor};
        border: 2px solid rgba(255,255,255,0.5);
        box-shadow: 0 0 8px ${catColor}99;
        cursor: pointer;
        transition: transform 0.15s;
        animation: dot-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
        animation-delay: ${i * 30}ms;
      `
      el.onmouseenter = () => { el.style.transform = "scale(1.7)" }
      el.onmouseleave = () => { el.style.transform = "scale(1)" }

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: false, maxWidth: "240px" })
        .setHTML(`
          <div style="font-family: Inter, sans-serif; padding: 2px;">
            <div style="font-size: 10px; font-weight: 700; color: ${catColor};
              text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">
              ${event.category}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #f1f5f9; line-height: 1.35; margin-bottom: 5px;">
              ${event.title}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              ${event.org}${event.date !== "Flexible" && event.date !== "Upcoming" ? " · " + event.date : ""}
            </div>
            <a href="${event.url}" target="_blank" rel="noopener noreferrer"
              style="display:inline-block; font-size:11px; font-weight:700; color:#93c5fd;
              text-decoration:none; background:rgba(59,130,246,0.15);
              border:1px solid rgba(59,130,246,0.3); padding:4px 10px; border-radius:5px;">
              View event →
            </a>
          </div>
        `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapInstance.current)

      markers.current.push(marker)
    })
  }

  const visible = filter === "All" ? events : events.filter(e => e.type === filter || e.category === filter)

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0" }}>

      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" />

      {/* Nav */}
      <header style={{
        background: "rgba(11,17,32,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, fontWeight: 800, color: "#F5F1E8", letterSpacing: "-0.02em" }}>Herd</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 10 }}>Events near you</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#F5F1E8", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
            Show up. Make a difference.
          </h1>
          <p style={{ fontSize: 15, color: "#4b5563", margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
            Enter your zip to find events near you. Click the dot on the map to explore them.
          </p>
        </div>

        {/* Zip + filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
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
                color: "#f1f5f9", outline: "none", width: 160, letterSpacing: "0.06em",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ALL_FILTERS.map(f => {
              const accent = f === "All" ? "#93c5fd" : (CAT_COLOR[f] || "#93c5fd")
              const active = filter === f
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "8px 14px", borderRadius: 99, border: "1px solid",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: active ? `${accent}20` : "transparent",
                  borderColor: active ? `${accent}66` : "rgba(255,255,255,0.1)",
                  color: active ? accent : "#4b5563",
                  transition: "all 0.15s",
                }}>{f}</button>
              )
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{
          borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 28, height: 400,
          background: "#111827", position: "relative",
        }}>
          <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
          {/* Hint overlay when hub is showing but not expanded */}
          {mapCenter && events.length > 0 && !expanded && !loading && (
            <div style={{
              position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
              background: "rgba(11,17,32,0.85)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99,
              padding: "7px 16px", fontSize: 12, fontWeight: 600, color: "#94a3b8",
              pointerEvents: "none", whiteSpace: "nowrap",
            }}>
              {events.length} events found — click the dot to explore
            </div>
          )}
          {loading && (
            <div style={{
              position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
              background: "rgba(11,17,32,0.85)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99,
              padding: "7px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280",
              pointerEvents: "none",
            }}>
              Searching…
            </div>
          )}
        </div>

        {/* Status */}
        {!zip || zip.length < 5 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, marginBottom: 24, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
            <span style={{ fontSize: 15 }}>📍</span>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Enter your zip code to find events near you.</p>
          </div>
        ) : error ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, marginBottom: 24, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
          </div>
        ) : events.length > 0 ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            {visible.length} event{visible.length !== 1 ? "s" : ""} near {zip}
          </div>
        ) : null}

        {/* Event cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map(event => {
            const catColor  = CAT_COLOR[event.category] || "#94a3b8"
            const typeStyle = TYPE_COLOR[event.type] || TYPE_COLOR["Volunteering"]
            return (
              <div key={event.id} style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "16px 20px",
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 16,
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
                      <span style={{ fontSize: 10, color: "#374151", marginLeft: "auto" }}>via {event.source}</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F5F1E8", margin: "0 0 3px", lineHeight: 1.3 }}>
                    {event.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "#4b5563", margin: "0 0 6px", fontWeight: 600 }}>{event.org}</p>
                  <p style={{ fontSize: 12, color: "#374151", margin: "0 0 10px", lineHeight: 1.6 }}>{event.description}</p>

                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {event.date && event.date !== "Flexible" && (
                      <span style={{ fontSize: 11, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {event.date}{event.time ? " · " + event.time : ""}
                      </span>
                    )}
                    {event.city && (
                      <span style={{ fontSize: 11, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
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

      <style>{`
        @keyframes hub-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70%  { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes dot-pop {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mapboxgl-popup-content {
          background: #1a2236 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          padding: 12px 14px !important;
        }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>
    </div>
  )
}
