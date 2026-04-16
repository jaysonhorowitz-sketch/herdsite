"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { NL_MAINSTREAM, NL_SUBSTACK } from "../../../lib/newsletters"
import { CAT_COLOR } from "@/lib/colors"

const ALL_CATS = [
  "Executive Power", "Rule of Law", "Economy", "Civil Rights",
  "National Security", "Healthcare", "Environment", "Education & Science",
  "Immigration", "Media & Democracy",
]

function NewsletterCard({ nl, isSubstack }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#D8D4C6" : "#FDFAF3",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 10,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E", lineHeight: 1.3 }}>
          {nl.name}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 4, flexShrink: 0,
          background: isSubstack ? "rgba(255,102,0,0.1)"   : "rgba(22,163,74,0.1)",
          color:      isSubstack ? "#fb923c"               : "#16a34a",
          border:     `1px solid ${isSubstack ? "rgba(255,102,0,0.25)" : "rgba(22,163,74,0.25)"}`,
        }}>
          {isSubstack ? "Substack" : "Newsletter"}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#5A6B5B", lineHeight: 1.6, margin: 0, flex: 1 }}>
        {nl.description}
      </p>
      <a
        href={nl.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 12, fontWeight: 700, color: "#16a34a",
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
          marginTop: "auto",
        }}
      >
        Subscribe →
      </a>
    </div>
  )
}

export default function NewslettersPage() {
  const [userCats, setUserCats] = useState(null) // null = loading
  const [browseCat, setBrowseCat] = useState("all") // "all" | specific cat

  useEffect(() => {
    async function loadCats() {
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
      // Fall back to localStorage
      try {
        const raw = localStorage.getItem("howbadisite_prefs")
        if (raw) {
          const prefs = JSON.parse(raw)
          if (Array.isArray(prefs.categories) && prefs.categories.length) {
            setUserCats(prefs.categories)
            return
          }
        }
      } catch {}
      setUserCats([]) // no prefs — show all
    }
    loadCats()
  }, [])

  const loading = userCats === null

  // Which categories to display: user's picks, or all if none saved
  const displayCats = browseCat === "all"
    ? (userCats?.length ? userCats : ALL_CATS)
    : [browseCat]

  const chipStyle = (active) => ({
    padding: "5px 13px",
    borderRadius: 20,
    border: `1px solid ${active ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.07)"}`,
    background: active ? "#FDFAF3" : "transparent",
    color: active ? "#1C2E1E" : "#5A6B5B",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    letterSpacing: "0.03em", transition: "all 0.15s", whiteSpace: "nowrap",
  })

  return (
    <div style={{ minHeight: "100vh", background: "#F4F0E6", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Sticky nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(244,240,230,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 52,
          display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 13, color: "#5A6B5B", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 7, fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 10H5M9 5l-5 5 5 5"/>
            </svg>
            Back to Herd
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px 80px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "#4A5C4B", marginBottom: 10 }}>Stay Informed</div>
          <h1 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700,
            color: "#1C2E1E", margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>Newsletters worth reading</h1>
          <p style={{ fontSize: 14, color: "#5A6B5B", margin: 0, maxWidth: 520, lineHeight: 1.7 }}>
            Curated newsletters and Substacks for the issues you follow — mainstream reporting and independent voices, side by side.
          </p>
        </div>

        {/* Filter chips */}
        {!loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
            <button
              onClick={() => setBrowseCat("all")}
              style={chipStyle(browseCat === "all")}
            >
              {userCats?.length ? "My Topics" : "All Topics"}
            </button>
            {ALL_CATS.map(cat => {
              const color = CAT_COLOR[cat]
              const isActive = browseCat === cat
              const isUserCat = userCats?.includes(cat)
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
                    ...(isUserCat && !isActive ? { color: "#6B7C6C" } : {}),
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ color: "#4A5C4B", fontSize: 14, padding: "40px 0" }}>Loading…</div>
        )}

        {/* Newsletter sections */}
        {!loading && displayCats.map(cat => {
          const mainstream = NL_MAINSTREAM[cat] || []
          const substack   = NL_SUBSTACK[cat]   || []
          const all        = [
            ...mainstream.map(nl => ({ ...nl, isSubstack: false })),
            ...substack.map(nl   => ({ ...nl, isSubstack: true  })),
          ]
          if (!all.length) return null

          const color = CAT_COLOR[cat] || "#6B7C6C"

          return (
            <section key={cat} style={{ marginBottom: 56 }}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#4A5C4B" }}>{cat}</span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
                <span style={{ fontSize: 11, color: "#334155", flexShrink: 0 }}>
                  {mainstream.length} newsletters · {substack.length} Substacks
                </span>
              </div>

              {/* Cards grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14,
              }}
                className="nl-grid"
              >
                {all.map((nl, i) => (
                  <NewsletterCard key={i} nl={nl} isSubstack={nl.isSubstack} />
                ))}
              </div>
            </section>
          )
        })}

        {/* Empty state — no prefs and browsing "My Topics" */}
        {!loading && userCats?.length === 0 && browseCat === "all" && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4A5C4B" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📰</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#5A6B5B", marginBottom: 8 }}>
              No topics selected yet
            </p>
            <p style={{ fontSize: 13, color: "#6B7C6C", marginBottom: 24 }}>
              Pick topics during onboarding to see personalized recommendations here.
            </p>
            <Link href="/onboarding" style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              padding: "9px 20px", borderRadius: 6, background: "#15803d",
              textDecoration: "none",
            }}>Set up my topics →</Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px)  { .nl-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px)  { .nl-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
