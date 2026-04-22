"use client"
import { useEffect, useRef, useState } from "react"
import { CAT_COLOR } from "@/lib/colors"

export default function MobilizeMap({ zip, height = 300, onEventsLoaded, onErrorChange }) {
  const mapContainer = useRef(null)
  const mapInstance  = useRef(null)
  const markers      = useRef([])
  const hubMarker    = useRef(null)
  const [mapReady,  setMapReady]  = useState(false)
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [mapCenter, setMapCenter] = useState(null)
  const initialZipRef = useRef(zip)

  // Fetch events when zip changes
  useEffect(() => {
    if (!zip || zip.length !== 5) {
      setEvents([])
      onEventsLoaded?.([])
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/events?zip=${zip}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) throw new Error(data.error)
          const evs = data.events || []
          setEvents(evs)
          onEventsLoaded?.(evs)
        })
        .catch(() => {
          onErrorChange?.("Couldn't load events. Try again.")
        })
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
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [-98.5795, 39.8283],
        zoom: 4,
        attributionControl: false,
      })
      map.on("load", () => {
        mapInstance.current = map
        setMapReady(true)
        const z = initialZipRef.current
        if (z && z.length === 5) {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${z}.json?country=us&types=postcode&access_token=${token}`)
            .then(r => r.json())
            .then(data => {
              const center = data.features?.[0]?.center
              if (!center) return
              setMapCenter(center)
              map.flyTo({ center, zoom: 12, duration: 1000 })
            })
            .catch(() => {})
        }
      })
    })
    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [])

  // Geocode zip → fly map
  useEffect(() => {
    if (!zip || zip.length !== 5 || !mapReady || !mapInstance.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?country=us&types=postcode&access_token=${token}`)
      .then(r => r.json())
      .then(data => {
        const center = data.features?.[0]?.center
        if (!center) return
        setMapCenter(center)
        mapInstance.current.flyTo({ center, zoom: 12, duration: 1000 })
      })
      .catch(() => {})
  }, [zip, mapReady])

  // Place hub + event dots whenever center or events change
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !mapCenter) return
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      // Clear existing markers
      if (hubMarker.current) { hubMarker.current.remove(); hubMarker.current = null }
      markers.current.forEach(m => m.remove())
      markers.current = []

      if (events.length === 0) return

      // Hub dot (purely visual — no click behavior)
      const hub = document.createElement("div")
      hub.style.cssText = `
        width: 26px; height: 26px; border-radius: 50%;
        background: white;
        box-shadow: 0 0 16px rgba(255,255,255,0.9);
        animation: hub-pulse 1.6s ease-out infinite;
        position: relative; z-index: 10;
        border: 2px solid rgba(255,255,255,0.4);
        pointer-events: none;
      `
      hubMarker.current = new mapboxgl.Marker(hub)
        .setLngLat(mapCenter)
        .addTo(mapInstance.current)

      // Scatter event dots around center
      const cLng = mapCenter[0]
      const cLat = mapCenter[1]

      events.forEach((event, i) => {
        const catColor = CAT_COLOR[event.category] || "#6B7C6C"

        const sign = () => (Math.random() < 0.5 ? 1 : -1)
        const lngOffset = sign() * (0.008 + Math.random() * 0.014)
        const latOffset = sign() * (0.008 + Math.random() * 0.014)
        const lng = cLng + lngOffset
        const lat = cLat + latOffset

        const el = document.createElement("div")
        el.style.cssText = `
          width: 14px; height: 14px; border-radius: 50%;
          background: ${catColor};
          border: 2.5px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          cursor: pointer;
          transition: transform 0.15s;
        `
        el.onmouseenter = () => { el.style.transform = "scale(1.6)" }
        el.onmouseleave = () => { el.style.transform = "scale(1)" }

        const dateStr = event.date && event.date !== "Flexible" && event.date !== "Upcoming"
          ? event.date + (event.time ? " · " + event.time : "")
          : ""

        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false, maxWidth: "240px" })
          .setHTML(`
            <div style="font-family: Inter, sans-serif; padding: 2px;">
              <div style="font-size: 10px; font-weight: 700; color: ${catColor};
                text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">
                ${event.category}
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #1C2E1E; line-height: 1.35; margin-bottom: 4px;">
                ${event.title}
              </div>
              ${dateStr ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">${dateStr}</div>` : ""}
              <a href="${event.url}" target="_blank" rel="noopener noreferrer"
                style="display:inline-block; font-size:11px; font-weight:700; color:#16a34a;
                text-decoration:none; background:rgba(21,128,61,0.15);
                border:1px solid rgba(21,128,61,0.3); padding:4px 10px; border-radius:5px;">
                Register →
              </a>
            </div>
          `)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapInstance.current)

        el.addEventListener("mouseenter", () => {
          if (!popup.isOpen()) marker.togglePopup()
        })
        el.addEventListener("mouseleave", e => {
          const to = e.relatedTarget
          const popupEl = marker.getPopup()?.getElement?.()
          if (popupEl && (popupEl === to || popupEl.contains(to))) return
          if (popup.isOpen()) marker.togglePopup()
        })

        markers.current.push(marker)
      })
    })
  }, [mapReady, mapCenter, events])

  return (
    <>
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" />
      <div style={{
        borderRadius: 14, overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
        height, background: "#FDFAF3", position: "relative",
      }}>
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
        {mapCenter && events.length > 0 && !loading && (
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            background: "rgba(244,240,230,0.85)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(0,0,0,0.1)", borderRadius: 99,
            padding: "7px 16px", fontSize: 12, fontWeight: 600, color: "#6B7C6C",
            pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            {events.length} events found near you
          </div>
        )}
        {loading && (
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            background: "rgba(244,240,230,0.85)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(0,0,0,0.1)", borderRadius: 99,
            padding: "7px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280",
            pointerEvents: "none",
          }}>
            Searching…
          </div>
        )}
      </div>
      <style>{`
        @keyframes hub-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70%  { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes dot-pop {
          0%   { transform: scale(0.2); opacity: 0.4; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .mapboxgl-popup-content {
          background: #E8E4D8 !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          padding: 12px 14px !important;
        }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>
    </>
  )
}
