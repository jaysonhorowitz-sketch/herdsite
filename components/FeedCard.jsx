"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CAT_COLOR } from "@/lib/colors"

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

function truncateToSentences(text, wordLimit = 30) {
  if (!text) return text
  const words = text.trim().split(/\s+/)
  if (words.length <= wordLimit) return text
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  let result = ""
  let count = 0
  for (const s of sentences) {
    const w = s.trim().split(/\s+/).length
    if (count + w > wordLimit) break
    result += (result ? " " : "") + s.trim()
    count += w
  }
  return result || sentences[0].trim()
}

function severityTier(s) {
  if (s >= 9) return { label: "severe impact",  color: "#ef4444" }
  if (s >= 7) return { label: "major impact",   color: "#fb923c" }
  if (s >= 4) return { label: "notable impact", color: "#fbbf24" }
  return             { label: "worth watching", color: "#6B7C6C" }
}

export default function FeedCard({ issue, weekCount, isArchived, onArchive, onCatClick, followActionCount, flippable = false }) {
  const tier     = severityTier(issue.severity_score)
  const catColor = CAT_COLOR[issue.category] || "#6B7C6C"
  const rgb      = hexToRgb(catColor)
  const router   = useRouter()
  const [hovered,       setHovered]       = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    if (!flippable) return
    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(rmq.matches)
    const onRm = e => setReducedMotion(e.matches)
    rmq.addEventListener("change", onRm)

    const hmq = window.matchMedia("(hover: none)")
    setIsTouchDevice(hmq.matches)
    const onHm = e => setIsTouchDevice(e.matches)
    hmq.addEventListener("change", onHm)

    return () => {
      rmq.removeEventListener("change", onRm)
      hmq.removeEventListener("change", onHm)
    }
  }, [flippable])

  // ── Non-flippable: original card with description ──────────────────────────
  if (!flippable) {
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onArchive(issue.slug) }}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 2,
            background: isArchived ? `rgba(${rgb},0.12)` : "none",
            border: "none", cursor: "pointer",
            color: isArchived ? catColor : "#C5BFB0",
            fontSize: 15, padding: "4px 5px", lineHeight: 1,
            transition: "color 0.15s, background 0.15s",
            borderRadius: 4,
          }}
          title={isArchived ? "Remove from archive" : "Save to archive"}
        >{isArchived ? "★" : "☆"}</button>

        <Link
          href={"/issue/" + issue.slug}
          onClick={() => onCatClick(issue.category)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            textDecoration: "none", color: "inherit",
            display: "flex", flexDirection: "column",
            height: "100%", minHeight: 220,
            background: hovered ? "#FDFAF3" : "#fff",
            borderRadius: 16,
            borderTop: `2px solid ${catColor}`,
            borderRight: `1px solid ${hovered ? `rgba(${rgb},0.25)` : "rgba(0,0,0,0.07)"}`,
            borderBottom: `1px solid ${hovered ? `rgba(${rgb},0.25)` : "rgba(0,0,0,0.07)"}`,
            borderLeft: `1px solid ${hovered ? `rgba(${rgb},0.25)` : "rgba(0,0,0,0.07)"}`,
            boxShadow: hovered
              ? `0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(${rgb},0.12)`
              : "0 2px 8px rgba(0,0,0,0.05)",
            padding: "20px 20px 18px",
            transform: hovered ? "translateY(-3px)" : "translateY(0)",
            transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s, background 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingRight: 24 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5A6B5B" }}>
              {issue.category}
            </span>
            <span className="hidden lg:inline" style={{ fontSize: 10, color: "#A8B5A9", fontWeight: 500, letterSpacing: "0.02em" }}>{issue.date}</span>
          </div>

          <h2 className="text-sm lg:text-base" style={{ fontWeight: 800, margin: "0 0 12px", color: "#1a2e1c",
            lineHeight: 1.35, letterSpacing: "-0.02em",
            fontFamily: "var(--font-fraunces), Georgia, serif",
            flex: "0 0 auto",
          }}>
            {issue.title}
          </h2>

          <p style={{ color: "#5A6B5B", fontSize: 13, lineHeight: 1.65, margin: "0 0 16px", flex: 1 }}>
            {truncateToSentences(issue.description)}
          </p>

          {followActionCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
              <span style={{ fontSize: 13 }}>👥</span>
              <span style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600 }}>
                {followActionCount} {followActionCount === 1 ? "person" : "people"} you follow took action
              </span>
            </div>
          )}

          <div style={{ flexShrink: 0 }}>
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 14 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div className="hidden md:flex" style={{ alignItems: "center", gap: 5 }}>
                <span className="sev-pulse" style={{ "--c": tier.color }} />
                <span className="hidden md:inline" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6B5B" }}>
                  {tier.label}
                </span>
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "5px 12px", borderRadius: 6,
                background: "rgba(21,128,61,0.1)",
                border: "1px solid rgba(21,128,61,0.3)",
                color: "#15803d", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
              }}><span className="hidden sm:inline">Take Action </span>→</span>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // ── Flippable card (hover = flip, click = navigate) ────────────────────────
  const isFlipped = hovered && !isTouchDevice

  const navigate = () => { onCatClick(issue.category); router.push("/issue/" + issue.slug) }

  const faceBase = {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    background: "#fff",
    borderRadius: 16,
    borderTop: `2px solid ${catColor}`,
    borderRight: "1px solid rgba(0,0,0,0.07)",
    borderBottom: "1px solid rgba(0,0,0,0.07)",
    borderLeft: "1px solid rgba(0,0,0,0.07)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    padding: "20px 20px 18px",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow: "hidden",
  }

  return (
    <div
      style={{ perspective: "1000px", position: "relative", height: "100%", minHeight: 220, cursor: "pointer" }}
      onMouseLeave={() => setHovered(false)}
      onClick={navigate}
    >
      <div style={{
        position: "relative", height: "100%", minHeight: 220,
        transformStyle: "preserve-3d",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: reducedMotion ? "none" : "transform 0.35s ease",
      }}>

        {/* ── FRONT ── */}
        <div style={faceBase}>
          <button
            onClick={e => { e.stopPropagation(); onArchive(issue.slug) }}
            style={{
              position: "absolute", top: 16, right: 16, zIndex: 2,
              background: isArchived ? `rgba(${rgb},0.12)` : "none",
              border: "none", cursor: "pointer",
              color: isArchived ? catColor : "#C5BFB0",
              fontSize: 15, padding: "4px 5px", lineHeight: 1,
              transition: "color 0.15s, background 0.15s",
              borderRadius: 4,
            }}
            title={isArchived ? "Remove from archive" : "Save to archive"}
          >{isArchived ? "★" : "☆"}</button>

          {/* Top section — hovering here triggers flip */}
          <div onMouseEnter={() => setHovered(true)} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingRight: 24 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5A6B5B" }}>
                {issue.category}
              </span>
              <span className="hidden lg:inline" style={{ fontSize: 10, color: "#A8B5A9", fontWeight: 500, letterSpacing: "0.02em" }}>{issue.date}</span>
            </div>

            <h2 className="text-sm lg:text-base" style={{
              fontWeight: 800, margin: "0 0 12px", color: "#1a2e1c",
              lineHeight: 1.35, letterSpacing: "-0.02em",
              fontFamily: "var(--font-fraunces), Georgia, serif",
              flex: 1,
            }}>
              {issue.title}
            </h2>

            {followActionCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
                <span style={{ fontSize: 13 }}>👥</span>
                <span style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600 }}>
                  {followActionCount} {followActionCount === 1 ? "person" : "people"} you follow took action
                </span>
              </div>
            )}
          </div>

          {/* Bottom section — hovering here cancels flip so Take Action is usable */}
          <div onMouseEnter={() => setHovered(false)} style={{ flexShrink: 0 }}>
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 14 }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div className="hidden md:flex" style={{ alignItems: "center", gap: 5 }}>
                <span className="sev-pulse" style={{ "--c": tier.color }} />
                <span className="hidden md:inline" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6B5B" }}>
                  {tier.label}
                </span>
              </div>
              <span
                onClick={e => { e.stopPropagation(); onCatClick(issue.category); router.push("/issue/" + issue.slug) }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "5px 12px", borderRadius: 6,
                  background: "rgba(21,128,61,0.1)",
                  border: "1px solid rgba(21,128,61,0.3)",
                  color: "#15803d", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              ><span className="hidden sm:inline">Take Action </span>→</span>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div style={{ ...faceBase, transform: "rotateY(180deg)", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingRight: 24 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5A6B5B" }}>
              {issue.category}
            </span>
            <span className="hidden lg:inline" style={{ fontSize: 10, color: "#A8B5A9", fontWeight: 500, letterSpacing: "0.02em" }}>{issue.date}</span>
          </div>

          <p style={{ color: "#5A6B5B", fontSize: 13, lineHeight: 1.65, margin: 0, flex: 1, overflow: "auto" }}>
            {truncateToSentences(issue.description)}
          </p>

          <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "14px 0" }} />

          <span
            onClick={e => { e.stopPropagation(); onCatClick(issue.category); router.push("/issue/" + issue.slug) }}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "5px 12px", borderRadius: 6,
              background: "rgba(21,128,61,0.1)",
              border: "1px solid rgba(21,128,61,0.3)",
              color: "#15803d", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          ><span className="hidden sm:inline">Take Action </span>→</span>
        </div>

      </div>
    </div>
  )
}
