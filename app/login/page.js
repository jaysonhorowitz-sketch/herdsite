"use client"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const [screen,   setScreen]   = useState("landing") // "landing" | "auth"
  const [mode,     setMode]     = useState("signin")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)

  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setSuccess("Check your email for a confirmation link, then come back and sign in.")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = "/"
    }

    setLoading(false)
  }

  // ── Landing screen ──────────────────────────────────────────────────────────
  if (screen === "landing") {
    return (
      <div style={{
        minHeight: "100vh", background: "#F4F0E6",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 24px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 48, fontWeight: 900, color: "#1C2E1E",
            letterSpacing: "-0.04em", display: "block", lineHeight: 1,
          }}>Herd</span>
          <span style={{ fontSize: 14, color: "#4A5C4B", marginTop: 10, display: "block", letterSpacing: "0.02em" }}>
            Track. Act. Organize.
          </span>
        </div>

        {/* Two cards */}
        <div style={{
          display: "flex", gap: 16, width: "100%", maxWidth: 680,
          flexWrap: "wrap", justifyContent: "center",
        }}>

          {/* Guest card */}
          <button
            onClick={() => { window.location.href = "/onboarding" }}
            style={{
              flex: "1 1 280px", minHeight: 220,
              background: "#FDFAF3",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 20, padding: "32px 28px",
              cursor: "pointer", textAlign: "left",
              transition: "border-color 0.2s, transform 0.15s",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)" }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1C2E1E", marginBottom: 10, letterSpacing: "-0.02em" }}>
                Continue as Guest
              </div>
              <p style={{ fontSize: 13, color: "#4A5C4B", lineHeight: 1.6, margin: 0 }}>
                Full access to the feed, events map, and actions. No account needed.
              </p>
            </div>
            <div style={{
              marginTop: 28, display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 700, color: "#6b7280",
            }}>
              Browse freely →
            </div>
          </button>

          {/* Sign in card */}
          <button
            onClick={() => setScreen("auth")}
            style={{
              flex: "1 1 280px", minHeight: 220,
              background: "rgba(21,128,61,0.08)",
              border: "1px solid rgba(21,128,61,0.25)",
              borderRadius: 20, padding: "32px 28px",
              cursor: "pointer", textAlign: "left",
              transition: "border-color 0.2s, transform 0.15s",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(21,128,61,0.5)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(21,128,61,0.25)"; e.currentTarget.style.transform = "translateY(0)" }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1C2E1E", marginBottom: 10, letterSpacing: "-0.02em" }}>
                Sign In / Create Account
              </div>
              <p style={{ fontSize: 13, color: "#4A5C4B", lineHeight: 1.6, margin: 0 }}>
                Save your preferences, get a personalized feed, and track your actions over time.
              </p>
            </div>
            <div style={{
              marginTop: 28, display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 700, color: "#16a34a",
            }}>
              Get personalized →
            </div>
          </button>
        </div>

        <p style={{ marginTop: 40, fontSize: 11, color: "#3A4B3B", textAlign: "center" }}>
          Not affiliated with any political party.
        </p>
      </div>
    )
  }

  // ── Auth screen ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#F4F0E6",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      {/* Back */}
      <button
        onClick={() => { setScreen("landing"); setError(null); setSuccess(null) }}
        style={{
          position: "absolute", top: 24, left: 24,
          background: "none", border: "none", color: "#4A5C4B",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Back
      </button>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <span style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 36, fontWeight: 900, color: "#1C2E1E",
          letterSpacing: "-0.03em", display: "block", lineHeight: 1,
        }}>Herd</span>
        <span style={{ fontSize: 13, color: "#4A5C4B", marginTop: 6, display: "block" }}>
          Track. Act. Organize.
        </span>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#FDFAF3",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16, padding: "32px 28px",
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: 28, background: "#E8E4D8", borderRadius: 10, padding: 4 }}>
          {["signin", "signup"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 7, border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: mode === m ? "#143820" : "transparent",
                color: mode === m ? "#16a34a" : "#4A5C4B",
                transition: "all 0.15s",
              }}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4A5C4B", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", borderRadius: 8, fontSize: 14,
                background: "#E8E4D8", border: "1px solid rgba(0,0,0,0.1)",
                color: "#1C2E1E", outline: "none", caretColor: "#15803d",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4A5C4B", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" required minLength={6} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", borderRadius: 8, fontSize: 14,
                background: "#E8E4D8", border: "1px solid rgba(0,0,0,0.1)",
                color: "#1C2E1E", outline: "none", caretColor: "#15803d",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
            />
            {mode === "signup" && <p style={{ fontSize: 11, color: "#6B7C6C", marginTop: 5 }}>Minimum 6 characters</p>}
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.2)", color: "#16a34a", lineHeight: 1.5 }}>
              {success}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 4, padding: "13px 0", borderRadius: 8, border: "none",
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "rgba(21,128,61,0.4)" : "#15803d",
              color: "#fff", transition: "background 0.15s",
            }}
          >
            {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: "#3A4B3B", textAlign: "center" }}>
        Not affiliated with any political party.
      </p>
    </div>
  )
}
