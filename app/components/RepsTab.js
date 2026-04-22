"use client"
import { useEffect, useState } from "react"
import { CAT_COLOR } from "@/lib/colors"

const ROLE_CATEGORIES = {
  president: ["Executive Power", "Foreign Policy", "National Security", "Economy", "Immigration"],
  senator:   ["Rule of Law", "Economy", "Healthcare", "Environment", "Civil Rights", "Elections", "Immigration", "Education", "Science", "Democracy & Media", "Human Rights", "Foreign Policy", "National Security", "Executive Power"],
  house:     ["Economy", "Healthcare", "Education", "Environment", "Civil Rights", "Democracy & Media", "Human Rights", "Science"],
}
const PARTY_COLOR = { Democrat: "#1d4ed8", Republican: "#b91c1c", Independent: "#6b21a8" }
const PARTY_SHORT  = { Democrat: "D", Republican: "R", Independent: "I" }

function RepCard({ rep, userCategories }) {
  const [open, setOpen] = useState(false)
  const roleCategories = ROLE_CATEGORIES[rep.role] || []
  const sharedCats = roleCategories.filter(c => userCategories.includes(c))
  const displayCats = sharedCats.length ? sharedCats : roleCategories.slice(0, 4)
  const partyColor = PARTY_COLOR[rep.party] || "#6B7C6C"

  return (
    <div onClick={e => { if (!e.target.closest("a")) setOpen(o => !o) }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"}
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "18px 22px", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.15s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #E8F0E8, #D4E6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "2px solid rgba(21,128,61,0.12)" }}>🏛️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1C2E1E", fontFamily: "var(--font-fraunces), Georgia, serif" }}>{rep.name}</span>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 800, background: partyColor + "18", color: partyColor, border: `1.5px solid ${partyColor}40` }}>
              {PARTY_SHORT[rep.party] || rep.party?.[0] || "?"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6B7C6C", marginTop: 2 }}>{rep.title}</div>
        </div>
        <span style={{ fontSize: 14, color: "#9CAD9C", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>▾</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
        {displayCats.map(cat => (
          <span key={cat} style={{ fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: (CAT_COLOR[cat] || "#15803d") + "14", color: CAT_COLOR[cat] || "#15803d", border: `1px solid ${(CAT_COLOR[cat] || "#15803d")}30` }}>{cat}</span>
        ))}
      </div>
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {rep.phone && <a href={`tel:${rep.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 12, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>📞 {rep.phone}</a>}
          {rep.link && <a href={rep.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 12, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>🌐 Official Website</a>}
          {rep.office && <div style={{ width: "100%", fontSize: 11, color: "#9CAD9C", marginTop: 2 }}>📍 {rep.office}</div>}
        </div>
      )}
    </div>
  )
}

export default function RepsTab({ userCategories, userZip }) {
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
              {president.map((r, i) => <RepCard key={i} rep={r} userCategories={userCategories} />)}
            </div>
          )}
          {senators.length > 0 && (
            <div style={{ width: "78%", minWidth: 300 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 8 }}>U.S. Senate</div>
              <div style={{ display: "grid", gridTemplateColumns: senators.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
                {senators.map((r, i) => <RepCard key={i} rep={r} userCategories={userCategories} />)}
              </div>
            </div>
          )}
          {house.length > 0 && (
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 8 }}>U.S. House of Representatives</div>
              {house.map((r, i) => <RepCard key={i} rep={r} userCategories={userCategories} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
