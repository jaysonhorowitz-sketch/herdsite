"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { SCHOOLS } from "@/lib/schools"
import { createClient } from "@/utils/supabase/client"

const CATEGORIES = [
  { name: "Economy",           icon: "📊", desc: "Trade, tariffs, fiscal policy"                   },
  { name: "Civil Rights",      icon: "🗳️", desc: "Voting, discrimination, equal protection"        },
  { name: "Elections",         icon: "🗓️", desc: "2026 midterms, local elections, ballot measures" },
  { name: "Immigration",       icon: "🧭", desc: "Border policy, deportation, asylum"               },
  { name: "Environment",       icon: "🌿", desc: "EPA, climate, energy policy"                      },
  { name: "Education",         icon: "📖", desc: "Schools, universities, education policy"           },
  { name: "Executive Power",   icon: "🏛️", desc: "Presidential actions, executive orders"          },
  { name: "Rule of Law",       icon: "⚖️",  desc: "Courts, DOJ, constitutional norms"              },
  { name: "National Security", icon: "🪖", desc: "Military, intelligence, defense policy"           },
  { name: "Healthcare",        icon: "🩺", desc: "Medicare, Medicaid, public health"                },
  { name: "Science",           icon: "🔬", desc: "Research funding, scientific agencies"            },
  { name: "Democracy & Media", icon: "📰", desc: "Press freedom, elections, disinformation"         },
  { name: "Foreign Policy",    icon: "🌐", desc: "Diplomacy, international relations, alliances"    },
  { name: "Human Rights",      icon: "📜", desc: "Civil liberties, humanitarian law, equality"      },
]

const ACTION_PREFS = [
  {
    key:   "informed",
    icon:  "📡",
    title: "Stay Informed",
    desc:  "I want to understand what's happening and why it matters.",
  },
  {
    key:   "action",
    icon:  "✉️",
    title: "Take Action",
    desc:  "Show me concrete steps I can take on every issue.",
  },
  {
    key:   "both",
    icon:  "⚡",
    title: "Both",
    desc:  "Keep me informed and ready to act when it counts.",
  },
]

