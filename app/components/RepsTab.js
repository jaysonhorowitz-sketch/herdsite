"use client"
import { useEffect, useState } from "react"

const PARTY_COLOR = { Democrat: "#1d4ed8", Republican: "#b91c1c", Independent: "#6b21a8" }
const PARTY_SHORT  = { Democrat: "D", Republican: "R", Independent: "I" }

function XIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function InstagramIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
}

function RepCard({ rep }) {
  const [officesOpen, setOfficesOpen] = useState(false)
  const partyColor = PARTY_COLOR[rep.party] || "#6B7C6C"

  return (
    <div
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"}
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.15s" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg, #E8F0E8, #D4E6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "2px solid rgba(21,128,61,0.12)" }}>
          {rep.photoURL ? <img src={rep.photoURL} alt={rep.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏛️"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1C2E1E", fontFamily: "var(--font-fraunces), Georgia, serif" }}>{rep.name}</span>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 800, background: partyColor + "18", color: partyColor, border: `1.5px solid ${partyColor}40` }}>
              {PARTY_SHORT[rep.party] || rep.party?.[0] || "?"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6B7C6C", marginTop: 2 }}>{rep.title}</div>
        </div>
      </div>

      {/* Always-visible contact row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {rep.phone && <a href={`tel:${rep.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 11, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>📞 {rep.phone}</a>}
        {rep.link && <a href={rep.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 11, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>🌐 Website</a>}
        {rep.twitter && <a href={`https://x.com/${rep.twitter}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "#f7f7f7", color: "#111", textDecoration: "none", fontSize: 11, fontWeight: 600, border: "1px solid rgba(0,0,0,0.1)" }}><XIcon /> @{rep.twitter}</a>}
        {rep.instagram && <a href={`https://instagram.com/${rep.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "#fdf2f8", color: "#c026d3", textDecoration: "none", fontSize: 11, fontWeight: 600, border: "1px solid rgba(192,38,211,0.2)" }}><InstagramIcon /> @{rep.instagram}</a>}
        {rep.fieldOffices?.length > 0 && (
          <button onClick={() => setOfficesOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, background: "rgba(0,0,0,0.04)", color: "#4A5C4B", fontSize: 11, fontWeight: 600, border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer" }}>
            📍 Local offices
            <span style={{ fontSize: 9, color: "#9CAD9C", transition: "transform 0.15s", transform: officesOpen ? "rotate(180deg)" : "none", display: "inline-block" }}>▾</span>
          </button>
        )}
      </div>

      {/* Local offices drawer */}
      {officesOpen && rep.fieldOffices?.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {rep.fieldOffices.map((o, i) => (
            <a key={i} href={`tel:${o.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 10, background: "rgba(0,0,0,0.04)", color: "#4A5C4B", textDecoration: "none", fontSize: 11, fontWeight: 500, border: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontWeight: 700 }}>{o.city}</span>
              <span style={{ color: "#C8D8C8" }}>·</span>
              {o.phone}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RepsTab({ userZip }) {
  const [zip,     setZip]     = useState(userZip || "")
  const [reps,    setReps]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const z = userZip || localStorage.getItem("userZipCode")
    if (z) { setZip(z); fetchReps(z) }
    else { setError("No zip code found. Add one in Settings."); setLoading(false) }
  }, [userZip])

  function fetchReps(z) {
    setLoading(true); setError(null)
    fetch(`/api/reps?zip=${z}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setReps(d.reps || []) })
      .catch(() => setError("Couldn't load representatives."))
      .finally(() => setLoading(false))
  }

  const president = reps.filter(r => r.role === "president")
  const senators  = reps.filter(r => r.role === "senator")
  const house     = reps.filter(r => r.role === "house")

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 32px 80px" }}>
      {/* Zip input */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, marginLeft: -6 }}>
        <input
          key={zip}
          type="text"
          inputMode="numeric"
          maxLength={5}
          defaultValue={zip}
          placeholder="10001"
          onBlur={e => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 5)
            if (v.length === 5) { setZip(v); localStorage.setItem("userZipCode", v); fetchReps(v) }
            e.target.style.borderColor = "rgba(0,0,0,0.12)"
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5)
              if (v.length === 5) { setZip(v); localStorage.setItem("userZipCode", v); fetchReps(v) }
              e.target.blur()
            }
          }}
          onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.5)"}
          style={{
            width: 72, padding: "3px 10px", fontSize: 11, fontWeight: 600,
            color: "#4A5C4B", background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.12)", borderRadius: 99,
            outline: "none", letterSpacing: "0.08em", textAlign: "center",
            transition: "border-color 0.15s",
          }}
        />
        <span style={{ fontSize: 11, color: "#9CAD9C", fontWeight: 500 }}>Zip code</span>
      </div>

      {loading && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>{[["55%",1],["78%",2],["100%",1]].map(([w,n],i) => <div key={i} style={{ width: w, display: "grid", gridTemplateColumns: `repeat(${n},1fr)`, gap: 10 }}>{Array(n).fill(0).map((_,j) => <div key={j} style={{ height: 100, borderRadius: 16, background: "rgba(0,0,0,0.06)" }} />)}</div>)}</div>}

      {error && <div style={{ textAlign: "center", padding: "48px 20px", color: "#6B7C6C" }}><div style={{ fontSize: 36, marginBottom: 10 }}>🏛️</div><p style={{ fontSize: 13 }}>{error}</p></div>}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          {president.length > 0 && (
            <div style={{ width: "55%", minWidth: 260 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 8 }}>President</div>
              {president.map((r, i) => <RepCard key={i} rep={r} />)}
            </div>
          )}
          {senators.length > 0 && (
            <div style={{ width: "78%", minWidth: 300 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 8 }}>U.S. Senate</div>
              <div style={{ display: "grid", gridTemplateColumns: senators.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
                {senators.map((r, i) => <RepCard key={i} rep={r} />)}
              </div>
            </div>
          )}
          {house.length > 0 && (
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 8 }}>U.S. House of Representatives</div>
              {house.map((r, i) => <RepCard key={i} rep={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
