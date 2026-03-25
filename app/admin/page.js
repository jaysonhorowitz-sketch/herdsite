"use client"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://mwahckdqmiopkzrmdxyc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWhja2RxbWlvcGt6cm1keHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDgxMjgsImV4cCI6MjA4ODkyNDEyOH0.0Ua6sM8_zLzCdjJ8SGX-MVFkbbbyzDvrjtZuRoZVVxM"
)

const CATEGORIES = [
  "Executive Power", "Courts & Justice", "Economy & Trade", "Civil Rights",
  "Foreign Policy & National Security", "Military", "Immigration", "Environment",
  "Science", "Press Freedom", "Culture", "Corruption",
]

function autoSeverityLabel(score) {
  const n = Number(score)
  if (n <= 3) return "NOTABLE"
  if (n <= 6) return "SIGNIFICANT"
  if (n <= 8) return "MAJOR"
  return "CRITICAL"
}

const EMPTY_ACTION = { effort: "2 min", text: "" }
const EMPTY_FORM = {
  title: "", slug: "", category: CATEGORIES[0], severity_score: 5,
  severity_label: "SIGNIFICANT",
  description: "",
  actions: [{ ...EMPTY_ACTION }, { ...EMPTY_ACTION }, { ...EMPTY_ACTION }],
  date: "", is_published: true,
}

function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function severityLabel(s) {
  if (s <= 3) return { text: "Notable",    color: "#4ade80" }
  if (s <= 6) return { text: "Significant", color: "#facc15" }
  if (s <= 8) return { text: "Major",      color: "#fb923c" }
  return              { text: "Critical",   color: "#f87171" }
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const INPUT = {
  width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6, padding: "8px 12px", color: "#e2e8f0", fontSize: 13,
  outline: "none", boxSizing: "border-box",
}
const LABEL = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b",
  letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }
const BTN = (variant = "primary") => ({
  padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600,
  cursor: "pointer", border: "1px solid",
  ...(variant === "primary"
    ? { background: "#3b82f6", borderColor: "#3b82f6", color: "#fff" }
    : variant === "danger"
    ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }
    : variant === "ghost"
    ? { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }
    : { background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.3)", color: "#60a5fa" }),
})

