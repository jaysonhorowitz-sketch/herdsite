"use client"
import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { ANIMAL_MAP, DEFAULT_ANIMAL } from "@/lib/animals"

const supabase = createClient()

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

export default function PublicProfilePage() {
  const { username } = useParams()

  const [loading,        setLoading]        = useState(true)
  const [notFound,       setNotFound]       = useState(false)
  const [profile,        setProfile]        = useState(null)
  const [currentUserId,  setCurrentUserId]  = useState(null)
  const [isFollowing,    setIsFollowing]    = useState(false)
  const [isPending,      setIsPending]      = useState(false)
  const [followerCount,  setFollowerCount]  = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [activity,       setActivity]       = useState([])
  const [locked,         setLocked]         = useState(false)
  const [toggling,       setToggling]       = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data: prof } = await supabase
        .from("user_prefs")
        .select("user_id, display_name, username, animal_type, categories, is_private")
        .eq("username", username)
        .maybeSingle()

      if (!prof) { setNotFound(true); setLoading(false); return }

      // Own profile → redirect
      if (user && prof.user_id === user.id) {
        window.location.href = "/profile"
        return
      }

      setProfile(prof)

      const [followersRes, followingRes, myFollowRes] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", prof.user_id).eq("status", "accepted"),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", prof.user_id).eq("status", "accepted"),
        user
          ? supabase.from("follows").select("status").eq("follower_id", user.id).eq("following_id", prof.user_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      setFollowerCount(followersRes.count || 0)
      setFollowingCount(followingRes.count || 0)

      const myFollow = myFollowRes.data
      const following = myFollow?.status === "accepted"
      const pending   = myFollow?.status === "pending"
      setIsFollowing(following)
      setIsPending(pending)

      const canSee = !prof.is_private || following
      if (canSee) {
        const { data: acts } = await supabase
          .from("user_activity")
          .select("id, activity_type, issue_slug, issue_title, created_at")
          .eq("user_id", prof.user_id)
          .order("created_at", { ascending: false })
          .limit(20)
        setActivity(acts || [])
      } else {
        setLocked(true)
      }

      setLoading(false)
    }
    load()
  }, [username])

  async function toggleFollow() {
    if (!currentUserId || !profile || toggling) return
    setToggling(true)
    if (isFollowing || isPending) {
      await supabase.from("follows").delete()
        .eq("follower_id", currentUserId).eq("following_id", profile.user_id)
      setIsFollowing(false)
      setIsPending(false)
      setFollowerCount(c => Math.max(0, c - 1))
    } else {
      const status = profile.is_private ? "pending" : "accepted"
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: profile.user_id, status })
      if (status === "accepted") { setIsFollowing(true); setFollowerCount(c => c + 1) }
      else setIsPending(true)
    }
    setToggling(false)
  }

  if (loading) return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7C6C", fontFamily: "Inter, system-ui, sans-serif" }}>
      Loading…
    </div>
  )

  if (notFound) return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🦌</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1C2E1E", margin: "0 0 8px", fontFamily: "var(--font-fraunces), Georgia, serif" }}>User not found</h2>
        <p style={{ fontSize: 13, color: "#6B7C6C", margin: "0 0 20px" }}>@{username} doesn&rsquo;t exist on Herd.</p>
        <Link href="/" style={{ fontSize: 13, color: "#15803d", textDecoration: "none", fontWeight: 600 }}>← Back to feed</Link>
      </div>
    </div>
  )

  const entry = animalEntry(profile.animal_type)
  const S = { background: "#E8E4D8", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)" }

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

        {/* Profile card */}
        <div style={{ ...S, padding: "28px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: "50%", background: "rgba(21,128,61,0.08)", border: "2px solid rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
              {entry.emoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {profile.display_name || `@${profile.username}`}
              </div>
              <div style={{ fontSize: 13, color: "#9CAD9C", marginTop: 2 }}>@{profile.username}</div>
              {profile.is_private && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#9CAD9C", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", padding: "3px 8px", borderRadius: 20 }}>🔒 Private</span>
                </div>
              )}
            </div>

            {/* Follow button */}
            {currentUserId && (
              <button
                onClick={toggleFollow}
                disabled={toggling}
                style={{
                  flexShrink: 0, padding: "9px 20px", borderRadius: 20,
                  fontSize: 13, fontWeight: 700,
                  cursor: toggling ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  ...(isFollowing
                    ? { background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", color: "#15803d" }
                    : isPending
                    ? { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.12)", color: "#6B7C6C" }
                    : { background: "#15803d", border: "1px solid #15803d", color: "#fff" }),
                }}
              >
                {isFollowing ? "Following" : isPending ? "Requested" : "Follow"}
              </button>
            )}
          </div>

          {/* Counts */}
          <div style={{ display: "flex", gap: 28, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.03em", lineHeight: 1 }}>{followerCount}</div>
              <div style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Followers</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.03em", lineHeight: 1 }}>{followingCount}</div>
              <div style={{ fontSize: 11, color: "#6B7C6C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Following</div>
            </div>
          </div>

          {/* Topics */}
          {profile.categories?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {profile.categories.map(cat => (
                <span key={cat} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "rgba(21,128,61,0.08)", color: "#15803d", border: "1px solid rgba(21,128,61,0.18)" }}>
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Activity section */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7C6C", marginBottom: 12 }}>
          Recent Activity
        </div>

        {locked ? (
          <div style={{ ...S, padding: "52px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1C2E1E", marginBottom: 6 }}>This account is private</div>
            <div style={{ fontSize: 13, color: "#6B7C6C", marginBottom: 20 }}>
              Follow {profile.display_name || `@${profile.username}`} to see their activity.
            </div>
            {currentUserId && !isFollowing && !isPending && (
              <button
                onClick={toggleFollow}
                disabled={toggling}
                style={{ padding: "10px 28px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: "#15803d", color: "#fff", border: "none", cursor: "pointer" }}
              >
                {toggling ? "…" : "Request to Follow"}
              </button>
            )}
          </div>
        ) : activity.length === 0 ? (
          <div style={{ ...S, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#9CAD9C" }}>No activity yet.</div>
          </div>
        ) : (
          <div style={{ ...S, padding: "4px 16px" }}>
            {activity.map((act, i) => (
              <ActivityRow key={act.id} act={act} isLast={i === activity.length - 1} />
            ))}
          </div>
        )}

      </main>

      <style>{`
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

function ActivityRow({ act, isLast }) {
  const [hov, setHov] = useState(false)
  const verb = act.activity_type === "completed_action" ? "Took action on" : "Saved"
  const icon = act.activity_type === "completed_action" ? "✅" : "⭐"

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "14px 6px", margin: "0 -6px",
        borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.05)",
        borderRadius: 8,
        background: hov ? "rgba(0,0,0,0.025)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#6B7C6C", marginBottom: 3 }}>{verb}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1C2E1E", lineHeight: 1.4 }}>
          {act.issue_slug ? (
            <Link href={`/issue/${act.issue_slug}`}
              style={{ color: "#15803d", textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
            >{act.issue_title || act.issue_slug}</Link>
          ) : <span>an issue</span>}
        </div>
        <div style={{ fontSize: 11, color: "#A8B5A9", marginTop: 4 }}>{timeAgo(act.created_at)}</div>
      </div>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
    </div>
  )
}
