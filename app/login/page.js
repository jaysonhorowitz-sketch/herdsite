"use client"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const [mode,    setMode]    = useState("signin") // "signin" | "signup"
  const [email,   setEmail]   = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess("Check your email for a confirmation link, then come back and sign in.")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = "/"
      }
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0B1120",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <span style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 36, fontWeight: 900, color: "#F5F1E8",
          letterSpacing: "-0.03em", display: "block", lineHeight: 1,
        }}>Herd</span>
        <span style={{ fontSize: 13, color: "#4b5563", marginTop: 6, display: "block" }}>
          Track. Act. Organize.
        </span>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "32px 28px",
      }}>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: 28, background: "#1a2236", borderRadius: 10, padding: 4 }}>
          {["signin", "signup"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 7, border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: mode === m ? "#1e3a5f" : "transparent",
                color: mode === m ? "#93c5fd" : "#4b5563",
                transition: "all 0.15s",
              }}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4b5563",
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", borderRadius: 8, fontSize: 14,
                background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f1f5f9", outline: "none", caretColor: "#3b82f6",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4b5563",
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", borderRadius: 8, fontSize: 14,
                background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f1f5f9", outline: "none", caretColor: "#3b82f6",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            {mode === "signup" && (
              <p style={{ fontSize: 11, color: "#374151", marginTop: 5 }}>Minimum 6 characters</p>
            )}
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
              color: "#86efac", lineHeight: 1.5,
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, padding: "13px 0", borderRadius: 8, border: "none",
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "rgba(59,130,246,0.4)" : "#3b82f6",
              color: "#fff", transition: "background 0.15s",
            }}
          >
            {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: "#1f2937", textAlign: "center" }}>
        Not affiliated with any political party.
      </p>
    </div>
  )
}