export default function OnboardingPage() {
  const router  = useRouter()
  const [screen,     setScreen]     = useState(1)
  const [selected,   setSelected]   = useState([])   // category names
  const [actionPref, setActionPref] = useState(null)  // key
  const [zipCode,    setZipCode]    = useState("")
  const [school,     setSchool]     = useState("")
  const [leaving,    setLeaving]    = useState(false)
  const [saveError,  setSaveError]  = useState(null)
  const [saving,     setSaving]     = useState(false)

  function toggleCat(name) {
    setSelected(prev =>
      prev.includes(name)
        ? prev.filter(c => c !== name)
        : prev.length < 5 ? [...prev, name] : prev
    )
  }

  function goToScreen(n) {
    setLeaving(true)
    setTimeout(() => { setScreen(n); setLeaving(false) }, 220)
  }

  async function handleSkip() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from("user_prefs").upsert(
        {
          user_id: user.id,
          categories: selected,
          action_pref: actionPref || "both",
          zip_code: zipCode.trim() || null,
          school:   school.trim()  || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
    }

    localStorage.setItem("onboardingComplete", "true")
    localStorage.setItem("howbadisite_prefs", JSON.stringify({ categories: selected, actionPref: actionPref || "both", skipped: true }))
    window.location.href = "/"
  }

  async function finish() {
    setSaving(true)
    setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Guest flow — save to localStorage only and go to the feed
      localStorage.setItem("howbadisite_prefs", JSON.stringify({ categories: selected, actionPref }))
      if (zipCode.trim()) localStorage.setItem("userZipCode", zipCode.trim())
      if (school.trim())  localStorage.setItem("userSchool",  school.trim())
      localStorage.setItem("onboardingComplete", "true")
      window.location.href = "/"
      return
    }

    const { error } = await supabase.from("user_prefs").upsert(
      {
        user_id: user.id,
        categories: selected,
        action_pref: actionPref,
        zip_code: zipCode.trim() || null,
        school:   school.trim()  || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("user_prefs upsert failed:", error)
      setSaveError("Couldn't save your preferences — please try again.")
      setSaving(false)
      return
    }

    // Keep localStorage as a fast local cache
    localStorage.setItem("howbadisite_prefs", JSON.stringify({ categories: selected, actionPref }))
    if (zipCode.trim()) localStorage.setItem("userZipCode", zipCode.trim())
    if (school.trim())  localStorage.setItem("userSchool",  school.trim())
    localStorage.setItem("onboardingComplete", "true")

    window.location.href = "/"
  }

  const word = selected.length > 0
    ? selected.slice(0, 2).join(" & ") + (selected.length > 2 ? ` +${selected.length - 2}` : "")
    : "the issues that matter"

  return (
    <div style={{
      background: "#FDFAF3", minHeight: "100vh", color: "#2A3E2C",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* Top bar */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
        </div>
        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              width: n === screen ? 24 : 8, height: 8, borderRadius: 99,
              background: n < screen ? "#15803d" : n === screen ? "#16a34a" : "rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>
        <button
          onClick={handleSkip}
          style={{ background: "none", border: "none", color: "#2A3E2C", fontSize: 12, cursor: "pointer" }}>
          Skip →
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "20px 24px 60px",
        opacity: leaving ? 0 : 1, transform: leaving ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}>

        {/* ── Screen 1: Pick categories ── */}
        {screen === 1 && (
          <div style={{ width: "100%", maxWidth: 720 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                color: "#15803d", marginBottom: 12 }}>Step 1 of 3</div>
              <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#1C2E1E",
                letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px" }}>
                What issues do you care about?
              </h1>
              <p style={{ fontSize: 15, color: "#4A5C4B", margin: 0 }}>
                Pick up to 5. We'll show you what's happening in those areas first.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 36 }}>
              {CATEGORIES.map(cat => {
                const on = selected.includes(cat.name)
                const maxed = !on && selected.length >= 5
                return (
                  <button
                    key={cat.name}
                    onClick={() => !maxed && toggleCat(cat.name)}
                    style={{
                      background: on ? "rgba(21,128,61,0.15)" : "#E8E4D8",
                      border: `1px solid ${on ? "rgba(21,128,61,0.5)" : "rgba(0,0,0,0.07)"}`,
                      borderRadius: 12, padding: "14px 16px", textAlign: "left",
                      cursor: maxed ? "not-allowed" : "pointer",
                      opacity: maxed ? 0.4 : 1,
                      transition: "all 0.15s",
                      position: "relative",
                      height: 80, overflow: "hidden",
                      display: "flex", flexDirection: "column", justifyContent: "center",
                    }}
                    onMouseEnter={e => { if (!maxed) e.currentTarget.style.borderColor = on ? "rgba(21,128,61,0.7)" : "rgba(255,255,255,0.18)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = on ? "rgba(21,128,61,0.5)" : "rgba(0,0,0,0.07)" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: on ? "#16a34a" : "#2A3E2C", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cat.icon} {cat.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7C6C", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cat.desc}</div>
                    {on && (
                      <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16,
                        borderRadius: "50%", background: "#15803d", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>✓</div>
                    )}
                  </button>
                )
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 12, color: "#6B7C6C" }}>
                {selected.length === 0 ? "Select at least 1" : `${selected.length}/5 selected`}
              </span>
              <button
                onClick={() => selected.length > 0 && goToScreen(2)}
                disabled={selected.length === 0}
                style={{
                  padding: "12px 32px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  background: selected.length > 0 ? "#15803d" : "rgba(21,128,61,0.3)",
                  border: "none", color: "#fff", cursor: selected.length > 0 ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Screen 2: Action preference ── */}
        {screen === 2 && (
          <div style={{ width: "100%", maxWidth: 560 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                color: "#15803d", marginBottom: 12 }}>Step 2 of 3</div>
              <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#1C2E1E",
                letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px" }}>
                How do you want to engage?
              </h1>
              <p style={{ fontSize: 15, color: "#4A5C4B", margin: 0 }}>
                We'll tailor what we emphasize for you.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {ACTION_PREFS.map(opt => {
                const on = actionPref === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setActionPref(opt.key)}
                    style={{
                      background: on ? "rgba(21,128,61,0.15)" : "#E8E4D8",
                      border: `1px solid ${on ? "rgba(21,128,61,0.5)" : "rgba(0,0,0,0.07)"}`,
                      borderRadius: 14, padding: "20px 24px", textAlign: "left",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 18,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = on ? "rgba(21,128,61,0.7)" : "rgba(255,255,255,0.18)"; e.currentTarget.style.background = on ? "rgba(21,128,61,0.2)" : "#1f2a42" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = on ? "rgba(21,128,61,0.5)" : "rgba(0,0,0,0.07)"; e.currentTarget.style.background = on ? "rgba(21,128,61,0.15)" : "#E8E4D8" }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: on ? "#16a34a" : "#1C2E1E", marginBottom: 4 }}>
                        {opt.title}
                      </div>
                      <div style={{ fontSize: 13, color: "#4A5C4B", lineHeight: 1.5 }}>{opt.desc}</div>
                    </div>
                    {on && <div style={{ marginLeft: "auto", width: 22, height: 22, borderRadius: "50%",
                      background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>✓</div>}
                  </button>
                )
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button onClick={() => goToScreen(1)}
                style={{ padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)",
                  color: "#6B7C6C", cursor: "pointer" }}>← Back</button>
              <button
                onClick={() => actionPref && goToScreen(3)}
                disabled={!actionPref}
                style={{ padding: "12px 32px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  background: actionPref ? "#15803d" : "rgba(21,128,61,0.3)",
                  border: "none", color: "#fff", cursor: actionPref ? "pointer" : "not-allowed",
                  transition: "all 0.2s" }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Screen 3: Zip code ── */}
        {screen === 3 && (
          <div style={{ width: "100%", maxWidth: 480 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                color: "#15803d", marginBottom: 12 }}>Step 3 of 3</div>
              <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, color: "#1C2E1E",
                letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px" }}>
                Where are you located?
              </h1>
              <p style={{ fontSize: 15, color: "#4A5C4B", margin: 0 }}>
                We'll show you how issues affect your area and connect you with your local representatives.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#6B7C6C", marginBottom: 8 }}>
                  <span>ZIP code</span><span style={{ fontWeight: 400 }}>Optional</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="e.g. 90210"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "16px 20px", borderRadius: 12, fontSize: 16,
                    background: "#E8E4D8", border: "1px solid rgba(255,255,255,0.12)",
                    color: "#1C2E1E", outline: "none", caretColor: "#15803d",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.6)"}
                  onBlur={e => e.target.style.borderColor  = "rgba(255,255,255,0.12)"}
                />
              </div>

              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#6B7C6C", marginBottom: 8 }}>
                  <span>School <span style={{ fontWeight: 400, color: "#9aab9b" }}>(Help us build Herd for your campus)</span></span><span style={{ fontWeight: 400 }}>Optional</span>
                </label>
                <input
                  type="text"
                  list="school-list"
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  placeholder="Search your school"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "16px 20px", borderRadius: 12, fontSize: 16,
                    background: "#E8E4D8", border: "1px solid rgba(255,255,255,0.12)",
                    color: "#1C2E1E", outline: "none", caretColor: "#15803d",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.6)"}
                  onBlur={e => e.target.style.borderColor  = "rgba(255,255,255,0.12)"}
                />
                <datalist id="school-list">
                  {SCHOOLS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button onClick={() => goToScreen(2)}
                style={{ padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)",
                  color: "#6B7C6C", cursor: "pointer" }}>← Back</button>
              <button onClick={() => goToScreen(4)}
                style={{ padding: "12px 32px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  background: "#15803d", border: "none", color: "#fff", cursor: "pointer",
                  transition: "all 0.2s" }}>
                {zipCode.length === 5 ? "Continue →" : "Skip →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Screen 4: Summary ── */}
        {screen === 4 && (
          <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#15803d", marginBottom: 20 }}>You're all set</div>

            {/* Big summary card */}
            <div style={{ background: "#1a2e1c",
              border: "1px solid rgba(21,128,61,0.3)", borderRadius: 20, padding: "36px 40px",
              marginBottom: 32, position: "relative", overflow: "hidden" }}>
              {/* Glow */}
              <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
                width: 300, height: 200, background: "radial-gradient(ellipse, rgba(21,128,61,0.2) 0%, transparent 70%)",
                pointerEvents: "none" }} />

              <div style={{ fontSize: 48, marginBottom: 20 }}>
                {selected.map(c => CATEGORIES.find(x => x.name === c)?.icon).filter(Boolean).slice(0, 3).join(" ")}
              </div>

              <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#f0ede4",
                letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 16px" }}>
                You care about {word}
              </h2>

              <p style={{ fontSize: 15, color: "rgba(240,237,228,0.65)", lineHeight: 1.7, margin: "0 0 24px" }}>
                {actionPref === "informed" && "We'll show you the most significant developments in your areas — clearly and without spin."}
                {actionPref === "action"   && "Every issue in your feed comes with concrete actions ranked by how much time they take."}
                {actionPref === "both"     && "You'll see what's happening and exactly what you can do about it."}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {selected.map(name => {
                  const cat = CATEGORIES.find(c => c.name === name)
                  return (
                    <span key={name} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px",
                      borderRadius: 99, background: "rgba(21,128,61,0.15)", color: "#16a34a",
                      border: "1px solid rgba(21,128,61,0.25)" }}>
                      {cat?.icon} {name}
                    </span>
                  )
                })}
              </div>
            </div>

            {saveError && (
              <div style={{
                marginBottom: 16, padding: "10px 16px", borderRadius: 8, fontSize: 13,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5", textAlign: "center",
              }}>{saveError}</div>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goToScreen(3)} disabled={saving}
                style={{ padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)",
                  color: "#6B7C6C", cursor: saving ? "not-allowed" : "pointer" }}>← Back</button>
              <button onClick={finish} disabled={saving}
                style={{ padding: "14px 40px", borderRadius: 8, fontSize: 15, fontWeight: 800,
                  background: saving ? "rgba(21,128,61,0.5)" : "#15803d", border: "none", color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  letterSpacing: "-0.01em", transition: "all 0.2s" }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#2563eb" }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.background = "#15803d" }}>
                {saving ? "Saving…" : "See My Feed →"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        button { position: relative; }
        @keyframes fadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
