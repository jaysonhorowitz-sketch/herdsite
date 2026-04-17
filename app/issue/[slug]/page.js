"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import { pick } from "../../../lib/newsletters"
import Link from "next/link"
import { useParams } from "next/navigation"

// ─── Utilities ────────────────────────────────────────────────────────────────

function getSev(score) {
  if (score >= 9) return { accent: "#ef4444", bar: "rgba(220,38,38,0.6)",   label: "Severe Impact"  }
  if (score >= 7) return { accent: "#ea580c", bar: "rgba(234,88,12,0.6)",   label: "Major Impact"   }
  if (score >= 4) return { accent: "#d97706", bar: "rgba(217,119,6,0.6)",   label: "Notable Impact" }
  return                 { accent: "#5A6B5B", bar: "rgba(100,116,139,0.6)", label: "Worth Watching" }
}

function effortConfig(effort) {
  if (effort === "2 min")  return { color: "#0891b2", bg: "rgba(8,145,178,0.08)",   border: "rgba(8,145,178,0.25)"   }
  if (effort === "20 min") return { color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.25)"  }
  return                          { color: "#0f766e", bg: "rgba(15,118,110,0.08)",  border: "rgba(15,118,110,0.25)"  }
}

function partyColor(p) {
  if (p === "R") return { bg: "rgba(239,68,68,0.12)",  text: "#f87171",  border: "rgba(239,68,68,0.2)"  }
  if (p === "D") return { bg: "rgba(21,128,61,0.12)", text: "#16a34a",  border: "rgba(21,128,61,0.2)" }
  return               { bg: "rgba(168,85,247,0.12)", text: "#c084fc",  border: "rgba(168,85,247,0.2)" }
}

