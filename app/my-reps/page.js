"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { CAT_COLOR } from "@/lib/colors"
import { ANIMAL_MAP, DEFAULT_ANIMAL } from "@/lib/animals"

const supabase = createClient()

const ROLE_CATEGORIES = {
  president: ["Executive Power", "Foreign Policy", "National Security", "Economy", "Immigration"],
  senator:   ["Rule of Law", "Economy", "Healthcare", "Environment", "Civil Rights", "Elections", "Immigration", "Education", "Science", "Democracy & Media", "Human Rights", "Foreign Policy", "National Security", "Executive Power"],
  house:     ["Economy", "Healthcare", "Education", "Environment", "Civil Rights", "Democracy & Media", "Human Rights", "Science"],
}

const PARTY_COLOR = { Democrat: "#1d4ed8", Republican: "#b91c1c", Independent: "#6b21a8" }
const PARTY_SHORT = { Democrat: "D", Republican: "R", Independent: "I" }

function PartyBadge({ party }) {
  const color = PARTY_COLOR[party] || "#6B7C6C"
  const label = PARTY_SHORT[party] || party?.[0] || "?"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 800,
      background: color + "18", color, border: `1.5px solid ${color}40`, flexShrink: 0,
    }}>{label}</span>
  )
}

function RepCard({ rep, userCategories }) {
  const [open, setOpen] = useState(false)
  const roleCategories = ROLE_CATEGORIES[rep.role] || []
  const sharedCats = roleCategories.filter(c => userCategories.includes(c))
  const displayCats = sharedCats.length ? sharedCats : roleCategories.slice(0, 4)

  return (
    <div
      onClick={() => setOpen(o => !o)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"}
      style={{
        background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16,
        padding: "20px 24px", cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #E8F0E8, #D4E6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, border: "2px solid rgba(21,128,61,0.12)",
        }}>🏛️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1C2E1E", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
              {rep.name}
            </span>
            <PartyBadge party={rep.party} />
          </div>
          <div style={{ fontSize: 12, color: "#6B7C6C", marginTop: 2 }}>{rep.title}</div>
        </div>
        <span style={{ fontSize: 16, color: "#9CAD9C", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>▾</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
        {displayCats.map(cat => (
          <span key={cat} style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
            background: (CAT_COLOR[cat] || "#15803d") + "14",
            color: CAT_COLOR[cat] || "#15803d",
            border: `1px solid ${(CAT_COLOR[cat] || "#15803d")}30`,
          }}>{cat}</span>
        ))}
      </div>

      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", flexWrap: "wrap", gap: 10 }}>
          {rep.phone && (
            <a href={`tel:${rep.phone}`} onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 13, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>
              📞 {rep.phone}
            </a>
          )}
          {rep.link && (
            <a href={rep.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 13, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>
              🌐 Official Website
            </a>
          )}
          {rep.office && (
            <div style={{ width: "100%", fontSize: 12, color: "#9CAD9C", marginTop: 4 }}>📍 {rep.office}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyReps() {
  const [zip,            setZip]            = useState(null)
  const [reps,           setReps]           = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [userCategories, setUserCategories] = useState([])
  const [selectedCat,    setSelectedCat]    = useState("All")
  const [animal,         setAnimal]         = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("user_prefs")
          .select("zip_code, categories, animal_type")
          .eq("user_id", user.id).maybeSingle()
        if (data) {
          if (data.categories?.length) setUserCategories(data.categories)
          if (data.animal_type) setAnimal(data.animal_type)
          if (data.zip_code) { setZip(data.zip_code); fetchReps(data.zip_code); return }
        }
      }
      const savedZip = localStorage.getItem("userZipCode")
      if (savedZip) { setZip(savedZip); fetchReps(savedZip) }
      else { setError("No zip code found. Add one in Settings."); setLoading(false) }
    }
    load()
  }, [])

  async function fetchReps(zipCode) {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/reps?zip=${zipCode}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReps(data.reps || [])
    } catch (e) {
      setError("Couldn't load your representatives. Try again.")
    }
    setLoading(false)
  }

  const president = reps.filter(r => r.role === "president")
  const senators  = reps.filter(r => r.role === "senator")
  const house     = reps.filter(r => r.role === "house")
  const allCats   = ["All", ...Object.keys(CAT_COLOR)]

  function tierVisible(role) {
    if (selectedCat === "All") return true
    return (ROLE_CATEGORIES[role] || []).includes(selectedCat)
  }

  const emoji = animal ? (ANIMAL_MAP?.[animal]?.emoji || "🦌") : "🦌"

  return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "rgba(244,240,230,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="6" r="2.5" fill="white" opacity="0.9"/>
                  <circle cx="4" cy="10" r="2" fill="white" opacity="0.7"/>
                  <circle cx="12" cy="10" r="2" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1C2E1E", fontFamily: "var(--font-fraunces), Georgia, serif" }}>Herd</span>
            </Link>
            <Link href="/" style={{ fontSize: 13, color: "#6B7C6C", textDecoration: "none", fontWeight: 500 }}>← Home</Link>
          </div>
          <div style={{ fontSize: 22 }}>{emoji}</div>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 32px 80px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1C2E1E", margin: "0 0 6px", fontFamily: "var(--font-fraunces), Georgia, serif" }}>My Representatives</h1>
          {zip && <p style={{ fontSize: 13, color: "#6B7C6C", margin: 0 }}>Federal officials for zip code <strong>{zip}</strong></p>}
        </div>

        {/* Category filter strip */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 32 }}>
          {allCats.map(cat => {
            const color = cat === "All" ? "#15803d" : (CAT_COLOR[cat] || "#15803d")
            const active = selectedCat === cat
            return (
              <button key={cat} onClick={() => setSelectedCat(cat)} style={{
                padding: "6px 13px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? color : "rgba(0,0,0,0.06)",
                color: active ? "#fff" : "#4A5C4B",
                transition: "all 0.15s",
              }}>{cat}</button>
            )
          })}
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {[["50%", 1], ["75%", 2], ["100%", 1]].map(([w, n], i) => (
              <div key={i} style={{ width: w, display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 12 }}>
                {Array(n).fill(0).map((_, j) => (
                  <div key={j} style={{ height: 110, borderRadius: 16, background: "rgba(0,0,0,0.06)" }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B7C6C" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
            <p style={{ fontSize: 14 }}>{error}</p>
            <Link href="/settings" style={{ color: "#15803d", fontWeight: 600, fontSize: 13 }}>Go to Settings →</Link>
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

            {/* President — 50% width */}
            {tierVisible("president") && president.length > 0 && (
              <div style={{ width: "55%", minWidth: 280 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>President</div>
                {president.map((rep, i) => <RepCard key={i} rep={rep} userCategories={userCategories} />)}
              </div>
            )}

            {/* Senators — 78% width, 2 columns */}
            {tierVisible("senator") && senators.length > 0 && (
              <div style={{ width: "78%", minWidth: 320 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>U.S. Senate</div>
                <div style={{ display: "grid", gridTemplateColumns: senators.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
                  {senators.map((rep, i) => <RepCard key={i} rep={rep} userCategories={userCategories} />)}
                </div>
              </div>
            )}

            {/* House — 100% width */}
            {tierVisible("house") && house.length > 0 && (
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>U.S. House of Representatives</div>
                {house.map((rep, i) => <RepCard key={i} rep={rep} userCategories={userCategories} />)}
              </div>
            )}

            {!tierVisible("president") && !tierVisible("senator") && !tierVisible("house") && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CAD9C", fontSize: 14 }}>
                No reps directly impact <strong style={{ color: "#4A5C4B" }}>{selectedCat}</strong> — try another category.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
