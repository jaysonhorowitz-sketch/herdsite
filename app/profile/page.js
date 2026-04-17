"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { ANIMAL_MAP, DEFAULT_ANIMAL } from "@/lib/animals"

const supabase = createClient()

function animalEntry(animalType) {
  if (!animalType) return DEFAULT_ANIMAL
  return ANIMAL_MAP.find(a => a.animal === animalType) || DEFAULT_ANIMAL
}

function percentile(n) {
  if (n >= 20) return 97
  if (n >= 10) return 89
  if (n >= 5)  return 74
  if (n >= 2)  return 55
  return 40
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

// ─── Follower/Following modal ─────────────────────────────────────────────────
function ConnectionsModal({ title, userIds, onClose }) {
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    if (!userIds.length) return
    supabase.from("user_prefs")
      .select("user_id, display_name, username, animal_type")
      .in("user_id", userIds)
      .then(({ data }) => setProfiles(data || []))
  }, [userIds])

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#F4F0E6", borderRadius: 16, width: "100%", maxWidth: 420,
          maxHeight: "70vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1C2E1E" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6B7C6C", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: "12px 16px" }}>
          {profiles.length === 0 && (
            <p style={{ textAlign: "center", color: "#9CAD9C", fontSize: 13, padding: "20px 0" }}>Nobody here yet.</p>
          )}
          {profiles.map(p => {
            const entry = animalEntry(p.animal_type)
            return (
              <div key={p.user_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {entry.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E" }}>{p.display_name || p.username || "Anonymous"}</div>
                  {p.username && <div style={{ fontSize: 12, color: "#9CAD9C" }}>@{p.username}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Username setup banner ────────────────────────────────────────────────────
function UsernameBanner({ onSetup }) {
  return (
    <div style={{
      background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.2)",
      borderRadius: 12, padding: "14px 20px", marginBottom: 24,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2E1E", marginBottom: 2 }}>Set up your Herd identity</div>
        <div style={{ fontSize: 12, color: "#6B7C6C" }}>Add a username so others can find and follow you.</div>
      </div>
      <button
        onClick={onSetup}
        style={{ flexShrink: 0, padding: "8px 18px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#15803d", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        Set up →
      </button>
    </div>
  )
}

// ─── Inline username setup form ───────────────────────────────────────────────
function UsernameSetupForm({ userId, onSave }) {
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername]       = useState("")
  const [err, setErr]                 = useState("")
  const [saving, setSaving]           = useState(false)

  async function save() {
    if (!displayName.trim()) { setErr("Please enter your name."); return }
    if (username.length < 3) { setErr("Username must be at least 3 characters."); return }
    setSaving(true)
    const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, "")
    const { data: existing } = await supabase.from("user_prefs").select("user_id").eq("username", clean).neq("user_id", userId).maybeSingle()
    if (existing) { setErr("That username is taken."); setSaving(false); return }
    await supabase.from("user_prefs").update({ display_name: displayName.trim(), username: clean }).eq("user_id", userId)
    onSave({ displayName: displayName.trim(), username: clean })
  }

  return (
    <div style={{ background: "#E8E4D8", borderRadius: 12, padding: "20px 24px", marginBottom: 24, border: "1px solid rgba(0,0,0,0.07)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2E1E", marginBottom: 16 }}>Set up your identity</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
        <input
          value={displayName}
          onChange={e => { setDisplayName(e.target.value); setErr("") }}
          placeholder="Your name"
          style={{ padding: "11px 14px", borderRadius: 8, fontSize: 14, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", outline: "none", color: "#1C2E1E" }}
          onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
        />
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6B7C6C", fontWeight: 600, fontSize: 14 }}>@</span>
          <input
            value={username}
            onChange={e => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20)); setErr("") }}
            placeholder="username"
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 28px", borderRadius: 8, fontSize: 14, border: `1px solid ${err ? "rgba(239,68,68,0.4)" : "rgba(0,0,0,0.1)"}`, background: "#fff", outline: "none", color: "#1C2E1E" }}
            onFocus={e => e.target.style.borderColor = "rgba(21,128,61,0.4)"}
            onBlur={e => e.target.style.borderColor = err ? "rgba(239,68,68,0.4)" : "rgba(0,0,0,0.1)"}
          />
        </div>
      </div>
      {err && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 12px" }}>{err}</p>}
      <button
        onClick={save}
        disabled={saving}
        style={{ padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: saving ? "rgba(21,128,61,0.5)" : "#15803d", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer" }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [loading,          setLoading]          = useState(true)
  const [authUser,         setAuthUser]         = useState(null)
  const [prefs,            setPrefs]            = useState(null)
  const [bySlug,           setBySlug]           = useState({})
  const [total,            setTotal]            = useState(0)
  const [archivedCount,    setArchivedCount]    = useState(0)
  const [followerIds,      setFollowerIds]      = useState([])
  const [followingIds,     setFollowingIds]     = useState([])
  const [modal,            setModal]            = useState(null) // "followers" | "following" | null
  const [isPrivate,        setIsPrivate]        = useState(false)
  const [showUsernameForm, setShowUsernameForm] = useState(false)
  const [activeTab,        setActiveTab]        = useState("actions") // "actions" | "saved"
  const [savedIssues,      setSavedIssues]      = useState([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/login"; return }
      setAuthUser(user)

      const [prefsRes, actionsRes, followsRes] = await Promise.all([
        supabase.from("user_prefs").select("display_name, username, animal_type, categories, is_private").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_actions").select("issue_slug, action_index").eq("user_id", user.id).order("completed_at", { ascending: false }),
        supabase.from("follows").select("follower_id, following_id, status").or(`follower_id.eq.${user.id},following_id.eq.${user.id}`),
      ])

      const p = prefsRes.data || {}
      setPrefs(p)
      setIsPrivate(p.is_private || false)

      // Actions
      if (actionsRes.data?.length) {
        const grouped = {}
        for (const row of actionsRes.data) {
          if (!grouped[row.issue_slug]) grouped[row.issue_slug] = { indices: [], title: null }
          grouped[row.issue_slug].indices.push(row.action_index)
        }
        const { data: issues } = await supabase.from("issues").select("slug, title").in("slug", Object.keys(grouped))
        if (issues) for (const issue of issues) if (grouped[issue.slug]) grouped[issue.slug].title = issue.title
        setBySlug(grouped)
        setTotal(actionsRes.data.length)
      }

      // Saved issues from Supabase user_activity
      const { data: savedActs } = await supabase
        .from("user_activity")
        .select("issue_slug, issue_title")
        .eq("user_id", user.id)
        .eq("activity_type", "saved_issue")
        .order("created_at", { ascending: false })
      if (savedActs?.length) {
        setArchivedCount(savedActs.length)
        const slugs = savedActs.map(a => a.issue_slug).filter(Boolean)
        if (slugs.length) {
          const { data: savedData } = await supabase.from("issues").select("slug, title, category").in("slug", slugs)
          setSavedIssues(savedData || [])
        }
      } else {
        // Fallback: sync from localStorage once if Supabase has nothing
        try {
          const stored = JSON.parse(localStorage.getItem("archivedIssues") || "[]")
          setArchivedCount(stored.length)
          if (stored.length) {
            const { data: savedData } = await supabase.from("issues").select("slug, title, category").in("slug", stored)
            setSavedIssues(savedData || [])
          }
        } catch {}
      }

      // Follows
      if (followsRes.data) {
        const accepted = followsRes.data.filter(f => f.status === "accepted")
        setFollowerIds(accepted.filter(f => f.following_id === user.id).map(f => f.follower_id))
        setFollowingIds(accepted.filter(f => f.follower_id === user.id).map(f => f.following_id))
      }

      setLoading(false)
    }
    load()
  }, [])

  async function togglePrivacy() {
    const next = !isPrivate
    setIsPrivate(next)
    await supabase.from("user_prefs").update({ is_private: next }).eq("user_id", authUser.id)
  }

  const slugCount  = Object.keys(bySlug).length
  const entry      = animalEntry(prefs?.animal_type)
  const hasIdentity = !!(prefs?.username)

  if (loading) {
    return (
      <div style={{ background: "#F4F0E6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7C6C", fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading…
      </div>
    )
  }

  const S = { background: "#E8E4D8", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)", padding: "22px 24px", marginBottom: 12 }
  const tabStyle = (active) => ({
    background: "none", border: "none", cursor: "pointer",
    padding: "10px 4px", fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? "#1C2E1E" : "#6B7C6C",
    borderBottom: active ? "2px solid #15803d" : "2px solid transparent",
    marginBottom: -1, marginRight: 24, transition: "color 0.15s, border-color 0.15s",
  })

  return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh", color: "#2A3E2C", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <header style={{ background: "rgba(244,240,230,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ fontSize: 13, color: "#4A5C4B", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
              Feed
            </Link>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login" }}
              style={{ fontSize: 12, fontWeight: 500, color: "#6B7C6C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* Username banner — shown to users without a username */}
        {!hasIdentity && !showUsernameForm && (
          <UsernameBanner onSetup={() => setShowUsernameForm(true)} />
        )}
        {showUsernameForm && !hasIdentity && (
          <UsernameSetupForm
            userId={authUser.id}
            onSave={({ displayName, username }) => {
              setPrefs(p => ({ ...p, display_name: displayName, username }))
              setShowUsernameForm(false)
            }}
          />
        )}

        {/* Profile header card */}
        <div style={{ ...S, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            {/* Animal avatar */}
            <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: "50%", background: "rgba(21,128,61,0.08)", border: "2px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
              {entry.emoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {prefs?.display_name || authUser?.email?.split("@")[0] || "You"}
              </div>
              {prefs?.username && (
                <div style={{ fontSize: 13, color: "#9CAD9C", marginTop: 2 }}>@{prefs.username}</div>
              )}
            </div>

            {/* Privacy toggle */}
            <button
              onClick={togglePrivacy}
              title={isPrivate ? "Account is private — click to make public" : "Account is public — click to make private"}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                border: "1px solid rgba(0,0,0,0.1)", background: "transparent",
                color: "#6B7C6C", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {isPrivate ? "🔒 Private" : "🌐 Public"}
            </button>
          </div>

          {/* Follower / following counts */}
          <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <button onClick={() => setModal("followers")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.03em", lineHeight: 1 }}>{followerIds.length}</div>
              <div style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Followers</div>
            </button>
            <button onClick={() => setModal("following")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.03em", lineHeight: 1 }}>{followingIds.length}</div>
              <div style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Following</div>
            </button>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.03em", lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Actions taken</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {total > 0 && (
          <p style={{ fontSize: 14, color: "#6B7C6C", margin: "0 0 20px", lineHeight: 1.6 }}>
            You&rsquo;ve completed <strong style={{ color: "#1C2E1E" }}>{total}</strong> action{total !== 1 ? "s" : ""} across <strong style={{ color: "#1C2E1E" }}>{slugCount}</strong> issue{slugCount !== 1 ? "s" : ""} — that&rsquo;s more than {percentile(total)}% of readers.
          </p>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <button onClick={() => setActiveTab("actions")} style={tabStyle(activeTab === "actions")}>
            Actions <span style={{ fontSize: 11, color: "#9CAD9C", fontWeight: 500 }}>{total}</span>
          </button>
          <button onClick={() => setActiveTab("saved")} style={tabStyle(activeTab === "saved")}>
            Saved <span style={{ fontSize: 11, color: "#9CAD9C", fontWeight: 500 }}>{archivedCount}</span>
          </button>
        </div>

        {/* Tab: Actions */}
        {activeTab === "actions" && (
          total === 0 ? (
            <div style={{ ...S, textAlign: "center", padding: "48px 24px" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#2A3E2C", marginBottom: 8 }}>No actions tracked yet</p>
              <p style={{ fontSize: 14, color: "#4A5C4B", marginBottom: 24, lineHeight: 1.6 }}>
                Click any action item on an issue page to mark it done and track it here.
              </p>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#fff", padding: "10px 22px", borderRadius: 8, background: "#15803d", textDecoration: "none" }}>
                Browse issues →
              </Link>
            </div>
          ) : (
            <div style={S}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#6B7C6C", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
                Completed actions by issue
              </p>
              {Object.entries(bySlug).map(([slug, { indices, title }]) => (
                <div key={slug} style={{ marginBottom: 20 }}>
                  <Link href={`/issue/${slug}`} style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textDecoration: "none", display: "block", marginBottom: 8 }}>
                    {title || slug} ↗
                  </Link>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {indices.map(idx => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.15)" }}>
                        <span style={{ fontSize: 13, color: "#16a34a" }}>✓</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>Action {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab: Saved */}
        {activeTab === "saved" && (
          archivedCount === 0 ? (
            <div style={{ ...S, textAlign: "center", padding: "48px 24px" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#2A3E2C", marginBottom: 8 }}>No saved issues</p>
              <p style={{ fontSize: 14, color: "#4A5C4B", marginBottom: 24, lineHeight: 1.6 }}>
                Star any issue card on the feed to save it here.
              </p>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#fff", padding: "10px 22px", borderRadius: 8, background: "#15803d", textDecoration: "none" }}>
                Browse issues →
              </Link>
            </div>
          ) : (
            <div style={S}>
              {savedIssues.map(issue => (
                <Link key={issue.slug} href={`/issue/${issue.slug}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", textDecoration: "none", color: "inherit" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2E1E", marginBottom: 3 }}>{issue.title}</div>
                    <div style={{ fontSize: 11, color: "#6B7C6C", textTransform: "uppercase", letterSpacing: "0.08em" }}>{issue.category}</div>
                  </div>
                  <span style={{ fontSize: 16, color: "#15803d", flexShrink: 0 }}>★</span>
                </Link>
              ))}
            </div>
          )
        )}

      </main>

      {/* Follower / Following modal */}
      {modal && (
        <ConnectionsModal
          title={modal === "followers" ? `${followerIds.length} Followers` : `${followingIds.length} Following`}
          userIds={modal === "followers" ? followerIds : followingIds}
          onClose={() => setModal(null)}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          main { padding: 24px 16px 80px !important; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #E0DCD0 25%, #EAE6DA 50%, #E0DCD0 75%);
          background-size: 800px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
          border-radius: 4px;
        }
        button:focus-visible, a:focus-visible {
          outline: 2px solid #15803d;
          outline-offset: 2px;
          border-radius: 4px;
        }
        button:focus:not(:focus-visible), a:focus:not(:focus-visible) {
          outline: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton { animation: none; }
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}
