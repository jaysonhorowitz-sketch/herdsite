"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

const supabase = createClient(
  "https://mwahckdqmiopkzrmdxyc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWhja2RxbWlvcGt6cm1keHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDgxMjgsImV4cCI6MjA4ODkyNDEyOH0.0Ua6sM8_zLzCdjJ8SGX-MVFkbbbyzDvrjtZuRoZVVxM"
)

const PARTY_STYLE = {
  R: { bg: "rgba(239,68,68,0.15)",  color: "#f87171", label: "Republican" },
  D: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa", label: "Democrat"   },
  I: { bg: "rgba(148,163,184,0.12)",color: "#94a3b8", label: "Independent"},
}

function PartyBadge({ party }) {
  const s = PARTY_STYLE[party] || PARTY_STYLE.I
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: 3,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  )
}

function LegCard({ rep }) {
  const [imgOk, setImgOk] = useState(true)

  const chamberLabel = rep.chamber === "senate"
    ? `Senator · ${rep.state}`
    : `Rep. · ${rep.state}${rep.district ? `-${rep.district}` : ""}`

  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "24px",
      display: "flex", flexDirection: "column", gap: 16,
      flex: 1,
    }}>
      {/* Photo + name */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{
          width: 64, height: 78, borderRadius: 5, overflow: "hidden", flexShrink: 0,
          background: "#0f172a",
        }}>
          {imgOk && rep.photo_url ? (
            <img
              src={rep.photo_url}
              alt={rep.name}
              onError={() => setImgOk(false)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, marginBottom: 6 }}>
            {rep.name}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <PartyBadge party={rep.party} />
            <span style={{ fontSize: 11, color: "#64748b" }}>{chamberLabel}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* Call button */}
      {rep.phone ? (
        <a
          href={`tel:${rep.phone.replace(/[^0-9+]/g, "")}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#1d4ed8", color: "#fff",
            padding: "10px 16px", borderRadius: 5,
            fontWeight: 700, fontSize: 13, letterSpacing: "0.02em",
            textDecoration: "none", transition: "background 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07A19.5 19.5 0 013.07 11 19.8 19.8 0 01.02 2.28 2 2 0 012 .1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          Call now · {rep.phone}
        </a>
      ) : (
        <div style={{ fontSize: 12, color: "#475569", textAlign: "center" }}>Phone not available</div>
      )}

      {/* Committees */}
      {rep.committees?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Committees
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {rep.committees.slice(0, 4).map((c, i) => (
              <div key={i} style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>· {c}</div>
            ))}
          </div>
        </div>
      )}

      {/* Website */}
      {rep.website && (
        <a
          href={rep.website}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none", letterSpacing: "0.02em" }}
        >
          Official website ↗
        </a>
      )}
    </div>
  )
}

export default function CallPage() {
  const [zip,       setZip]       = useState("")
  const [reps,      setReps]      = useState(null)   // [{name,party,state,district,phone,chamber,photo_url,committees,website}]
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [multiDist, setMultiDist] = useState(false)
  const [issues,    setIssues]    = useState([])

  // Load top issues for the script section
  useEffect(() => {
    let prefs = null
    try { prefs = JSON.parse(localStorage.getItem("howbadisite_prefs") || "null") } catch {}
    const cats = prefs?.categories || []
    supabase.from("issues").select("title, category, severity_score")
      .eq("is_published", true)
      .order("severity_score", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return
        const filtered = cats.length
          ? data.filter(i => cats.includes(i.category))
          : data
        setIssues(filtered.slice(0, 3))
      })
  }, [])

  useEffect(() => {
    const storedZip = localStorage.getItem("userZipCode")
    if (!storedZip) { setLoading(false); return }
    setZip(storedZip)
    lookupReps(storedZip)
  }, [])

  async function lookupReps(z) {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/reps?zip=${z}`)
      const data = await res.json()

      if (data.error || !data.results?.length) {
        throw new Error(data.error || "No representatives found for this zip code.")
      }

      const results = data.results
      // Detect if multiple house reps returned (split zip)
      const houseReps = results.filter(r => r.district !== "" && r.district !== undefined)
      if (houseReps.length > 1) setMultiDist(true)

      // Parse out state from any result
      const state = results[0]?.state

      // Enrich with Supabase data (committees, photo)
      const { data: dbReps } = await supabase
        .from("legislators")
        .select("*")
        .eq("state", state)
        .or("chamber.eq.senate,chamber.eq.house")

      function enrich(apiRep) {
        const isSen = apiRep.district === "" || apiRep.district === undefined
        const dist  = isSen ? null : parseInt(apiRep.district)
        const match = dbReps?.find(d =>
          isSen
            ? d.chamber === "senate" && d.name === apiRep.name
            : d.chamber === "house"  && d.district === dist
        ) || dbReps?.find(d =>
          // Fallback: fuzzy name match
          d.name.split(" ").pop() === apiRep.name.split(" ").pop() &&
          (isSen ? d.chamber === "senate" : d.chamber === "house")
        )

        return {
          name:        apiRep.name,
          party:       apiRep.party,
          state:       apiRep.state,
          district:    dist,
          phone:       apiRep.phone || match?.phone || null,
          chamber:     isSen ? "senate" : "house",
          photo_url:   match?.photo_url || null,
          committees:  match?.committees || [],
          website:     apiRep.link || match?.website || null,
        }
      }

      // Deduplicate: 2 senators + 1 house rep
      const senators   = results.filter(r => r.district === "" || r.district === undefined).slice(0, 2)
      const houseRep   = houseReps[0]
      const enriched   = [...senators, ...(houseRep ? [houseRep] : [])].map(enrich)

      setReps(enriched)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleZipSubmit(e) {
    e.preventDefault()
    const val = e.target.zipInput.value.trim()
    if (!/^\d{5}$/.test(val)) return
    localStorage.setItem("userZipCode", val)
    setZip(val)
    lookupReps(val)
  }

  const topIssue = issues[0]?.title || "the issues affecting your community"

  return (
    <div style={{
      minHeight: "100vh", background: "#111827",
      fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0",
    }}>
      {/* Nav */}
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "20px 32px",
        display: "flex", alignItems: "center",
      }}>
        <Link href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 10H5M9 5l-5 5 5 5"/>
          </svg>
          Back to Herd
        </Link>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 64px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>
            Take Action
          </div>
          <h1 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700,
            color: "#f1f5f9", margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>Call your representatives</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, maxWidth: 560, lineHeight: 1.7 }}>
            Your voice matters. Calls are more effective than emails — most offices track call volume on specific issues.
          </p>
        </div>

        {/* Zip entry / change */}
        <div style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {zip ? (
            <>
              <span style={{ fontSize: 13, color: "#64748b" }}>Showing reps for zip <strong style={{ color: "#94a3b8" }}>{zip}</strong></span>
              <form onSubmit={handleZipSubmit} style={{ display: "flex", gap: 8 }}>
                <input
                  name="zipInput"
                  placeholder="Change zip…"
                  maxLength={5}
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4, padding: "5px 10px", color: "#f1f5f9", fontSize: 12, width: 110,
                  }}
                />
                <button type="submit" style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4, padding: "5px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer",
                }}>Update</button>
              </form>
            </>
          ) : (
            <form onSubmit={handleZipSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Enter your zip code to find your reps:</span>
              <input
                name="zipInput"
                placeholder="e.g. 10001"
                maxLength={5}
                style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 4, padding: "7px 12px", color: "#f1f5f9", fontSize: 13, width: 120,
                }}
              />
              <button type="submit" style={{
                background: "#1d4ed8", border: "none", borderRadius: 4,
                padding: "7px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Find my reps</button>
            </form>
          )}
        </div>

        {/* Split zip warning */}
        {multiDist && (
          <div style={{
            marginBottom: 20, padding: "10px 16px", borderRadius: 5,
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
            fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>⚠</span>
            <span>Multiple districts cover your zip — verify your exact rep at{" "}
              <a href="https://www.house.gov/representatives/find-your-representative" target="_blank" rel="noopener noreferrer" style={{ color: "#fbbf24" }}>house.gov</a>.
            </span>
            <a href="#" style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 11 }}>Enter street address for accuracy</a>
          </div>
        )}

        {/* Suggested script */}
        {reps && reps.length > 0 && (
          <div style={{
            marginBottom: 36, padding: "24px 28px",
            background: "rgba(29,78,216,0.08)", border: "1px solid rgba(29,78,216,0.2)",
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#60a5fa", marginBottom: 14 }}>
              Suggested script
            </div>
            <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.9, margin: 0 }}>
              "Hello, my name is <em style={{ color: "#94a3b8" }}>[your name]</em> and I'm a constituent calling from zip code {zip}.
              I'm calling to urge {reps[0]?.name?.split(" ").slice(-1)[0]} to take action on <strong style={{ color: "#f1f5f9" }}>{topIssue}</strong>.
              This issue is critically important to me and my community.
              Can you tell me where {reps[0]?.name?.split(" ").slice(-1)[0]} stands on this, and what steps they're taking?"
            </p>
            {issues.length > 1 && (
              <p style={{ fontSize: 12, color: "#475569", margin: "12px 0 0", lineHeight: 1.7 }}>
                Also consider asking about: {issues.slice(1).map(i => i.title).join(" · ")}
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#475569", fontSize: 13, padding: "40px 0" }}>
            <div style={{ width: 16, height: 16, border: "2px solid #1d4ed8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Looking up your representatives…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: "20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Rep cards */}
        {reps && !loading && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {reps.map((rep, i) => (
              <LegCard key={i} rep={rep} />
            ))}
          </div>
        )}

        {/* No zip yet */}
        {!zip && !loading && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#374151" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📞</div>
            <p style={{ fontSize: 14, margin: 0 }}>Enter your zip code above to see your senators and house rep.</p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .rep-cards { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
