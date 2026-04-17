"use client"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { ANIMAL_MAP, DEFAULT_ANIMAL } from "@/lib/animals"
import { CAT_COLOR } from "@/lib/colors"

const supabase = createClient()

const ALL_CATEGORIES = [
  "Executive Power", "Rule of Law", "Economy", "Civil Rights",
  "National Security", "Healthcare", "Environment", "Education & Science",
  "Immigration", "Media & Democracy",
]

function animalEntry(animalType) {
  if (!animalType) return DEFAULT_ANIMAL
  return ANIMAL_MAP.find(a => a.animal === animalType) || DEFAULT_ANIMAL
}

function timeAgo(iso) {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const S = { background: "#E8E4D8", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)" }

export default function SettingsPage() {
  const [loading,        setLoading]        = useState(true)
  const [user,           setUser]           = useState(null)
  const [profile,        setProfile]        = useState(null)
  const [pendingReqs,    setPendingReqs]    = useState([])
  const [pendingProfiles, setPendingProfiles] = useState({})

  // Edit profile fields
  const [displayName,    setDisplayName]    = useState("")
  const [username,       setUsername]       = useState("")
  const [zipCode,        setZipCode]        = useState("")
  const [isPrivate,      setIsPrivate]      = useState(false)
  const [categories,     setCategories]     = useState([])
  const [profileSaving,  setProfileSaving]  = useState(false)
  const [profileSaved,   setProfileSaved]   = useState(false)
  const [profileError,   setProfileError]   = useState("")
  const [email,          setEmail]          = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { window.location.href = "/login"; return }
      setUser(u)
      setEmail(u.email || "")

      const { data: prof } = await supabase
        .from("user_prefs")
        .select("user_id, display_name, username, animal_type, categories, is_private, zip_code")
        .eq("user_id", u.id)
        .maybeSingle()

      if (prof) {
        setProfile(prof)
        setDisplayName(prof.display_name || "")
        setUsername(prof.username || "")
        setIsPrivate(prof.is_private || false)
        setCategories(prof.categories || [])
        setZipCode(prof.zip_code || "")
      }

      // Load pending follow requests (people wanting to follow me)
      const { data: reqs } = await supabase
        .from("follows")
        .select("follower_id, created_at")
        .eq("following_id", u.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (reqs?.length) {
        setPendingReqs(reqs)
        const ids = reqs.map(r => r.follower_id)
        const { data: profs } = await supabase
          .from("user_prefs")
          .select("user_id, display_name, username, animal_type")
          .in("user_id", ids)
        const map = {}
        for (const p of (profs || [])) map[p.user_id] = p
        setPendingProfiles(map)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function acceptFollow(followerId) {
    await supabase.from("follows")
      .update({ status: "accepted" })
      .eq("follower_id", followerId)
      .eq("following_id", user.id)
    setPendingReqs(r => r.filter(x => x.follower_id !== followerId))
  }

  async function denyFollow(followerId) {
    await supabase.from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", user.id)
    setPendingReqs(r => r.filter(x => x.follower_id !== followerId))
  }

  function toggleCat(cat) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  async function saveProfile() {
    if (!user) return
    setProfileSaving(true)
    setProfileError("")
    const uname = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    if (!uname) { setProfileError("Username is required."); setProfileSaving(false); return }

    // Check username uniqueness (skip if unchanged)
    if (uname !== profile?.username) {
      const { data: existing } = await supabase
        .from("user_prefs").select("user_id").eq("username", uname).maybeSingle()
      if (existing && existing.user_id !== user.id) {
        setProfileError("That username is taken."); setProfileSaving(false); return
      }
    }

    const { error } = await supabase.from("user_prefs").upsert({
      user_id:      user.id,
      display_name: displayName.trim() || null,
      username:     uname,
      is_private:   isPrivate,
      categories,
      zip_code:     zipCode.trim() || null,
      updated_at:   new Date().toISOString(),
    }, { onConflict: "user_id" })

    if (error) { setProfileError("Something went wrong. Try again."); setProfileSaving(false); return }
    setUsername(uname)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
    setProfileSaving(false)
  }

  if (loading) return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7C6C", fontFamily: "Inter, system-ui, sans-serif" }}>
      Loading…
    </div>
  )

  const entry = animalEntry(profile?.animal_type)

  return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh", color: "#1C2E1E", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Nav */}
      <header style={{ background: "rgba(244,240,230,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="6" r="2.5" fill="white" opacity="0.9"/>
                <circle cx="4" cy="10" r="2" fill="white" opacity="0.7"/>
                <circle cx="12" cy="10" r="2" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em" }}>Herd</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#4A5C4B", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            Feed
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "36px 24px 80px" }}>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.03em", margin: "0 0 28px", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
          Settings
        </h1>

        {/* ── Pending Follow Requests ─────────────────────────────────────────── */}
        {pendingReqs.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 10 }}>
              Follow Requests · {pendingReqs.length}
            </div>
            <div style={{ ...S, padding: "4px 16px", marginBottom: 28 }}>
              {pendingReqs.map((req, i) => {
                const p = pendingProfiles[req.follower_id]
                const ent = animalEntry(p?.animal_type)
                return (
                  <div key={req.follower_id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 6px", margin: "0 -6px",
                    borderBottom: i < pendingReqs.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(21,128,61,0.08)", border: "1.5px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {ent.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E" }}>
                        {p?.display_name || p?.username || "Someone"}
                      </div>
                      {p?.username && (
                        <div style={{ fontSize: 12, color: "#9CAD9C" }}>@{p.username}</div>
                      )}
                      <div style={{ fontSize: 11, color: "#A8B5A9", marginTop: 2 }}>{timeAgo(req.created_at)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => acceptFollow(req.follower_id)}
                        style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#15803d", color: "#fff", border: "none", cursor: "pointer" }}
                      >Accept</button>
                      <button
                        onClick={() => denyFollow(req.follower_id)}
                        style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.05)", color: "#6B7C6C", border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer" }}
                      >Decline</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Edit Profile ────────────────────────────────────────────────────── */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 10 }}>
          Edit Profile
        </div>
        <div style={{ ...S, padding: "24px", marginBottom: 28 }}>

          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(21,128,61,0.08)", border: "2px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>
              {entry.emoji}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E" }}>{entry.animal}</div>
              <div style={{ fontSize: 12, color: "#9CAD9C", marginTop: 2 }}>Your avatar is based on your topics</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FieldGroup label="Display Name">
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your full name (optional)"
                maxLength={60}
                style={inputStyle}
              />
            </FieldGroup>

            <FieldGroup label="Username">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CAD9C", fontSize: 14 }}>@</span>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourhandle"
                  maxLength={30}
                  style={{ ...inputStyle, paddingLeft: 28 }}
                />
              </div>
            </FieldGroup>

            <FieldGroup label="Zip Code">
              <input
                value={zipCode}
                onChange={e => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="10001"
                style={inputStyle}
              />
            </FieldGroup>

            <FieldGroup label="Account Email">
              <input value={email} disabled style={{ ...inputStyle, color: "#9CAD9C", cursor: "not-allowed" }} />
            </FieldGroup>

            {/* Privacy toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "rgba(0,0,0,0.03)", borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1C2E1E" }}>Private account</div>
                <div style={{ fontSize: 12, color: "#9CAD9C", marginTop: 2 }}>Others must request to follow you</div>
              </div>
              <button
                onClick={() => setIsPrivate(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  background: isPrivate ? "#15803d" : "rgba(0,0,0,0.15)",
                  position: "relative", transition: "background 0.2s", flexShrink: 0,
                }}
                aria-label="Toggle private account"
              >
                <span style={{
                  position: "absolute", top: 2, left: isPrivate ? 22 : 2,
                  width: 20, height: 20, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            {profileError && (
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{profileError}</div>
            )}

            <button
              onClick={saveProfile}
              disabled={profileSaving}
              style={{
                padding: "11px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: profileSaved ? "#166534" : "#15803d", color: "#fff", border: "none",
                cursor: profileSaving ? "not-allowed" : "pointer", transition: "background 0.2s",
                alignSelf: "flex-start",
              }}
            >{profileSaving ? "Saving…" : profileSaved ? "✓ Saved" : "Save Changes"}</button>
          </div>
        </div>

        {/* ── Topics ──────────────────────────────────────────────────────────── */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 10 }}>
          Your Topics
        </div>
        <div style={{ ...S, padding: "20px 24px", marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: "#6B7C6C", margin: "0 0 16px" }}>
            Your topics shape your feed and your animal avatar.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {ALL_CATEGORIES.map(cat => {
              const selected = categories.includes(cat)
              const color = CAT_COLOR[cat] || "#15803d"
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  style={{
                    padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    background: selected ? color + "22" : "rgba(0,0,0,0.04)",
                    color: selected ? color : "#6B7C6C",
                    border: selected ? `1.5px solid ${color}55` : "1.5px solid rgba(0,0,0,0.1)",
                  }}
                >{cat}</button>
              )
            })}
          </div>
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            style={{
              padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: profileSaved ? "#166534" : "#15803d", color: "#fff", border: "none",
              cursor: profileSaving ? "not-allowed" : "pointer", transition: "background 0.2s",
            }}
          >{profileSaving ? "Saving…" : profileSaved ? "✓ Saved" : "Save Topics"}</button>
        </div>

        {/* ── Account ─────────────────────────────────────────────────────────── */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 10 }}>
          Account
        </div>
        <div style={{ ...S, padding: "8px 16px", marginBottom: 28 }}>
          <Link href="/profile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 6px", color: "#1C2E1E", textDecoration: "none" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>View My Profile</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CAD9C" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
          <div style={{ height: 1, background: "rgba(0,0,0,0.05)", margin: "0 6px" }} />
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login" }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
              padding: "14px 6px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>Sign Out</span>
          </button>
        </div>

      </main>

      <style>{`
        input:focus { outline: 2px solid #15803d; outline-offset: 2px; }
        button:focus-visible, a:focus-visible { outline: 2px solid #15803d; outline-offset: 2px; border-radius: 4px; }
        button:focus:not(:focus-visible), a:focus:not(:focus-visible) { outline: none; }
      `}</style>
    </div>
  )
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.5)",
  fontSize: 14, color: "#1C2E1E", outline: "none",
  boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif",
}
