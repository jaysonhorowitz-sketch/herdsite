import Link from "next/link"

export default function EventsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 32px" }}>
        <Link href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 10H5M9 5l-5 5 5 5"/>
          </svg>
          Back to Herd
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
        <div style={{ textAlign: "center", color: "#4b5563" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F5F1E8", margin: "0 0 8px" }}>Events near you</h1>
          <p style={{ fontSize: 14, margin: 0 }}>Coming soon — this page is under construction.</p>
        </div>
      </div>
    </div>
  )
}
