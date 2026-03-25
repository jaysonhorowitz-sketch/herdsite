"use client"
import Link from "next/link"

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    category: "Constitutional & Government",
    color: "text-rose-400",
    accent: "#fb7185",
    border: "border-l-rose-500",
    orgs: [
      {
        name: "CREW",
        full: "Citizens for Responsibility and Ethics",
        desc: "Holding government officials accountable through litigation and research.",
        url: "https://www.every.org/citizensforethics",
      },
      {
        name: "Protect Democracy",
        full: null,
        desc: "Preventing American democracy from declining into authoritarianism.",
        url: "https://www.every.org/protectdemocracy",
      },
      {
        name: "American Oversight",
        full: null,
        desc: "Nonpartisan government watchdog using FOIA to expose corruption.",
        url: "https://www.every.org/american-oversight",
      },
    ],
  },
  {
    category: "Environment",
    color: "text-emerald-400",
    accent: "#34d399",
    border: "border-l-emerald-500",
    orgs: [
      {
        name: "Earthjustice",
        full: null,
        desc: "The nation's largest nonprofit environmental law organization.",
        url: "https://www.every.org/earthjustice",
      },
      {
        name: "Environmental Defense Fund",
        full: null,
        desc: "Science-based environmental advocacy.",
        url: "https://www.every.org/edf",
      },
      {
        name: "Sierra Club Foundation",
        full: null,
        desc: "Grassroots environmental advocacy since 1892.",
        url: "https://www.every.org/sierraclubfoundation",
      },
    ],
  },
  {
    category: "Healthcare",
    color: "text-teal-400",
    accent: "#2dd4bf",
    border: "border-l-teal-500",
    orgs: [
      {
        name: "Families USA",
        full: null,
        desc: "National voice for healthcare consumers.",
        url: "https://www.every.org/familiesusa",
      },
      {
        name: "National Health Law Program",
        full: null,
        desc: "Protecting healthcare rights for low-income people.",
        url: "https://www.every.org/healthlaw",
      },
    ],
  },
  {
    category: "Immigration",
    color: "text-amber-400",
    accent: "#fbbf24",
    border: "border-l-amber-400",
    orgs: [
      {
        name: "ACLU Immigrants Rights Project",
        full: null,
        desc: "Defending the rights of immigrants nationwide.",
        url: "https://www.every.org/aclu-foundation",
      },
      {
        name: "National Immigration Law Center",
        full: null,
        desc: "Defending rights of low-income immigrants.",
        url: "https://www.every.org/nilc",
      },
      {
        name: "RAICES",
        full: null,
        desc: "Free legal services for immigrant families.",
        url: "https://www.every.org/raabordering",
      },
    ],
  },
  {
    category: "Press Freedom",
    color: "text-orange-400",
    accent: "#fb923c",
    border: "border-l-orange-500",
    orgs: [
      {
        name: "Freedom of the Press Foundation",
        full: null,
        desc: "Protecting and defending journalism in the digital age.",
        url: "https://www.every.org/freedom-press",
      },
      {
        name: "Committee to Protect Journalists",
        full: null,
        desc: "Defending press freedom worldwide.",
        url: "https://www.every.org/cpj",
      },
      {
        name: "ProPublica",
        full: null,
        desc: "Investigative journalism in the public interest.",
        url: "https://www.every.org/propublica",
      },
    ],
  },
  {
    category: "Science & Education",
    color: "text-cyan-400",
    accent: "#22d3ee",
    border: "border-l-cyan-500",
    orgs: [
      {
        name: "Union of Concerned Scientists",
        full: null,
        desc: "Science-based advocacy for a healthy planet and safer world.",
        url: "https://www.every.org/ucsusa",
      },
      {
        name: "AAAS",
        full: "American Association for the Advancement of Science",
        desc: "Advancing science for the benefit of all people.",
        url: "https://www.every.org/aaas",
      },
    ],
  },
]

// ─── Org Card ─────────────────────────────────────────────────────────────────

function OrgCard({ org, accent, border }) {
  return (
    <div
      className={`rounded-xl border border-gray-700 border-l-4 ${border} p-5 flex flex-col gap-3 transition-all duration-200 hover:border-gray-500`}
      style={{ background: "#16213e" }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 20px 0 ${accent}22`
        e.currentTarget.style.background = "#1e2d4a"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.background = "#16213e"
      }}
    >
      <div className="flex-1">
        <p className="text-white font-bold text-base leading-snug mb-0.5">{org.name}</p>
        {org.full && (
          <p className="text-[10px] text-gray-500 mb-2 leading-snug">{org.full}</p>
        )}
        <p className="text-sm text-gray-400 leading-relaxed">{org.desc}</p>
      </div>
      <a
        href={org.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-red-500 hover:bg-red-400 transition-colors duration-150 self-start"
      >
        Donate
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
        </svg>
      </a>
    </div>
  )
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({ section }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className={`text-[11px] font-bold uppercase tracking-widest ${section.color}`}>
          {section.category}
        </h2>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {section.orgs.map(org => (
          <OrgCard key={org.name} org={org} accent={section.accent} border={section.border} />
        ))}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DonatePage() {
  return (
    <div className="min-h-screen" style={{ background: "#1a1a2e" }}>

      {/* ── Header ── */}
      <header style={{ background: "#1a1a2e" }} className="border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-black text-white uppercase tracking-wide hover:text-gray-300 transition-colors"
          >
            How Bad Is It?
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            All issues
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-12 pb-8 border-b border-gray-800">
        <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-wide leading-none mb-2">
          Fund the Fight
        </h1>
        <div className="h-1 w-20 bg-red-500 rounded-full mb-4" />
        <p className="text-base text-gray-400 max-w-2xl leading-relaxed">
          Direct your money where it matters most. Every organization below is a vetted{" "}
          <span className="text-gray-300 font-semibold">501(c)(3) nonprofit</span>. Donations
          processed securely through{" "}
          <a
            href="https://www.every.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 underline"
          >
            every.org
          </a>
          .
        </p>
      </div>

      {/* ── Sections ── */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-12">
        {SECTIONS.map(section => (
          <CategorySection key={section.category} section={section} />
        ))}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 mt-4" style={{ background: "#1a1a2e" }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">How Bad Is It?</p>
          <p className="text-xs text-gray-600">
            We are not affiliated with any of these organizations. Verify each charity independently.
          </p>
        </div>
      </footer>
    </div>
  )
}