export default function AdminPage() {
  const [authed,    setAuthed]   = useState(false)
  const [password,  setPassword] = useState("")
  const [pwError,   setPwError]  = useState(false)

  const [issues,    setIssues]   = useState([])
  const [loading,   setLoading]  = useState(false)
  const [msg,       setMsg]      = useState(null) // { text, ok }

  const [form,      setForm]     = useState(EMPTY_FORM)
  const [editId,    setEditId]   = useState(null)
  const [showForm,  setShowForm] = useState(false)
  const [confirm,   setConfirm]  = useState(null) // issue id pending delete
  const [search,    setSearch]   = useState("")

  // ── Auth ──────────────────────────────────────────────────────────────────
  function submitPassword(e) {
    e.preventDefault()
    if (password === "1234") { setAuthed(true); setPwError(false) }
    else { setPwError(true); setPassword("") }
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("issues").select("*").order("date", { ascending: false })
    if (error) flash("Failed to load issues: " + error.message, false)
    else setIssues(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (authed) fetchIssues() }, [authed, fetchIssues])

  function flash(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  function setField(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === "title" && !editId) next.slug = toSlug(val)
      if (key === "severity_score") next.severity_label = autoSeverityLabel(val)
      return next
    })
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function openEdit(issue) {
    // Normalise the actions array: pad/trim to exactly 3 entries
    const raw = Array.isArray(issue.actions) ? issue.actions : []
    const actions = [0, 1, 2].map(i => ({
      effort: raw[i]?.effort || "2 min",
      text:   raw[i]?.text   || "",
    }))
    setForm({
      title:          issue.title          || "",
      slug:           issue.slug           || "",
      category:       issue.category       || CATEGORIES[0],
      severity_score: issue.severity_score ?? 5,
      severity_label: issue.severity_label || autoSeverityLabel(issue.severity_score ?? 5),
      description:    issue.description    || "",
      actions,
      date:           issue.date           || "",
      is_published:   issue.is_published   ?? true,
    })
    setEditId(issue.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

  // ── Save (insert or update) ───────────────────────────────────────────────
  async function saveIssue(e) {
    e.preventDefault()
    if (!form.title.trim()) return flash("Title is required.", false)
    if (!form.slug.trim())  return flash("Slug is required.", false)

    const payload = {
      title:          form.title.trim(),
      slug:           form.slug.trim(),
      category:       form.category,
      severity_score: Number(form.severity_score),
      severity_label: form.severity_label.trim() || autoSeverityLabel(form.severity_score),
      description:    form.description.trim(),
      actions:        form.actions.filter(a => a.text.trim()).map(a => ({
                        effort: a.effort,
                        text:   a.text.trim(),
                      })),
      date:           form.date.trim(),
      is_published:   form.is_published,
    }

    let error
    if (editId) {
      ;({ error } = await supabase.from("issues").update(payload).eq("id", editId))
      if (!error) { flash(`"${payload.title}" updated.`); cancelForm(); fetchIssues() }
    } else {
      ;({ error } = await supabase.from("issues").insert(payload))
      if (!error) { flash(`"${payload.title}" added.`); cancelForm(); fetchIssues() }
    }
    if (error) flash("Error: " + error.message, false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteIssue(id, title) {
    const { error } = await supabase.from("issues").delete().eq("id", id)
    setConfirm(null)
    if (error) flash("Delete failed: " + error.message, false)
    else { flash(`"${title}" deleted.`); setIssues(prev => prev.filter(i => i.id !== id)) }
  }

  // ── Toggle published ─────────────────────────────────────────────────────
  async function togglePublished(issue) {
    const next = !issue.is_published
    const { error } = await supabase.from("issues").update({ is_published: next }).eq("id", issue.id)
    if (error) flash("Update failed: " + error.message, false)
    else {
      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, is_published: next } : i))
      flash(`"${issue.title}" ${next ? "published" : "unpublished"}.`)
    }
  }

  const filtered = issues.filter(i =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase()) ||
               i.category?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Password gate ─────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ background: "#111827", minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <form onSubmit={submitPassword} style={{ background: "#1a2236", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "40px 48px", width: 360, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Admin</div>
        <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 28 }}>How Bad Is It?</div>
        <input
          type="password" value={password} placeholder="Password"
          onChange={e => { setPassword(e.target.value); setPwError(false) }}
          autoFocus
          style={{ ...INPUT, marginBottom: 8, textAlign: "center", fontSize: 14,
            borderColor: pwError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}
        />
        {pwError && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>Incorrect password</div>}
        <button type="submit" style={{ ...BTN("primary"), width: "100%", padding: "10px 0",
          fontSize: 13, marginTop: 4 }}>
          Sign In
        </button>
      </form>
    </div>
  )

  // ── Main admin UI ─────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#111827", minHeight: "100vh", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <div style={{ background: "rgba(17,24,39,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", height: 54,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" style={{ fontSize: 12, color: "#4b5563", textDecoration: "none",
              letterSpacing: "0.04em" }}>← Site</a>
            <span style={{ color: "#1f2937" }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8",
              letterSpacing: "0.06em", textTransform: "uppercase" }}>Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#374151" }}>{issues.length} issues</span>
            <button onClick={openNew} style={BTN("primary")}>+ New Issue</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 80px" }}>

        {/* Flash message */}
        {msg && (
          <div style={{ marginBottom: 20, padding: "12px 18px", borderRadius: 8, fontSize: 13,
            background: msg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${msg.ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            color: msg.ok ? "#4ade80" : "#f87171" }}>
            {msg.text}
          </div>
        )}

        {/* ── Form ── */}
        {showForm && (
          <div style={{ background: "#1a2236", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "28px 32px", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                {editId ? "Edit Issue" : "New Issue"}
              </h2>
              <button onClick={cancelForm} style={BTN("ghost")}>Cancel</button>
            </div>

            <form onSubmit={saveIssue}>
              {/* Row 1: title + slug */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={LABEL}>Title</label>
                  <input style={INPUT} value={form.title}
                    onChange={e => setField("title", e.target.value)} placeholder="Issue title" />
                </div>
                <div>
                  <label style={LABEL}>Slug</label>
                  <input style={INPUT} value={form.slug}
                    onChange={e => setField("slug", e.target.value)} placeholder="auto-generated" />
                </div>
              </div>

              {/* Row 2: category + impact score + impact label + date + published */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 1fr auto", gap: 16, marginBottom: 16, alignItems: "end" }}>
                <div>
                  <label style={LABEL}>Category</label>
                  <select style={{ ...INPUT, appearance: "none" }} value={form.category}
                    onChange={e => setField("category", e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LABEL}>Impact Score</label>
                  <input style={INPUT} type="number" min={1} max={10} value={form.severity_score}
                    onChange={e => setField("severity_score", e.target.value)} />
                </div>
                <div>
                  <label style={LABEL}>Impact Label</label>
                  <input style={INPUT} value={form.severity_label}
                    onChange={e => setField("severity_label", e.target.value)}
                    placeholder="auto-generated" />
                </div>
                <div>
                  <label style={LABEL}>Date</label>
                  <input style={INPUT} value={form.date}
                    onChange={e => setField("date", e.target.value)} placeholder="Mar 2025" />
                </div>
                <div style={{ paddingBottom: 2 }}>
                  <label style={{ ...LABEL, marginBottom: 10 }}>Published</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
                    <input type="checkbox" id="is_published" checked={form.is_published}
                      onChange={e => setField("is_published", e.target.checked)}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6" }} />
                    <label htmlFor="is_published" style={{ fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                      {form.is_published ? "Live" : "Draft"}
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL}>Description</label>
                <textarea style={{ ...INPUT, height: 80, resize: "vertical" }} value={form.description}
                  onChange={e => setField("description", e.target.value)}
                  placeholder="What is happening — shown on the issue detail page…" />
              </div>

              {/* Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <label style={LABEL}>Action {i + 1}</label>
                    <input
                      style={{ ...INPUT, marginBottom: 6 }}
                      value={form.actions[i].text}
                      onChange={e => setForm(f => {
                        const actions = f.actions.map((a, j) => j === i ? { ...a, text: e.target.value } : a)
                        return { ...f, actions }
                      })}
                      placeholder={`Step ${i + 1} you can take…`}
                    />
                    <select
                      style={{ ...INPUT, appearance: "none", fontSize: 12 }}
                      value={form.actions[i].effort}
                      onChange={e => setForm(f => {
                        const actions = f.actions.map((a, j) => j === i ? { ...a, effort: e.target.value } : a)
                        return { ...f, actions }
                      })}
                    >
                      <option value="2 min">2 min</option>
                      <option value="20 min">20 min</option>
                      <option value="1 hour">1 hour</option>
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" style={{ ...BTN("primary"), padding: "9px 24px" }}>
                  {editId ? "Save Changes" : "Add Issue"}
                </button>
                <button type="button" onClick={cancelForm} style={BTN("ghost")}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Table header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>All Issues</h2>
            {loading && <span style={{ fontSize: 11, color: "#4b5563" }}>Loading…</span>}
          </div>
          <input style={{ ...INPUT, width: 220 }} value={search}
            onChange={e => setSearch(e.target.value)} placeholder="Search title or category…" />
        </div>

        {/* ── Table ── */}
        <div style={{ background: "#1a2236", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, overflow: "hidden" }}>
          {/* Table head */}
          <div style={{ display: "grid",
            gridTemplateColumns: "3fr 1.4fr 52px 60px 54px 120px",
            padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            gap: 12 }}>
            {["Title", "Category", "Imp", "Date", "Live", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#374151",
                letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "#374151" }}>
              {loading ? "Loading issues…" : "No issues found."}
            </div>
          )}
          {filtered.map((issue, idx) => {
            const sev = severityLabel(issue.severity_score)
            return (
              <div key={issue.id}>
                {idx > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 20px" }} />}
                <div style={{ display: "grid",
                  gridTemplateColumns: "3fr 1.4fr 52px 60px 54px 120px",
                  padding: "12px 20px", gap: 12, alignItems: "center",
                  transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                  {/* Title */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {issue.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#374151", marginTop: 1 }}>{issue.slug}</div>
                  </div>

                  {/* Category */}
                  <div style={{ fontSize: 12, color: "#64748b",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {issue.category}
                  </div>

                  {/* Impact */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: sev.color }}>
                    {issue.severity_score}
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: "#4b5563" }}>{issue.date || "—"}</div>

                  {/* Published toggle */}
                  <div>
                    <button onClick={() => togglePublished(issue)}
                      style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", border: "1px solid",
                        background: issue.is_published ? "rgba(34,197,94,0.1)" : "rgba(71,85,105,0.2)",
                        borderColor: issue.is_published ? "rgba(34,197,94,0.25)" : "rgba(71,85,105,0.3)",
                        color: issue.is_published ? "#4ade80" : "#475569" }}>
                      {issue.is_published ? "Live" : "Draft"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(issue)} style={BTN("outline")}>Edit</button>
                    {confirm === issue.id ? (
                      <button onClick={() => deleteIssue(issue.id, issue.title)}
                        style={BTN("danger")}>Confirm</button>
                    ) : (
                      <button onClick={() => setConfirm(issue.id)} style={BTN("danger")}>Del</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirm cancel hint */}
        {confirm && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            Click <strong style={{ color: "#f87171" }}>Confirm</strong> to delete, or click elsewhere to cancel.{" "}
            <button onClick={() => setConfirm(null)}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