function oddsColor(n) {
  if (n >= 70) return { text: "#16a34a", bg: "rgba(21,128,61,0.1)",  border: "rgba(21,128,61,0.2)"  }
  if (n >= 45) return { text: "#facc15", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.2)"  }
  return             { text: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)"  }
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player }) {
  const [odds,        setOdds]        = useState(null)
  const [oddsLoading, setOddsLoading] = useState(!!player.kalshi_ticker)
  const [expanded,    setExpanded]    = useState(false)

  const pc = partyColor(player.party)
  const photoUrl = player.bioguide_id
    ? `https://bioguide.congress.gov/bioguide/photo/${player.bioguide_id[0]}/${player.bioguide_id}.jpg`
    : null

  useEffect(() => {
    if (!player.kalshi_ticker) return
    fetch(`/api/kalshi/${player.kalshi_ticker}`)
      .then(r => r.json())
      .then(d => { if (d.odds !== undefined) setOdds(d.odds) })
      .catch(() => {})
      .finally(() => setOddsLoading(false))
  }, [player.kalshi_ticker])

  const oc = odds !== null ? oddsColor(odds) : null

  return (
    <div style={{
      background: "#E8E4D8",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 12,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px" }}>

        {/* Photo */}
        <div style={{
          width: 52, height: 52, borderRadius: 10, flexShrink: 0,
          background: "rgba(0,0,0,0.06)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style="font-size:22px">👤</span>` }}
            />
          ) : (
            <span style={{ fontSize: 22 }}>👤</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1C2E1E", letterSpacing: "-0.01em" }}>{player.name}</span>
            {/* Party badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2px 7px", borderRadius: 4,
              background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
            }}>{player.party}</span>
            {/* Kalshi odds badge */}
            {oddsLoading && (
              <span style={{ fontSize: 10, color: "#6B7C6C", fontStyle: "italic" }}>loading odds…</span>
            )}
            {!oddsLoading && odds !== null && oc && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "3px 9px", borderRadius: 99,
                background: oc.bg, color: oc.text, border: `1px solid ${oc.border}`,
              }}>
                {odds}% re-election · Kalshi
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 3, lineHeight: 1.4 }}>{player.role}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#6B7C6C" }}>
              {player.state} · {player.chamber}
            </span>
            {player.next_election && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: player.next_election <= 2026 ? "#fb923c" : "#6b7280",
              }}>
                Up for election: {player.next_election}
                {player.next_election <= 2026 && " ⚡"}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 6, padding: "4px 8px", cursor: "pointer", flexShrink: 0,
            color: "#4A5C4B", fontSize: 11, fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          {expanded ? "Less ↑" : "More ↓"}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          borderTop: "1px solid rgba(0,0,0,0.06)",
          padding: "14px 18px",
          display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          {player.contact_url && (
            <a
              href={player.contact_url}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#2A3E2C",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(0,0,0,0.07)",
                border: "1px solid rgba(0,0,0,0.1)",
                textDecoration: "none",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              ✉ Contact office
            </a>
          )}
          {player.bioguide_id && (
            <a
              href={`https://www.congress.gov/member/${player.name.toLowerCase().replace(/\s+/g, "-")}/${player.bioguide_id}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#16a34a",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(21,128,61,0.08)",
                border: "1px solid rgba(21,128,61,0.15)",
                textDecoration: "none",
              }}
            >
              Congress.gov ↗
            </a>
          )}
          {player.opensecrets_id && (
            <a
              href={`https://www.opensecrets.org/members-of-congress/summary?cid=${player.opensecrets_id}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#a78bfa",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.15)",
                textDecoration: "none",
              }}
            >
              OpenSecrets ↗
            </a>
          )}
          {player.kalshi_ticker && odds !== null && (
            <a
              href={`https://kalshi.com/markets/${player.kalshi_ticker}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: "#16a34a",
                padding: "7px 14px", borderRadius: 7,
                background: "rgba(21,128,61,0.08)",
                border: "1px solid rgba(21,128,61,0.15)",
                textDecoration: "none",
              }}
            >
              Kalshi market ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function SiteHeader() {
  return (
    <header style={{
      background: "rgba(244,240,230,0.95)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 40px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, fontWeight: 800, color: "#1C2E1E", letterSpacing: "-0.02em", lineHeight: 1 }}>Herd</span>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>Track. Act. Organize.</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/profile" style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none", letterSpacing: "0.02em" }}>
            My Impact
          </Link>
        </div>
      </div>
    </header>
  )
}

function LoadingScreen() {
  return (
    <div style={{ background: "#FDFAF3", minHeight: "100vh" }}>
      <SiteHeader />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 120, gap: 10, color: "#6B7C6C" }}>
        <svg style={{ animation: "spin 1s linear infinite", width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
          <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span style={{ fontSize: 14 }}>Loading…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div style={{ background: "#FDFAF3", minHeight: "100vh" }}>
      <SiteHeader />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 80, fontWeight: 900, color: "#3A4B3B", margin: "0 0 16px" }}>404</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: "#d1d5db", marginBottom: 8 }}>Issue not found</p>
        <p style={{ fontSize: 14, color: "#4A5C4B", marginBottom: 32 }}>This issue may have been removed or the URL is incorrect.</p>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#ef4444", color: "white", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          ← Back to all issues
        </Link>
      </div>
    </div>
  )
}

// ─── Hardcoded resources by category ─────────────────────────────────────────

const NL_MAINSTREAM = {
  "Elections": [
    { name: "Cook Political Report", description: "The gold standard for nonpartisan U.S. election forecasting and race ratings.", url: "https://www.cookpolitical.com" },
    { name: "Politico Elections", description: "Comprehensive reporting on races, candidates, and election results nationwide.", url: "https://www.politico.com/elections" },
    { name: "FiveThirtyEight", description: "Data-driven forecasting and analysis of elections, polling, and political trends.", url: "https://abcnews.go.com/538" },
    { name: "Ballotpedia", description: "The encyclopedia of American politics — candidates, races, and ballot measures.", url: "https://ballotpedia.org" },
  ],
  "Executive Power": [
    { name: "Politico Playbook", description: "The essential morning read for Washington insiders and policy watchers.", url: "https://www.politico.com/newsletter/playbook" },
    { name: "Axios AM", description: "Smart brevity on the biggest political stories of the day.", url: "https://www.axios.com/newsletters/axios-am" },
    { name: "The Hill Morning Report", description: "Daily digest of the top stories from Capitol Hill and the White House.", url: "https://thehill.com/newsletter" },
    { name: "Washington Post The 6", description: "Six essential political stories every morning from the Post's newsroom.", url: "https://www.washingtonpost.com" },
  ],
  "Rule of Law": [
    { name: "SCOTUSblog", description: "Plain-language coverage of the Supreme Court and federal courts.", url: "https://www.scotusblog.com" },
    { name: "Just Security", description: "Analysis of law and policy at the intersection of national security and rights.", url: "https://www.justsecurity.org" },
    { name: "Law360", description: "Breaking legal news and analysis across every major practice area.", url: "https://www.law360.com" },
    { name: "Above the Law", description: "News and commentary on the legal industry, courts, and legal policy.", url: "https://abovethelaw.com" },
  ],
  "Economy": [
    { name: "WSJ The 10-Point", description: "Ten must-read stories each morning from the Wall Street Journal.", url: "https://www.wsj.com" },
    { name: "Axios Markets", description: "Data-driven daily briefing on markets, business, and economic policy.", url: "https://www.axios.com/newsletters/axios-markets" },
    { name: "Bloomberg Evening Briefing", description: "The day's biggest economic and financial stories, distilled.", url: "https://www.bloomberg.com" },
    { name: "FT FirstFT", description: "Financial Times' morning digest of global economic news.", url: "https://www.ft.com" },
  ],
  "Civil Rights": [
    { name: "The 19th", description: "Nonprofit newsroom covering gender, politics, and policy.", url: "https://19thnews.org" },
    { name: "The Appeal", description: "Reporting on criminal legal reform and civil rights enforcement.", url: "https://theappeal.org" },
    { name: "ACLU Newsletter", description: "Updates on civil liberties cases, legislation, and actions from the ACLU.", url: "https://www.aclu.org/news" },
    { name: "ProPublica", description: "Investigative journalism on civil rights, inequality, and accountability.", url: "https://www.propublica.org" },
  ],
  "National Security": [
    { name: "Defense One", description: "Essential coverage of U.S. defense policy, the military, and global security.", url: "https://www.defenseone.com" },
    { name: "War on the Rocks", description: "Analysis of national security, defense strategy, and foreign policy.", url: "https://warontherocks.com" },
    { name: "Lawfare", description: "Rigorous legal and policy analysis on national security issues.", url: "https://www.lawfaremedia.org" },
    { name: "Foreign Policy", description: "Global affairs reporting and analysis from Washington and abroad.", url: "https://foreignpolicy.com" },
  ],
  "Healthcare": [
    { name: "STAT News", description: "Authoritative journalism on health, medicine, and the life sciences.", url: "https://www.statnews.com" },
    { name: "Kaiser Health News", description: "Nonprofit newsroom covering health policy, insurance, and public health.", url: "https://kff.org/health-news" },
    { name: "Axios Vitals", description: "Daily briefing on the health care industry and health policy.", url: "https://www.axios.com" },
    { name: "Modern Healthcare", description: "Business and policy news for health care executives and policymakers.", url: "https://www.modernhealthcare.com" },
  ],
  "Environment": [
    { name: "NYT Climate Forward", description: "The New York Times' guide to the latest on climate change and policy.", url: "https://www.nytimes.com/newsletters/climate-change" },
    { name: "Inside Climate News", description: "Award-winning nonprofit journalism on climate and the environment.", url: "https://insideclimatenews.org" },
    { name: "E&E News", description: "Definitive source for energy and environment policy coverage in Washington.", url: "https://www.eenews.net" },
    { name: "Yale Environment 360", description: "Opinion, analysis, and reporting on the environment from Yale.", url: "https://e360.yale.edu" },
  ],
  "Education": [
    { name: "Chronicle of Higher Education", description: "News and analysis on colleges, universities, and higher ed policy.", url: "https://www.chronicle.com" },
    { name: "Inside Higher Ed", description: "Daily news on higher education policy, faculty, and campus life.", url: "https://www.insidehighered.com" },
    { name: "The 74", description: "Nonprofit newsroom covering K–12 education policy, reform, and equity.", url: "https://www.the74million.org" },
    { name: "Education Week", description: "Authoritative coverage of elementary and secondary education policy.", url: "https://www.edweek.org" },
  ],
  "Science": [
    { name: "Science News", description: "Accessible coverage of scientific research, discoveries, and funding.", url: "https://www.sciencenews.org" },
    { name: "Nature News", description: "Research news and policy analysis from one of science's top journals.", url: "https://www.nature.com/news" },
    { name: "Science Friday", description: "Science news and conversation from NPR's flagship science program.", url: "https://www.sciencefriday.com" },
    { name: "Ars Technica", description: "Rigorous coverage of science, technology, and research policy.", url: "https://arstechnica.com/science" },
  ],
  "Immigration": [
    { name: "The Marshall Project", description: "Nonpartisan journalism covering immigration enforcement and policy.", url: "https://www.themarshallproject.org" },
    { name: "Immigration Impact", description: "News and analysis from the American Immigration Council.", url: "https://immigrationimpact.com" },
    { name: "Documented", description: "Journalism for and about immigrants navigating U.S. policy.", url: "https://documentedny.com" },
    { name: "Border Report", description: "On-the-ground coverage of the U.S.–Mexico border and immigration.", url: "https://www.bordereport.com" },
  ],
  "Democracy & Media": [
    { name: "Columbia Journalism Review", description: "Critical analysis of the press, media ethics, and journalism's future.", url: "https://www.cjr.org" },
    { name: "Nieman Lab", description: "Researching the future of journalism at Harvard's Nieman Foundation.", url: "https://www.niemanlab.org" },
    { name: "Press Gazette", description: "News about the news industry, media trends, and press freedom.", url: "https://pressgazette.co.uk" },
    { name: "Poynter", description: "Journalism ethics, fact-checking, and media industry news.", url: "https://www.poynter.org" },
  ],
  "Foreign Policy": [
    { name: "Foreign Affairs", description: "The premier journal of international relations and U.S. foreign policy.", url: "https://www.foreignaffairs.com" },
    { name: "Foreign Policy", description: "Global affairs reporting and analysis from Washington and abroad.", url: "https://foreignpolicy.com" },
    { name: "Responsible Statecraft", description: "Sober analysis of U.S. foreign policy from the Quincy Institute.", url: "https://responsiblestatecraft.org" },
    { name: "World Politics Review", description: "Expert analysis of international affairs and geopolitical trends.", url: "https://www.worldpoliticsreview.com" },
  ],
  "Human Rights": [
    { name: "Human Rights Watch Dispatch", description: "Reporting and analysis from HRW's global human rights investigations.", url: "https://www.hrw.org/news" },
    { name: "Amnesty International News", description: "Updates from Amnesty's global campaigns on rights, justice, and dignity.", url: "https://www.amnesty.org/en/latest/news" },
    { name: "Just Security", description: "Legal analysis at the intersection of national security and human rights.", url: "https://www.justsecurity.org" },
    { name: "The Guardian (Rights)", description: "Investigative coverage of civil liberties and human rights worldwide.", url: "https://www.theguardian.com/law/human-rights" },
  ],
}

const NL_SUBSTACK = {
  "Elections": [
    { name: "G. Elliott Morris", description: "ABC News/538 chief data analyst on polling, forecasting, and election science.", url: "https://gelliottmorris.substack.com" },
    { name: "Sabato's Crystal Ball", description: "Larry Sabato's respected election handicapping and race ratings.", url: "https://centerforpolitics.org/crystalball" },
    { name: "Election Law Blog", description: "Rick Hasen's authoritative coverage of voting rights and election administration.", url: "https://electionlawblog.org" },
    { name: "Decision Desk HQ", description: "Real-time election results, forecasting models, and race analysis.", url: "https://decisiondeskhq.com" },
    { name: "Niskanen Center", description: "Centrist policy analysis on democratic institutions, voting, and electoral reform.", url: "https://www.niskanencenter.org" },
  ],
  "Executive Power": [
    { name: "Popular Information", description: "Judd Legum's accountability journalism on corporate and political power.", url: "https://popular.info" },
    { name: "Letters from an American", description: "Heather Cox Richardson's daily historical context on American politics.", url: "https://heathercoxrichardson.substack.com" },
    { name: "Robert Reich", description: "Former Labor Secretary Robert Reich on democracy, inequality, and power.", url: "https://robertreich.substack.com" },
    { name: "The Bulwark", description: "Center-right commentary on democracy, accountability, and the GOP.", url: "https://www.thebulwark.com" },
    { name: "HEATED", description: "Emily Atkin on how the powerful shape politics and policy.", url: "https://heatedblog.substack.com" },
  ],
  "Rule of Law": [
    { name: "Lawfare", description: "Deep legal analysis of national security law and constitutional questions.", url: "https://www.lawfaremedia.org" },
    { name: "The Contrarian", description: "Independent legal analysis pushing back on conventional wisdom.", url: "https://thecontrarian.substack.com" },
    { name: "Election Law Blog", description: "Rick Hasen's authoritative coverage of voting rights and election law.", url: "https://electionlawblog.org" },
    { name: "Steve Vladeck", description: "National security law professor on courts, the military, and the Constitution.", url: "https://vladeck.substack.com" },
    { name: "The Law and Policy Brief", description: "Accessible breakdowns of consequential legal and regulatory decisions.", url: "https://lawpolicyblog.substack.com" },
  ],
  "Economy": [
    { name: "The Overshoot", description: "Matthew Klein on macroeconomics, trade, and global financial flows.", url: "https://theovershoot.co" },
    { name: "Noahpinion", description: "Noah Smith's accessible takes on economics, technology, and policy.", url: "https://noahpinion.substack.com" },
    { name: "Doomberg", description: "Anonymous energy and commodity experts on markets and geopolitics.", url: "https://doomberg.substack.com" },
    { name: "Money Stuff", description: "Matt Levine's witty and incisive daily newsletter on Wall Street.", url: "https://www.bloomberg.com/account/newsletters/money-stuff" },
    { name: "Apricitas Economics", description: "Data-driven analysis of U.S. economic policy and labor markets.", url: "https://apricitas.substack.com" },
  ],
  "Civil Rights": [
    { name: "The Ink", description: "Anand Giridharadas on power, inequality, and who gets to shape America.", url: "https://the.ink" },
    { name: "Momentum", description: "Analysis and strategy for the progressive movement and civil rights work.", url: "https://momentum.substack.com" },
    { name: "Radically Possible", description: "Optimistic takes on social change, civil rights, and movement building.", url: "https://radicallypossible.substack.com" },
    { name: "The Reframe", description: "Roxane Gay on culture, politics, and the ongoing struggle for equity.", url: "https://roxanegay.substack.com" },
    { name: "Shakesville", description: "Long-running feminist political commentary and civil rights analysis.", url: "https://shakesville.substack.com" },
  ],
  "National Security": [
    { name: "Situation Report", description: "Inside-the-Beltway reporting on defense policy and national security.", url: "https://sitrep.substack.com" },
    { name: "The Intercept", description: "Adversarial journalism on surveillance, military power, and civil liberties.", url: "https://theintercept.com" },
    { name: "Tom Nichols", description: "Former Naval War College professor on democracy, defense, and expertise.", url: "https://tom-nichols.substack.com" },
    { name: "Shashank Joshi", description: "The Economist's defence editor on military strategy and global security.", url: "https://shashankjoshi.substack.com" },
    { name: "Phillips P. O'Brien", description: "Military historian on modern warfare, strategy, and defense policy.", url: "https://phillipsobrien.substack.com" },
  ],
  "Healthcare": [
    { name: "The Health Care Blog", description: "Practitioner and policy perspectives on health care reform and delivery.", url: "https://thehealthcareblog.com" },
    { name: "Absolutely Maybe", description: "Hilda Bastian on evidence-based medicine, research integrity, and health policy.", url: "https://hildabastian.substack.com" },
    { name: "Topher Spiro", description: "Health policy expert on drug pricing, insurance reform, and the ACA.", url: "https://topherspiro.substack.com" },
    { name: "Health Affairs Forefront", description: "Timely health policy commentary from leading researchers and practitioners.", url: "https://www.healthaffairs.org" },
    { name: "American Diagnosis", description: "Making sense of U.S. health care policy for a general audience.", url: "https://americandiagnosis.substack.com" },
  ],
  "Environment": [
    { name: "HEATED", description: "Emily Atkin's sharp accountability journalism on climate and fossil fuel politics.", url: "https://heatedblog.substack.com" },
    { name: "Volts", description: "David Roberts' deep dives into clean energy, climate policy, and politics.", url: "https://www.volts.wtf" },
    { name: "The Crucial Years", description: "Bill McKibben on climate urgency, activism, and the path forward.", url: "https://billmckibben.substack.com" },
    { name: "Climate Psychologist", description: "The psychology of climate change and how we respond to it.", url: "https://climatepsychologist.substack.com" },
    { name: "Heatmap News", description: "The energy transition and climate politics, explained.", url: "https://heatmap.news" },
  ],
  "Education": [
    { name: "Aftermath", description: "Bryan Alexander on the future of higher education and learning.", url: "https://bryantalexander.substack.com" },
    { name: "One Useful Thing", description: "Ethan Mollick on AI, education, and the science of learning.", url: "https://www.oneusefulthing.org" },
    { name: "Doug Lederman", description: "Inside Higher Ed co-founder on higher ed policy, politics, and reform.", url: "https://douglederman.substack.com" },
    { name: "The Grade", description: "Rigorous analysis of how education is covered — and miscovered — in the media.", url: "https://thegrade.substack.com" },
    { name: "Higher Ed Dive", description: "Daily briefing on higher education strategy, policy, and finance.", url: "https://www.highereddive.com" },
  ],
  "Science": [
    { name: "The Experimentalist", description: "How scientific research actually works — and what's going wrong.", url: "https://experimentalist.substack.com" },
    { name: "ScienceAlert", description: "Breaking science news and research explained for curious readers.", url: "https://www.sciencealert.com" },
    { name: "Astral Codex Ten", description: "Scott Alexander on science, medicine, statistics, and policy.", url: "https://www.astralcodexten.com" },
    { name: "Works in Progress", description: "Long-form essays on science, technology, and human progress.", url: "https://www.worksinprogress.news" },
    { name: "The Prepared", description: "Research-backed analysis on science funding, R&D policy, and innovation.", url: "https://theprepared.substack.com" },
  ],
  "Immigration": [
    { name: "Immigration Uncovered", description: "Clear-eyed analysis of immigration law, enforcement, and policy.", url: "https://immigrationuncovered.substack.com" },
    { name: "The Dispatch", description: "Center-right reporting and commentary including immigration policy analysis.", url: "https://thedispatch.com" },
    { name: "Dara Lind", description: "ProPublica immigration reporter's analysis of policy and enforcement.", url: "https://daralind.substack.com" },
    { name: "Cato at Liberty", description: "Libertarian policy analysis on immigration reform and open borders.", url: "https://www.cato.org/blog" },
    { name: "Roberto Suro", description: "USC professor and veteran immigration journalist on policy and politics.", url: "https://robertosuro.substack.com" },
  ],
  "Democracy & Media": [
    { name: "Press Run", description: "Eric Boehlert on media failures, press accountability, and political journalism.", url: "https://pressrun.media" },
    { name: "The Present Age", description: "Parker Molloy on media, politics, and the information ecosystem.", url: "https://present.substack.com" },
    { name: "Platformer", description: "Casey Newton's essential newsletter on big tech and its political influence.", url: "https://www.platformer.news" },
    { name: "Garbage Day", description: "Ryan Broderick on internet culture, viral media, and online politics.", url: "https://www.garbageday.email" },
    { name: "Puck News", description: "Inside-the-room reporting on media, power, and Washington politics.", url: "https://puck.news" },
  ],
  "Foreign Policy": [
    { name: "Stay Sane America", description: "Tom Nichols on foreign policy, democracy, and the world beyond Washington.", url: "https://tom-nichols.substack.com" },
    { name: "War on the Rocks", description: "Strategy and foreign policy analysis from practitioners and scholars.", url: "https://warontherocks.com" },
    { name: "Anne Applebaum", description: "Atlantic staff writer on authoritarianism, democracy, and U.S. foreign policy.", url: "https://anneapplebaum.substack.com" },
    { name: "Timothy Snyder", description: "Yale historian on tyranny, Ukraine, and the future of democracy.", url: "https://snyder.substack.com" },
    { name: "CNAS", description: "Center for a New American Security — nonpartisan analysis on global security.", url: "https://www.cnas.org/publications" },
  ],
  "Human Rights": [
    { name: "Facing History", description: "Education and analysis connecting history, human rights, and civic responsibility.", url: "https://www.facinghistory.org/resource-library" },
    { name: "Rights as Usual", description: "Human rights law and policy explained for non-lawyers.", url: "https://rightsasusual.substack.com" },
    { name: "The Dissenter", description: "Kevin Gosztola on civil liberties, press freedom, and accountability.", url: "https://thedissenter.substack.com" },
    { name: "Freedom of the Press", description: "Updates from Freedom of the Press Foundation on surveillance and digital rights.", url: "https://freedom.press/news" },
    { name: "Just Security", description: "Legal analysis bridging national security, rights, and accountability.", url: "https://www.justsecurity.org" },
  ],
}

const NONPROFITS = {
  "Elections": [
    { name: "League of Women Voters", description: "Nonpartisan voter registration, education, and advocacy for fair elections since 1920.", url: "https://www.lwv.org/donate" },
    { name: "Brennan Center for Justice", description: "Research and litigation on voting rights, election security, and campaign finance reform.", url: "https://www.brennancenter.org/donate" },
    { name: "Common Cause", description: "Holds power accountable and fights for fair elections, redistricting reform, and voting access.", url: "https://www.commoncause.org/donate/" },
  ],
  "Executive Power": [
    { name: "Common Cause", description: "Holds power accountable through nonpartisan government oversight and transparency advocacy.", url: "https://www.commoncause.org/donate/" },
    { name: "Brennan Center for Justice", description: "Researches and litigates on executive authority, voting rights, and constitutional limits.", url: "https://www.brennancenter.org/donate" },
    { name: "Campaign Legal Center", description: "Advances democracy through litigation and policy work on campaign finance and ethics.", url: "https://campaignlegal.org/donate" },
  ],
  "Rule of Law": [
    { name: "ACLU", description: "Defends individual rights and liberties in courts and legislatures nationwide.", url: "https://action.aclu.org/donate-aclu" },
    { name: "Brennan Center for Justice", description: "Works to reform and protect American democratic institutions and rule of law.", url: "https://www.brennancenter.org/donate" },
    { name: "Project on Government Oversight", description: "Investigates and exposes government abuses to advance accountability.", url: "https://www.pogo.org/donate" },
  ],
  "Economy": [
    { name: "Economic Policy Institute", description: "Research and policy advocacy to improve economic conditions for low- and middle-income workers.", url: "https://www.epi.org/donate/" },
    { name: "Center on Budget and Policy Priorities", description: "Analyzes federal and state budget policies and their effects on low-income households.", url: "https://www.cbpp.org/donate" },
    { name: "Demos", description: "Advocates for economic opportunity, democracy, and an inclusive society.", url: "https://www.demos.org/donate" },
  ],
  "Civil Rights": [
    { name: "ACLU", description: "Defends civil liberties and civil rights through litigation, advocacy, and education.", url: "https://action.aclu.org/donate-aclu" },
    { name: "NAACP Legal Defense Fund", description: "Litigates to achieve racial justice and advance civil rights in America.", url: "https://www.naacpldf.org/donate/" },
    { name: "Southern Poverty Law Center", description: "Monitors hate groups and pursues civil rights litigation across the South.", url: "https://www.splcenter.org/donate" },
  ],
  "National Security": [
    { name: "Arms Control Association", description: "Advocates for arms control and disarmament to reduce global security threats.", url: "https://www.armscontrol.org/contribute" },
    { name: "Project on Government Oversight", description: "Oversees Pentagon and intelligence community spending and accountability.", url: "https://www.pogo.org/donate" },
    { name: "Human Rights Watch", description: "Investigates and exposes human rights abuses linked to military and security operations.", url: "https://www.hrw.org/donate" },
  ],
  "Healthcare": [
    { name: "Families USA", description: "National advocacy organization working to achieve high-quality, affordable healthcare.", url: "https://familiesusa.org/donate/" },
    { name: "National Patient Advocate Foundation", description: "Helps patients access and afford the health care they need.", url: "https://www.npaf.org/donate/" },
    { name: "Doctors Without Borders", description: "Delivers emergency medical care in health crises regardless of politics.", url: "https://donate.doctorswithoutborders.org/" },
  ],
  "Environment": [
    { name: "Sierra Club", description: "America's oldest and largest grassroots environmental organization.", url: "https://www.sierraclub.org/donate" },
    { name: "Natural Resources Defense Council", description: "Uses law, science, and advocacy to protect the environment and public health.", url: "https://www.nrdc.org/donate" },
    { name: "Environmental Defense Fund", description: "Finds practical, nonpartisan solutions to environmental challenges.", url: "https://www.edf.org/donate" },
  ],
  "Education": [
    { name: "National Education Association Foundation", description: "Supports public education through grants, scholarships, and advocacy.", url: "https://www.neafoundation.org/donate/" },
    { name: "PEN America", description: "Defends academic freedom, free expression, and open inquiry in schools.", url: "https://pen.org/donate/" },
    { name: "DonorsChoose", description: "Connects donors directly with public school classroom projects in need.", url: "https://www.donorschoose.org" },
  ],
  "Science": [
    { name: "Union of Concerned Scientists", description: "Uses science to protect our health, safety, and the environment from political interference.", url: "https://www.ucsusa.org/donate" },
    { name: "American Association for the Advancement of Science", description: "Advances science and serves society through advocacy for research and evidence-based policy.", url: "https://www.aaas.org/donate" },
    { name: "March for Science", description: "Advocates for evidence-based policy and the value of science in public life.", url: "https://marchforscience.org/donate" },
  ],
  "Immigration": [
    { name: "RAICES", description: "Provides legal services and advocates for immigrant families and asylum seekers.", url: "https://www.raicestexas.org/donate/" },
    { name: "National Immigration Law Center", description: "Defends and advances the rights of low-income immigrants through litigation and policy.", url: "https://www.nilc.org/donate/" },
    { name: "International Rescue Committee", description: "Helps refugees and displaced people rebuild their lives in safety and dignity.", url: "https://www.rescue.org/donate" },
  ],
  "Democracy & Media": [
    { name: "Committee to Protect Journalists", description: "Defends journalists and press freedom around the world.", url: "https://cpj.org/donate/" },
    { name: "Reporters Without Borders", description: "Advocates for freedom of the press and information worldwide.", url: "https://rsf.org/en/donate" },
    { name: "PEN America", description: "Champions free expression and fights censorship of writers and journalists.", url: "https://pen.org/donate/" },
  ],
  "Foreign Policy": [
    { name: "Quincy Institute for Responsible Statecraft", description: "Advocates for a more restrained, diplomacy-first U.S. foreign policy.", url: "https://quincyinst.org/donate" },
    { name: "Arms Control Association", description: "Advocates for arms control and disarmament to reduce global security threats.", url: "https://www.armscontrol.org/contribute" },
    { name: "Council on Foreign Relations", description: "Independent think tank providing nonpartisan analysis on U.S. foreign policy.", url: "https://www.cfr.org/membership" },
  ],
  "Human Rights": [
    { name: "Human Rights Watch", description: "Investigates and exposes human rights abuses around the world.", url: "https://www.hrw.org/donate" },
    { name: "Amnesty International USA", description: "Campaigns globally for human rights, dignity, and justice.", url: "https://www.amnesty.org/en/donate" },
    { name: "American Civil Liberties Union", description: "Defends civil liberties and human rights through litigation and advocacy.", url: "https://action.aclu.org/donate-aclu" },
  ],
}

// ─── Main page ────────────────────────────────────────────────────────────────

const CALL_RE      = /\b(call|contact|write|email|reach out)\b/i
const CIVIC_RE     = /\b(senator|representative|congress(man|woman|person)?|rep\b|member of congress|official|lawmaker|commerce department|state department|white house)\b/i
const PETITION_RE  = /\b(petition|sign a? ?petition)\b/i
const DONATE_RE    = /\bdonate\b/i
const ATTEND_RE    = /\b(attend|join|volunteer)\b/i
const GOVT_RE      = /\b(committee|hearing|bill|legislation|congress|senate|house|federal|agency|regulation|foia|vote|voting)\b/i

// Source patterns — if the action text names a known outlet, link there directly
const SOURCE_PATTERNS = [
  { re: /\bcongress\.gov\b/i,          url: t => `https://congress.gov/search?q=${encodeURIComponent(t)}` },
  { re: /\bopensecrets\b/i,            url: () => "https://www.opensecrets.org" },
  { re: /\bgovtrack\b/i,               url: t => `https://www.govtrack.us/search?q=${encodeURIComponent(t)}` },
  { re: /\bscotus\b|supreme court\b/i, url: () => "https://www.supremecourt.gov" },
  { re: /\bfec\.gov\b|federal election commission\b/i, url: () => "https://www.fec.gov" },
  { re: /\busa\.gov\b/i,               url: () => "https://www.usa.gov" },
]

function getActionUrl(actionText, issueTitle) {
  const t = actionText

  // Contact / call your rep
  if (CALL_RE.test(t) || CIVIC_RE.test(t)) return "https://5calls.org"

  // Petition / sign
  if (PETITION_RE.test(t)) return `https://www.change.org/search?q=${encodeURIComponent(issueTitle)}`

  // Donate → scroll to nonprofits section
  if (DONATE_RE.test(t)) return "#take-action"

  // Attend / join / volunteer
  if (ATTEND_RE.test(t)) return `https://www.volunteermatch.org/search?k=${encodeURIComponent(issueTitle)}`

  // Research / read / track / monitor / follow — check for named sources first
  if (/\b(read|review|research|track|monitor|follow|learn|understand|explore)\b/i.test(t)) {
    for (const { re, url } of SOURCE_PATTERNS) {
      if (re.test(t)) return url(issueTitle)
    }
    // Government-related → congress.gov search
    if (GOVT_RE.test(t)) return `https://congress.gov/search?q=${encodeURIComponent(issueTitle)}`
    // Generic research — congress.gov is still more useful than Google for civic actions
    return `https://congress.gov/search?q=${encodeURIComponent(issueTitle)}`
  }

  return "https://5calls.org"
}

export default function IssuePage() {
  const params            = useParams()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completedKeys,   setCompletedKeys]   = useState(new Set())
  const [weekCount,       setWeekCount]       = useState(null)
  const [zipCode,         setZipCode]         = useState("")
  const [pickedNL,        setPickedNL]        = useState(null) // set once on mount

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
      setCompletedKeys(new Set(stored.filter(s => typeof s === "string")))
    } catch {}
    try {
      const z = localStorage.getItem("userZipCode")
      if (z) setZipCode(z)
    } catch {}
  }, [])

  // Pick newsletters once after issue loads (category is needed)
  useEffect(() => {
    if (!issue?.category || pickedNL) return
    const mainstream = pick(NL_MAINSTREAM[issue.category] || [], 2)
    const substack   = pick(NL_SUBSTACK[issue.category]   || [], 2)
    setPickedNL([...mainstream, ...substack])
  }, [issue?.category])

  // Fetch weekly action count for this issue
  useEffect(() => {
    if (!params.slug) return
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    supabase
      .from("action_clicks")
      .select("issue_slug", { count: "exact", head: true })
      .eq("issue_slug", params.slug)
      .gte("clicked_at", since)
      .then(({ count }) => { if (count !== null) setWeekCount(count) })
      .catch(() => {})
  }, [params.slug])

  useEffect(() => {
    supabase.from("issues").select("*").eq("slug", params.slug).eq("is_published", true).single()
      .then(({ data }) => { if (data) setIssue(data); setLoading(false) })
  }, [params.slug])

  function handleAction(actionIndex, url) {
    const key = `${params.slug}-${actionIndex}`
    const isDone = completedKeys.has(key)

    if (isDone) {
      // Undo: remove from state and localStorage, no link open
      setCompletedKeys(prev => { const next = new Set(prev); next.delete(key); return next })
      try {
        const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
        localStorage.setItem("completedActions", JSON.stringify(stored.filter(k => k !== key)))
      } catch {}
      return
    }

    // Not done yet — open link first (synchronous, avoids popup blockers) then mark complete
    if (url) {
      if (url.startsWith("#")) {
        document.getElementById(url.slice(1))?.scrollIntoView({ behavior: "smooth" })
      } else {
        window.open(url, "_blank", "noopener,noreferrer")
      }
    }

    setCompletedKeys(prev => {
      const next = new Set(prev)
      next.add(key)
      try {
        const stored = JSON.parse(localStorage.getItem("completedActions") || "[]")
        if (!stored.includes(key)) {
          stored.push(key)
          localStorage.setItem("completedActions", JSON.stringify(stored))
        }
      } catch {}
      supabase.from("action_clicks").insert({
        issue_slug: params.slug, action_index: actionIndex, clicked_at: new Date().toISOString(),
      }).then(() => setWeekCount(c => (c || 0) + 1)).catch(() => {})
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from("user_actions").upsert(
            { user_id: user.id, issue_slug: params.slug, action_index: actionIndex, completed_at: new Date().toISOString() },
            { onConflict: "user_id,issue_slug,action_index" }
          ).catch(() => {})
          supabase.from("user_activity").insert({
            user_id: user.id,
            activity_type: "completed_action",
            issue_slug: params.slug,
            issue_title: issue?.title || null,
            created_at: new Date().toISOString(),
          }).catch(() => {})
        }
      })
      return next
    })
  }

  if (loading) return <LoadingScreen />
  if (!issue)  return <NotFoundScreen />

  const sev        = getSev(issue.severity_score)
  const hasActions = issue.actions?.length > 0
  const hasPlayers = issue.players?.length > 0

  const SH = {
    fontSize: 10, fontWeight: 700, color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: "0.12em",
    margin: "0 0 20px",
  }

  const newsletters = pickedNL || []
  const nonprofits  = NONPROFITS[issue.category] || []

  const CARD = {
    borderRadius: 10, border: "1px solid #e5e7eb",
    background: "#ffffff", padding: "20px",
  }

  const VOLUNTEER_KEYWORDS = {
    "Environment":      "environment",
    "Civil Rights":     "civil-rights",
    "Elections":        "voter-registration",
    "Economy":          "economic-justice",
    "National Security":"veterans",
    "Healthcare":       "health",
    "Immigration":      "immigration",
    "Education":        "education",
    "Science":          "research",
    "Democracy & Media":"democracy",
    "Executive Power":  "civic-engagement",
    "Rule of Law":      "justice",
    "Foreign Policy":   "international",
    "Human Rights":     "human-rights",
  }
  const volunteerKeyword = VOLUNTEER_KEYWORDS[issue.category] || "civic-engagement"
  const idealistUrl = zipCode
    ? `https://www.idealist.org/en/volunteer?q=${volunteerKeyword}&location=${encodeURIComponent(zipCode)}`
    : `https://www.idealist.org/en/volunteer?q=${volunteerKeyword}`

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#ffffff" }}>
      <style>{`
        .issue-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        @media (min-width: 1024px) {
          .issue-layout {
            grid-template-columns: 2fr 1fr;
            gap: 56px;
          }
        }
        .nonprofit-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .nonprofit-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      {/* ── Dark hero ── */}
      <div style={{ background: "#FDFAF3" }}>
        <SiteHeader />
        <div style={{ background: "linear-gradient(160deg, #E8E4D8 0%, #FDFAF3 100%)" }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "44px 40px 52px" }}>
            <Link href="/" style={{ fontSize: 12, color: "#4A5C4B", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, marginBottom: 20 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 10H5M9 5l-5 5 5 5"/>
              </svg>
              Back to Herd
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                color: sev.accent, background: sev.accent + "18",
                padding: "4px 10px", borderRadius: 5, border: `1px solid ${sev.accent}30`,
              }}>{issue.category}</span>
              {issue.date && <span style={{ fontSize: 12, color: "#4A5C4B" }}>{issue.date}</span>}
            </div>
            <h1 style={{
              fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 800, color: "#1C2E1E",
              lineHeight: 1.15, letterSpacing: "-0.025em", margin: 0, maxWidth: 720,
            }}>
              {issue.title}
            </h1>
          </div>
          <svg viewBox="0 0 1440 36" fill="none" style={{ display: "block", width: "100%", marginBottom: -2 }}>
            <path d="M0 36 L0 18 Q360 0 720 18 Q1080 36 1440 18 L1440 36 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      {/* ── Two-column content ── */}
      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "48px 40px 80px" }}>

        {/* Severity rule — spans full content width */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.14em",
            textTransform: "uppercase", color: sev.accent, whiteSpace: "nowrap",
          }}>
            {issue.severity_label || sev.label}
          </span>
          <div style={{ flex: 1, height: 2, background: sev.accent, borderRadius: 1, opacity: 0.35 }} />
        </div>

        <div className="issue-layout">

          {/* ════ LEFT COLUMN ════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40, minWidth: 0 }}>

            {/* 1. What Is Happening */}
            <section>
              <p style={SH}>What Is Happening</p>
              <p style={{ color: "#374151", lineHeight: 1.85, fontSize: 18, margin: 0, fontWeight: 400, letterSpacing: "-0.01em" }}>
                {issue.description}
              </p>
            </section>

            {/* 2. What You Can Do */}
            {hasActions && (
              <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ ...SH, marginBottom: 0 }}>What You Can Do</p>
                  {weekCount !== null && weekCount > 0 && (
                    <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: "#15803d", fontSize: 8 }}>●</span>
                      <strong style={{ color: "#6B7C6C" }}>{weekCount}</strong>&nbsp;{weekCount === 1 ? "person" : "people"} took action this week
                    </span>
                  )}
                </div>
                <div>
                  {issue.actions.map((action, i) => {
                    const ef         = effortConfig(action.effort)
                    const done       = completedKeys.has(`${params.slug}-${i}`)
                    const isCallItem = CALL_RE.test(action.text)
                    const actionUrl  = getActionUrl(action.text, issue.title)
                    return (
                      <div key={i} style={{ borderTop: i === 0 ? "1px solid #f3f4f6" : "none", borderBottom: "1px solid #f3f4f6" }}>
                        <button
                          onClick={() => handleAction(i, actionUrl)}
                          style={{
                            display: "flex", alignItems: "center", gap: 16, padding: "14px 4px",
                            cursor: "pointer", width: "100%", textAlign: "left",
                            background: done ? "#f9fafb" : "transparent",
                            border: "none", fontFamily: "inherit",
                            transition: "background 0.15s",
                          }}
                        >
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            padding: "4px 9px", borderRadius: 5, flexShrink: 0, whiteSpace: "nowrap",
                            color: done ? "#16a34a" : ef.color,
                            background: done ? "#dcfce7" : ef.bg,
                            border: `1px solid ${done ? "#16a34a" : ef.border}`,
                          }}>{action.effort}</span>
                          <span style={{
                            fontSize: 14, lineHeight: 1.55, flex: 1,
                            color: done ? "#9ca3af" : "#1a1a1a",
                            textDecoration: done ? "line-through" : "none",
                          }}>
                            {isCallItem && !done ? "📞 " : ""}{action.text}
                            {isCallItem && !done && (
                              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}> — via 5Calls ↗</span>
                            )}
                          </span>
                          {done ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                              <span style={{ fontSize: 14, color: "#16a34a" }}>✓</span>
                              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>undo</span>
                            </span>
                          ) : (
                            <svg style={{ width: 13, height: 13, color: "#d1d5db", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 3. Take Action With Your Money */}
            {nonprofits.length > 0 && (
              <section id="take-action">
                <p style={SH}>Take Action With Your Money</p>
                <div className="nonprofit-grid">
                  {nonprofits.map((org, i) => (
                    <div
                      key={i}
                      style={{ ...CARD, display: "flex", flexDirection: "column" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2E1E", marginBottom: 6 }}>{org.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 12, flex: 1 }}>{org.description}</div>
                      <a
                        href={org.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block", textAlign: "center",
                          fontSize: 12, fontWeight: 700,
                          padding: "7px 0", borderRadius: 8,
                          background: "#eff6ff", border: "1px solid #bfdbfe",
                          color: "#1d4ed8", textDecoration: "none",
                        }}
                      >Donate →</a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Key Players */}
            {hasPlayers && (
              <section>
                <p style={SH}>Key Players</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {issue.players.map((player, i) => (
                    <PlayerCard key={i} player={player} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
                  ⚡ = up for election in 2026 · Re-election odds via Kalshi prediction markets
                </p>
              </section>
            )}

            {/* 5. Get Involved Near You */}
            <section>
              <p style={SH}>Get Involved Near You</p>
              <div
                style={{ ...CARD }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                {zipCode && (
                  <p style={{ fontSize: 13, color: "#6B7C6C", lineHeight: 1.65, margin: "0 0 16px" }}>
                    Showing opportunities for <strong style={{ color: "#1C2E1E" }}>{zipCode}</strong>. Your zip is also pre-filled in the Call My Rep button.
                  </p>
                )}
                <a
                  href={idealistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                    fontSize: 13, fontWeight: 700, color: "#15803d", textDecoration: "none",
                  }}
                >
                  <span>Find Volunteer Opportunities Near You</span>
                  <span style={{ color: "#6b7280" }}>→</span>
                </a>
              </div>
            </section>

          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Call My Rep card */}
            <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", background: "#ffffff", padding: "20px 20px 24px" }}>
              <a
                href={zipCode ? `https://5calls.org/?address=${encodeURIComponent(zipCode)}` : "https://5calls.org"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "16px 20px", borderRadius: 10,
                  background: "#059669", color: "#ffffff",
                  fontSize: 15, fontWeight: 800, textDecoration: "none",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 4px 16px rgba(5,150,105,0.3)",
                  width: "100%", boxSizing: "border-box",
                }}
              >
                📞 Call My Rep
              </a>
              {zipCode && (
                <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
                  Pre-filled for zip code {zipCode}
                </p>
              )}
            </div>

            {/* Stay Informed — stacked newsletter cards */}
            {newsletters.length > 0 && (
              <section>
                <p style={SH}>Stay Informed</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {newsletters.map((nl, i) => {
                    const isSubstack = NL_SUBSTACK[issue.category]?.some(s => s.name === nl.name)
                    return (
                      <div
                        key={i}
                        style={{ borderRadius: 10, border: "1px solid #e5e7eb", background: "#ffffff", padding: "16px", display: "flex", flexDirection: "column", transition: "border-color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2E1E", lineHeight: 1.3 }}>{nl.name}</div>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                            padding: "2px 7px", borderRadius: 4, flexShrink: 0,
                            background: isSubstack ? "rgba(255,102,0,0.08)" : "rgba(21,128,61,0.08)",
                            color:      isSubstack ? "#c2410c"              : "#1d4ed8",
                            border:     `1px solid ${isSubstack ? "rgba(255,102,0,0.2)" : "rgba(21,128,61,0.2)"}`,
                          }}>{isSubstack ? "Substack" : "Newsletter"}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, flex: 1 }}>{nl.description}</div>
                        <a
                          href={nl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginTop: 10, fontSize: 12, fontWeight: 700,
                            color: "#059669", textDecoration: "none",
                            display: "inline-flex", alignItems: "center", gap: 4,
                          }}
                        >Subscribe →</a>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

          </div>

        </div>
      </main>

      <footer style={{ borderTop: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>How Bad Is It?</span>
          <span style={{ fontSize: 11, color: "#d1d5db" }}>Not affiliated with any political party.</span>
        </div>
      </footer>
    </div>
  )
}
