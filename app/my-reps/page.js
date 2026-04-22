"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { ANIMAL_MAP, DEFAULT_ANIMAL } from "@/lib/animals"

const supabase = createClient()

const PARTY_COLOR = { Democrat: "#1d4ed8", Republican: "#b91c1c", Independent: "#6b21a8" }
const PARTY_SHORT = { Democrat: "D", Republican: "R", Independent: "I" }
const CACHE_TTL = 24 * 60 * 60 * 1000

function XIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function InstagramIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
}

function getCached(zip) {
  try {
    const raw = localStorage.getItem(`reps_cache_${zip}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.cachedAt > CACHE_TTL) return null
    return { reps: parsed.reps, lowAccuracy: parsed.lowAccuracy }
  } catch { return null }
}

function setCache(zip, reps, lowAccuracy) {
  try {
    localStorage.setItem(`reps_cache_${zip}`, JSON.stringify({ reps, lowAccuracy, cachedAt: Date.now() }))
  } catch {}
}

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

function RepCard({ rep }) {
  const [officesOpen, setOfficesOpen] = useState(false)

  return (
    <div
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"}
      style={{
        background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.15s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
          background: "linear-gradient(135deg, #E8F0E8, #D4E6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, border: "2px solid rgba(21,128,61,0.12)",
        }}>
          {rep.photoURL
            ? <img src={rep.photoURL} alt={rep.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.parentNode.innerText = "🏛️" }} />
            : "🏛️"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1C2E1E", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
              {rep.name}
            </span>
            <PartyBadge party={rep.party} />
          </div>
          <div style={{ fontSize: 12, color: "#6B7C6C", marginTop: 2 }}>{rep.title}</div>
        </div>
      </div>

      {/* Always-visible contact row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {rep.phone && (
          <a href={`tel:${rep.phone}`}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 12, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>
            📞 {rep.phone}
          </a>
        )}
        {rep.link && (
          <a href={rep.link} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 10, background: "#F0F7F0", color: "#15803d", textDecoration: "none", fontSize: 12, fontWeight: 600, border: "1px solid rgba(21,128,61,0.2)" }}>
            🌐 Website
          </a>
        )}
        {rep.twitter && (
          <a href={`https://x.com/${rep.twitter}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 10, background: "#f7f7f7", color: "#111", textDecoration: "none", fontSize: 12, fontWeight: 600, border: "1px solid rgba(0,0,0,0.1)" }}>
            <XIcon /> @{rep.twitter}
          </a>
        )}
        {rep.instagram && (
          <a href={`https://instagram.com/${rep.instagram}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 10, background: "#fdf2f8", color: "#c026d3", textDecoration: "none", fontSize: 12, fontWeight: 600, border: "1px solid rgba(192,38,211,0.2)" }}>
            <InstagramIcon /> @{rep.instagram}
          </a>
        )}
        {rep.fieldOffices?.length > 0 && (
          <button onClick={() => setOfficesOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 10, background: "rgba(0,0,0,0.04)", color: "#4A5C4B", fontSize: 12, fontWeight: 600, border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer" }}>
            📍 Local offices
            <span style={{ fontSize: 10, color: "#9CAD9C", transition: "transform 0.15s", transform: officesOpen ? "rotate(180deg)" : "none", display: "inline-block" }}>▾</span>
          </button>
        )}
      </div>

      {/* Local offices drawer */}
      {officesOpen && rep.fieldOffices?.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {rep.fieldOffices.map((o, i) => (
            <a key={i} href={`tel:${o.phone}`}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "rgba(0,0,0,0.04)", color: "#4A5C4B", textDecoration: "none", fontSize: 12, fontWeight: 500, border: "1px solid rgba(0,0,0,0.07)" }}>
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

export default function MyReps() {
  const [zip,         setZip]         = useState(null)
  const [zipInput,    setZipInput]    = useState("")
  const [reps,        setReps]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lowAccuracy, setLowAccuracy] = useState(false)
  const [animal,      setAnimal]      = useState(null)
  const [activeTab,    setActiveTab]   = useState("Federal")
  const [stateReps,    setStateReps]   = useState({ senate: [], assembly: [] })
  const [stateLoading, setStateLoading] = useState(null)
  const [stateError,   setStateError]  = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("user_prefs")
          .select("zip_code, animal_type")
          .eq("user_id", user.id).maybeSingle()
        if (data) {
          if (data.animal_type) setAnimal(data.animal_type)
          if (data.zip_code) { setZip(data.zip_code); setZipInput(data.zip_code); fetchReps(data.zip_code); return }
        }
      }
      try {
        const prefs = JSON.parse(localStorage.getItem("howbadisite_prefs") || "{}")
        const z = prefs.zip || localStorage.getItem("userZipCode")
        if (z) { setZip(z); setZipInput(z); fetchReps(z); return }
      } catch {}
      setError("No zip code found. Enter one below."); setLoading(false)
    }
    load()
  }, [])

  async function fetchReps(z, bust = false) {
    if (!bust) {
      const cached = getCached(z)
      if (cached) { setReps(cached.reps); setLowAccuracy(cached.lowAccuracy); setLoading(false); return }
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/reps?zip=${z}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReps(data.reps || [])
      setLowAccuracy(data.lowAccuracy || false)
      setCache(z, data.reps || [], data.lowAccuracy || false)
    } catch (e) {
      setError("Couldn't load your representatives.")
    }
    setLoading(false)
  }

  function handleZipSubmit() {
    const v = zipInput.trim()
    if (!/^\d{5}$/.test(v)) return
    try {
      const prefs = JSON.parse(localStorage.getItem("howbadisite_prefs") || "{}")
      localStorage.setItem("howbadisite_prefs", JSON.stringify({ ...prefs, zip: v }))
      localStorage.setItem("userZipCode", v)
    } catch {}
    setZip(v)
    fetchReps(v, true)
    setError(null)
  }

  async function fetchStateReps(z, bust = false) {
    if (!bust) {
      try {
        const raw = localStorage.getItem(`state_reps_cache_${z}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Date.now() - parsed.cachedAt <= CACHE_TTL) {
            setStateReps(parsed.data); setStateLoading(false); return
          }
        }
      } catch {}
    }
    setStateLoading(true); setStateError(null)
    try {
      const res = await fetch(`/api/reps/state?zip=${z}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const result = { senate: data.senate || [], assembly: data.assembly || [] }
      setStateReps(result)
      try { localStorage.setItem(`state_reps_cache_${z}`, JSON.stringify({ data: result, cachedAt: Date.now() })) } catch {}
    } catch { setStateError("Couldn't load state reps for this zip.") }
    setStateLoading(false)
  }

  useEffect(() => {
    if (activeTab === "State" && zip) fetchStateReps(zip)
  }, [activeTab, zip])

  const president = reps.filter(r => r.role === "president")
  const senators  = reps.filter(r => r.role === "senator")
  const house     = reps.filter(r => r.role === "house")

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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1C2E1E", margin: "0 0 6px", fontFamily: "var(--font-fraunces), Georgia, serif" }}>My Representatives</h1>
          {zip && <p style={{ fontSize: 13, color: "#6B7C6C", margin: 0 }}>Federal officials for zip code <strong>{zip}</strong></p>}
        </div>

        {/* Zip input */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zipInput}
            onChange={e => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="10001"
            onKeyDown={e => e.key === "Enter" && handleZipSubmit()}
            onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
            style={{
              width: 72, padding: "3px 10px", fontSize: 11, fontWeight: 600,
              color: "#4A5C4B", background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.12)", borderRadius: 99,
              outline: "none", letterSpacing: "0.08em", textAlign: "center",
              transition: "border-color 0.15s",
            }}
          />
          <button
            onClick={handleZipSubmit}
            style={{ padding: "3px 12px", borderRadius: 99, border: "1px solid rgba(21,128,61,0.3)", background: "#F0F7F0", color: "#15803d", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >Update</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 28 }}>
          {["Federal", "State", "Local"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = "#4A5C4B" }}
              onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = "#9CAD9C" }}
              style={{
                padding: "10px 14px", fontSize: 13, background: "none", border: "none", cursor: "pointer",
                fontWeight: activeTab === tab ? 800 : 500,
                color: activeTab === tab ? "#1C2E1E" : "#9CAD9C",
                borderBottom: activeTab === tab ? "3px solid #15803d" : "3px solid transparent",
                marginBottom: -1, transition: "color 0.15s",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Federal tab */}
        {activeTab === "Federal" && (
          <>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                {[["55%", 1], ["78%", 2], ["100%", 1]].map(([w, n], i) => (
                  <div key={i} style={{ width: w, display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 12 }}>
                    {Array(n).fill(0).map((_, j) => (
                      <div key={j} style={{ height: 90, borderRadius: 16, background: "rgba(0,0,0,0.06)" }} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B7C6C" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
                <p style={{ fontSize: 14, marginBottom: 16 }}>{error}</p>
                {zip && (
                  <button onClick={() => fetchReps(zip, true)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(21,128,61,0.3)", background: "#F0F7F0", color: "#15803d", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Try again
                  </button>
                )}
              </div>
            )}

            {!loading && !error && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

                {president.length > 0 && (
                  <div style={{ width: "55%", minWidth: 280 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>President</div>
                    {president.map((rep, i) => <RepCard key={i} rep={rep} />)}
                  </div>
                )}

                {senators.length > 0 && (
                  <div style={{ width: "78%", minWidth: 320 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>U.S. Senate</div>
                    <div style={{ display: "grid", gridTemplateColumns: senators.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
                      {senators.map((rep, i) => <RepCard key={i} rep={rep} />)}
                    </div>
                  </div>
                )}

                {house.length > 0 && (
                  <div style={{ width: "100%" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>U.S. House of Representatives</div>
                    {house.map((rep, i) => <RepCard key={i} rep={rep} />)}
                  </div>
                )}

                {lowAccuracy && (
                  <p style={{ fontSize: 11, color: "#9CAD9C", margin: "4px 0 0", textAlign: "center" }}>
                    District based on zip code — may not be exact
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* State tab */}
        {activeTab === "State" && (
          <>
            {stateLoading === true && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 90, borderRadius: 16, background: "rgba(0,0,0,0.06)" }} />
                ))}
              </div>
            )}

            {stateLoading === false && stateError && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B7C6C" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
                <p style={{ fontSize: 14, marginBottom: 16 }}>{stateError}</p>
                {zip && (
                  <button onClick={() => fetchStateReps(zip, true)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(21,128,61,0.3)", background: "#F0F7F0", color: "#15803d", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Try again
                  </button>
                )}
              </div>
            )}

            {stateLoading === false && !stateError && stateReps.senate.length === 0 && stateReps.assembly.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B7C6C" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
                <p style={{ fontSize: 14 }}>No state reps found for this zip.</p>
              </div>
            )}

            {stateLoading === false && !stateError && (stateReps.senate.length > 0 || stateReps.assembly.length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {stateReps.senate.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>NY State Senate</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {stateReps.senate.map((rep, i) => <RepCard key={i} rep={rep} />)}
                    </div>
                  </div>
                )}
                {stateReps.assembly.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CAD9C", textAlign: "center", marginBottom: 10 }}>NY State Assembly</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {stateReps.assembly.map((rep, i) => <RepCard key={i} rep={rep} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Local tab */}
        {activeTab === "Local" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CAD9C" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4A5C4B", marginBottom: 4 }}>Local representatives</div>
            <div style={{ fontSize: 12 }}>In production</div>
          </div>
        )}
      </div>
    </div>
  )
}
