"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../../../lib/supabase"
import { createClient } from "@/utils/supabase/client"

const CAT_COLOR = {
  "Executive Power":    "#60a5fa",
  "Rule of Law":        "#a78bfa",
  "Economy":            "#34d399",
  "Civil Rights":       "#f87171",
  "National Security":  "#818cf8",
  "Healthcare":         "#f472b6",
  "Environment":        "#6ee7b7",
  "Education & Science":"#67e8f9",
  "Immigration":        "#fb923c",
  "Media & Democracy":  "#fbbf24",
}

const ALL_CATS = [
  "Civil Rights", "Healthcare", "Environment", "Education & Science",
  "Rule of Law", "Executive Power", "Economy", "National Security",
  "Immigration", "Media & Democracy",
]

function NonprofitCard({ org }) {
  const color = CAT_COLOR[org.category] || "#94a3b8"
  const [imgError, setImgError] = useState(false)

  return (
    <div style={{
      background: "#111827",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      transition: "background 0.15s, border-color 0.15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "#1F2937"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)" }}
    onMouseLeave={e => { e.currentTarget.style.background = "#111827"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)" }}
    >
      {/* Header: logo + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: "#0B1120",
          border: "1px solid #334155",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
        }}>
          {!imgError && org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              width={32}
              height={32}
              style={{ objectFit: "contain" }}
              onError={() => setImgError(true)}
            />
          ) : (
            <span style={{ fontSize: 18, lineHeight: 1 }}>🌳</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F1E8", lineHeight: 1.3 }}>
            {org.name}
          </div>
          {org.verified && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              marginTop: 3, fontSize: 10, fontWeight: 600,
              color: "#4ade80", letterSpacing: "0.04em",
            }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5.5" stroke="#4ade80" strokeWidth="1"/>
                <path d="M3.5 6l2 2 3-3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              501(c)(3) VERIFIED
            </div>
          )}
        </div>
      </div>

      {/* Category tag */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        alignSelf: "flex-start",
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: 20, padding: "2px 8px",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.05em" }}>
          {org.category.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: 13, color: "#94a3b8", lineHeight: 1.55,
        margin: 0, flexGrow: 1,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {org.description}
      </p>

      {/* Footer actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
        {org.every_org_slug ? (
          <a
            href={`https://www.every.org/${org.every_org_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#22c55e", color: "#fff",
              fontSize: 12, fontWeight: 700,
              padding: "7px 14px", borderRadius: 6,
              textDecoration: "none", letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            Donate →
          </a>
        ) : org.website ? (
          <a
            href={org.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#22c55e", color: "#fff",
              fontSize: 12, fontWeight: 700,
              padding: "7px 14px", borderRadius: 6,
              textDecoration: "none", letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            Visit →
          </a>
        ) : null}
        {org.website && (
          <a
            href={org.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11, color: "#475569",
              textDecoration: "none",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {org.website.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        )}
      </div>
    </div>
  )
}

export default function DonatePage() {
  const [nonprofits, setNonprofits] = useState([])
  const [loading, setLoading]       = useState(true)
  const [userCats, setUserCats]     = useState([])
  const [browseCat, setBrowseCat]   = useState("All")
  const [carouselIdx, setCarouselIdx] = useState(0)

  useEffect(() => {
    async function loadCats() {
      // Supabase is authoritative — localStorage is just a cache
      const authClient = createClient()
      const { data: { user } } = await authClient.auth.getUser()
      if (user) {
        const { data } = await authClient
          .from("user_prefs")
          .select("categories")
          .eq("user_id", user.id)
          .maybeSingle()
        if (data?.categories?.length) {
          setUserCats(data.categories)
          return
        }
      }
      // Fall back to localStorage for sessions without a Supabase row yet
      try {
        const raw = localStorage.getItem("howbadisite_prefs")
        if (raw) {
          const prefs = JSON.parse(raw)
          if (Array.isArray(prefs.categories)) setUserCats(prefs.categories)
        }
      } catch {}
    }
    loadCats()
  }, [])

  useEffect(() => {
    supabase
      .from("nonprofits")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) setNonprofits(data)
        setLoading(false)
      })
  }, [])

  // For-you pool: one per user category, filling from anywhere if needed
  const forYouPool = (() => {
    const picks = []
    const used = new Set()
    for (const cat of userCats) {
      const match = nonprofits.find(o => o.category === cat && !used.has(o.id))
      if (match) { picks.push(match); used.add(match.id) }
    }
    for (const o of nonprofits) {
      if (!used.has(o.id)) { picks.push(o); used.add(o.id) }
    }
    return picks
  })()

  // Carousel: show 2 at a time
  const maxIdx = Math.max(0, forYouPool.length - 2)
  const visibleForYou = forYouPool.slice(carouselIdx, carouselIdx + 2)
  const forYouIds = new Set(visibleForYou.map(o => o.id))

  // Browse: exclude the 2 currently visible above; 4-col grid
  const browseOrgs = (browseCat === "All"
    ? nonprofits
    : nonprofits.filter(o => o.category === browseCat)
  ).filter(o => !forYouIds.has(o.id))

  const chipStyle = (active) => ({
    padding: "6px 14px",
    borderRadius: 20,
    border: `1px solid ${active ? "#475569" : "rgba(255,255,255,0.07)"}`,
    background: active ? "#111827" : "transparent",
    color: active ? "#F5F1E8" : "#64748b",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.03em",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .np-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1000px) { .np-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .np-grid { grid-template-columns: 1fr; } }
        .fy-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 600px)  { .fy-grid { grid-template-columns: 1fr; } }
        .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
      `}</style>

      {/* Sticky nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(11,17,32,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 52,
          display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 7, fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 10H5M9 5l-5 5 5 5"/>
            </svg>
            Back to Herd
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 32px 80px" }}>

        {/* Page header */}
        <div style={{ marginTop: 32, marginBottom: 48 }}>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 800,
            color: "#F5F1E8",
            fontFamily: "Georgia, 'Times New Roman', serif",
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            Explore Nonprofits
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0, fontWeight: 400 }}>
            Vetted organizations working on the issues you care about.
          </p>
        </div>

        {/* ── FOR YOU section ─────────────────────────────────────────────────── */}
        {userCats.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                color: "#475569", textTransform: "uppercase",
              }}>For You</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              {/* Carousel arrows */}
              {!loading && forYouPool.length > 2 && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setCarouselIdx(i => Math.max(0, i - 2))}
                    disabled={carouselIdx === 0}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: carouselIdx === 0 ? "transparent" : "#111827",
                      color: carouselIdx === 0 ? "#334155" : "#94a3b8",
                      cursor: carouselIdx === 0 ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M13 5l-5 5 5 5"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setCarouselIdx(i => Math.min(maxIdx, i + 2))}
                    disabled={carouselIdx >= maxIdx}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: carouselIdx >= maxIdx ? "transparent" : "#111827",
                      color: carouselIdx >= maxIdx ? "#334155" : "#94a3b8",
                      cursor: carouselIdx >= maxIdx ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M7 5l5 5-5 5"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ color: "#475569", fontSize: 14 }}>Loading…</div>
            ) : visibleForYou.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 14 }}>
                No nonprofits found for your selected topics yet.
              </div>
            ) : (
              <div className="fy-grid">
                {visibleForYou.map(org => (
                  <NonprofitCard key={org.id} org={org} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── BROWSE BY CAUSE section ──────────────────────────────────────────── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
              color: "#475569", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>Browse by Cause</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Filter chips */}
          <div className="chip-row" style={{ marginBottom: 24 }}>
            <button
              onClick={() => setBrowseCat("All")}
              style={chipStyle(browseCat === "All")}
            >
              All
            </button>
            {ALL_CATS.map(cat => {
              const color = CAT_COLOR[cat]
              const isActive = browseCat === cat
              return (
                <button
                  key={cat}
                  onClick={() => setBrowseCat(cat)}
                  style={{
                    ...chipStyle(isActive),
                    ...(isActive ? {
                      background: `${color}15`,
                      border: `1px solid ${color}40`,
                      color,
                    } : {}),
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ color: "#475569", fontSize: 14 }}>Loading…</div>
          ) : browseOrgs.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px 0",
              color: "#475569", fontSize: 14,
            }}>
              No nonprofits in this category yet.
            </div>
          ) : (
            <div className="np-grid">
              {browseOrgs.map(org => (
                <NonprofitCard key={org.id} org={org} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
