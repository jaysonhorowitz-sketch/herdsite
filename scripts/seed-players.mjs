/**
 * seed-players.mjs
 * Adds `players` arrays to key issues in Supabase.
 *
 * Prerequisites:
 *   1. Run in Supabase SQL editor:
 *      ALTER TABLE issues ADD COLUMN IF NOT EXISTS players JSONB DEFAULT '[]'::jsonb;
 *   2. Set env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * Usage: node scripts/seed-players.mjs
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Each entry: { slug, players[] }
// Players schema: name, party, state, role, chamber, next_election,
//                 bioguide_id, kalshi_ticker, contact_url, opensecrets_id
const ISSUE_PLAYERS = [

  // ── MEDICAID BLOCK GRANTS ─────────────────────────────────────────────────
  {
    slug: "medicaid-block-grants",
    players: [
      {
        name: "Mike Crapo",
        party: "R",
        state: "ID",
        role: "Chair, Senate Finance Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "C000880",
        kalshi_ticker: null,
        contact_url: "https://www.crapo.senate.gov/contact",
        opensecrets_id: "N00006267",
      },
      {
        name: "Ron Wyden",
        party: "D",
        state: "OR",
        role: "Ranking Member, Senate Finance Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "W000779",
        kalshi_ticker: null,
        contact_url: "https://www.wyden.senate.gov/contact",
        opensecrets_id: "N00007724",
      },
      {
        name: "Jason Smith",
        party: "R",
        state: "MO",
        role: "Chair, House Ways & Means Committee",
        chamber: "House",
        next_election: 2026,
        bioguide_id: "S001195",
        kalshi_ticker: null,
        contact_url: "https://jasonsmith.house.gov/contact",
        opensecrets_id: "N00033492",
      },
      {
        name: "Richard Neal",
        party: "D",
        state: "MA",
        role: "Ranking Member, House Ways & Means Committee",
        chamber: "House",
        next_election: 2026,
        bioguide_id: "N000015",
        kalshi_ticker: null,
        contact_url: "https://neal.house.gov/contact",
        opensecrets_id: "N00000153",
      },
    ],
  },

  // ── TARIFFS ───────────────────────────────────────────────────────────────
  {
    slug: "tariffs-trump-2025",
    players: [
      {
        name: "Donald Trump",
        party: "R",
        state: "FL",
        role: "President of the United States",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: "PRES-2028-DJT",
        contact_url: "https://www.whitehouse.gov/contact/",
        opensecrets_id: "N00023864",
      },
      {
        name: "Jason Smith",
        party: "R",
        state: "MO",
        role: "Chair, House Ways & Means Committee",
        chamber: "House",
        next_election: 2026,
        bioguide_id: "S001195",
        kalshi_ticker: null,
        contact_url: "https://jasonsmith.house.gov/contact",
        opensecrets_id: "N00033492",
      },
      {
        name: "Mike Crapo",
        party: "R",
        state: "ID",
        role: "Chair, Senate Finance Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "C000880",
        kalshi_ticker: null,
        contact_url: "https://www.crapo.senate.gov/contact",
        opensecrets_id: "N00006267",
      },
    ],
  },

  // ── DOGE / FEDERAL WORKFORCE CUTS ────────────────────────────────────────
  {
    slug: "doge-federal-workforce-cuts",
    players: [
      {
        name: "Elon Musk",
        party: "I",
        state: "TX",
        role: "Head, Department of Government Efficiency (DOGE)",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.whitehouse.gov/contact/",
        opensecrets_id: null,
      },
      {
        name: "Gary Peters",
        party: "D",
        state: "MI",
        role: "Ranking Member, Senate Homeland Security & Governmental Affairs",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "P000595",
        kalshi_ticker: "MISEN26",
        contact_url: "https://www.peters.senate.gov/contact",
        opensecrets_id: "N00029277",
      },
      {
        name: "Rand Paul",
        party: "R",
        state: "KY",
        role: "Chair, Senate Homeland Security & Governmental Affairs",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "P000603",
        kalshi_ticker: null,
        contact_url: "https://www.paul.senate.gov/contact",
        opensecrets_id: "N00030836",
      },
    ],
  },

  // ── JUDICIARY / RULE OF LAW ───────────────────────────────────────────────
  {
    slug: "independence-of-judiciary",
    players: [
      {
        name: "Chuck Grassley",
        party: "R",
        state: "IA",
        role: "Chair, Senate Judiciary Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "G000386",
        kalshi_ticker: null,
        contact_url: "https://www.grassley.senate.gov/contact",
        opensecrets_id: "N00001758",
      },
      {
        name: "Dick Durbin",
        party: "D",
        state: "IL",
        role: "Ranking Member, Senate Judiciary Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "D000563",
        kalshi_ticker: "ILSEN26",
        contact_url: "https://www.durbin.senate.gov/contact",
        opensecrets_id: "N00004981",
      },
      {
        name: "Jim Jordan",
        party: "R",
        state: "OH",
        role: "Chair, House Judiciary Committee",
        chamber: "House",
        next_election: 2026,
        bioguide_id: "J000289",
        kalshi_ticker: null,
        contact_url: "https://jordan.house.gov/contact",
        opensecrets_id: "N00026367",
      },
    ],
  },

  // ── DOJ INDEPENDENCE ──────────────────────────────────────────────────────
  {
    slug: "doj-independence-undermined",
    players: [
      {
        name: "Pam Bondi",
        party: "R",
        state: "FL",
        role: "Attorney General of the United States",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.justice.gov/contact-doj",
        opensecrets_id: null,
      },
      {
        name: "Chuck Grassley",
        party: "R",
        state: "IA",
        role: "Chair, Senate Judiciary Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "G000386",
        kalshi_ticker: null,
        contact_url: "https://www.grassley.senate.gov/contact",
        opensecrets_id: "N00001758",
      },
      {
        name: "Dick Durbin",
        party: "D",
        state: "IL",
        role: "Ranking Member, Senate Judiciary Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "D000563",
        kalshi_ticker: "ILSEN26",
        contact_url: "https://www.durbin.senate.gov/contact",
        opensecrets_id: "N00004981",
      },
    ],
  },

  // ── PRESS FREEDOM / MEDIA ─────────────────────────────────────────────────
  {
    slug: "media-independence-threatened",
    players: [
      {
        name: "Donald Trump",
        party: "R",
        state: "FL",
        role: "President of the United States",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.whitehouse.gov/contact/",
        opensecrets_id: "N00023864",
      },
      {
        name: "Amy Klobuchar",
        party: "D",
        state: "MN",
        role: "Ranking Member, Senate Commerce Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "K000367",
        kalshi_ticker: null,
        contact_url: "https://www.klobuchar.senate.gov/public/index.cfm/contact",
        opensecrets_id: "N00029097",
      },
      {
        name: "Ted Cruz",
        party: "R",
        state: "TX",
        role: "Chair, Senate Commerce Committee",
        chamber: "Senate",
        next_election: 2030,
        bioguide_id: "C001098",
        kalshi_ticker: null,
        contact_url: "https://www.cruz.senate.gov/contact",
        opensecrets_id: "N00033085",
      },
    ],
  },

  // ── IMMIGRATION / DEPORTATIONS ────────────────────────────────────────────
  {
    slug: "mass-deportation-operations",
    players: [
      {
        name: "Kristi Noem",
        party: "R",
        state: "SD",
        role: "Secretary of Homeland Security",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.dhs.gov/contact-us",
        opensecrets_id: "N00032649",
      },
      {
        name: "Tom Homan",
        party: "R",
        state: "NY",
        role: "Border Czar (Acting Director, ICE)",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.ice.gov/contact",
        opensecrets_id: null,
      },
      {
        name: "Alex Padilla",
        party: "D",
        state: "CA",
        role: "Ranking Member, Senate Judiciary Subcommittee on Immigration",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "P000145",
        kalshi_ticker: "CASEN26",
        contact_url: "https://www.padilla.senate.gov/contact/",
        opensecrets_id: "N00037003",
      },
    ],
  },

  // ── FOREIGN AID FREEZE ────────────────────────────────────────────────────
  {
    slug: "foreign-aid-freeze",
    players: [
      {
        name: "Marco Rubio",
        party: "R",
        state: "FL",
        role: "Secretary of State",
        chamber: "Executive",
        next_election: null,
        bioguide_id: "R000595",
        kalshi_ticker: null,
        contact_url: "https://www.state.gov/contact-us/",
        opensecrets_id: "N00030612",
      },
      {
        name: "Jeanne Shaheen",
        party: "D",
        state: "NH",
        role: "Ranking Member, Senate Foreign Relations Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "S001181",
        kalshi_ticker: "NHSEN26",
        contact_url: "https://www.shaheen.senate.gov/contact/",
        opensecrets_id: "N00024790",
      },
      {
        name: "Jim Risch",
        party: "R",
        state: "ID",
        role: "Chair, Senate Foreign Relations Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "R000584",
        kalshi_ticker: null,
        contact_url: "https://www.risch.senate.gov/public/index.cfm/contact-jim",
        opensecrets_id: "N00029441",
      },
    ],
  },

  // ── EPA ROLLBACKS ─────────────────────────────────────────────────────────
  {
    slug: "epa-enforcement-rollback",
    players: [
      {
        name: "Lee Zeldin",
        party: "R",
        state: "NY",
        role: "EPA Administrator",
        chamber: "Executive",
        next_election: null,
        bioguide_id: "Z000017",
        kalshi_ticker: null,
        contact_url: "https://www.epa.gov/aboutepa/forms/contact-epa",
        opensecrets_id: "N00030696",
      },
      {
        name: "Sheldon Whitehouse",
        party: "D",
        state: "RI",
        role: "Ranking Member, Senate Environment & Public Works Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "W000802",
        kalshi_ticker: null,
        contact_url: "https://www.whitehouse.senate.gov/contact/",
        opensecrets_id: "N00027533",
      },
      {
        name: "Shelley Moore Capito",
        party: "R",
        state: "WV",
        role: "Chair, Senate Environment & Public Works Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "C001047",
        kalshi_ticker: null,
        contact_url: "https://www.capito.senate.gov/contact/contact-shelley",
        opensecrets_id: "N00009771",
      },
    ],
  },

  // ── NIH / CDC FUNDING CUTS ────────────────────────────────────────────────
  {
    slug: "nih-cdc-funding-cuts",
    players: [
      {
        name: "Robert F. Kennedy Jr.",
        party: "R",
        state: "NY",
        role: "Secretary of Health and Human Services",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.hhs.gov/about/contact-hhs/index.html",
        opensecrets_id: null,
      },
      {
        name: "Patty Murray",
        party: "D",
        state: "WA",
        role: "Ranking Member, Senate HELP Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "M001111",
        kalshi_ticker: null,
        contact_url: "https://www.murray.senate.gov/contact/",
        opensecrets_id: "N00007876",
      },
      {
        name: "Bill Cassidy",
        party: "R",
        state: "LA",
        role: "Chair, Senate HELP Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "C001075",
        kalshi_ticker: "LASEN26",
        contact_url: "https://www.cassidy.senate.gov/contact",
        opensecrets_id: "N00029871",
      },
    ],
  },

  // ── STUDENT LOAN FORGIVENESS ──────────────────────────────────────────────
  {
    slug: "student-loan-forgiveness-blocked",
    players: [
      {
        name: "Linda McMahon",
        party: "R",
        state: "CT",
        role: "Secretary of Education",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.ed.gov/about/contacts/gen/index.html",
        opensecrets_id: "N00033723",
      },
      {
        name: "Patty Murray",
        party: "D",
        state: "WA",
        role: "Ranking Member, Senate HELP Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "M001111",
        kalshi_ticker: null,
        contact_url: "https://www.murray.senate.gov/contact/",
        opensecrets_id: "N00007876",
      },
      {
        name: "Bobby Scott",
        party: "D",
        state: "VA",
        role: "Ranking Member, House Education & Workforce Committee",
        chamber: "House",
        next_election: 2026,
        bioguide_id: "S000185",
        kalshi_ticker: null,
        contact_url: "https://bobbyscott.house.gov/contact",
        opensecrets_id: "N00002147",
      },
    ],
  },

  // ── UKRAINE AID ───────────────────────────────────────────────────────────
  {
    slug: "ukraine-military-aid-suspended",
    players: [
      {
        name: "Pete Hegseth",
        party: "R",
        state: "MN",
        role: "Secretary of Defense",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.defense.gov/Contact/",
        opensecrets_id: null,
      },
      {
        name: "Roger Wicker",
        party: "R",
        state: "MS",
        role: "Chair, Senate Armed Services Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "W000437",
        kalshi_ticker: null,
        contact_url: "https://www.wicker.senate.gov/contact/",
        opensecrets_id: "N00003280",
      },
      {
        name: "Jack Reed",
        party: "D",
        state: "RI",
        role: "Ranking Member, Senate Armed Services Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "R000122",
        kalshi_ticker: null,
        contact_url: "https://www.reed.senate.gov/contact/",
        opensecrets_id: "N00000362",
      },
    ],
  },

  // ── SOCIAL SECURITY ───────────────────────────────────────────────────────
  {
    slug: "social-security-benefit-cuts",
    players: [
      {
        name: "Mike Crapo",
        party: "R",
        state: "ID",
        role: "Chair, Senate Finance Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "C000880",
        kalshi_ticker: null,
        contact_url: "https://www.crapo.senate.gov/contact",
        opensecrets_id: "N00006267",
      },
      {
        name: "Ron Wyden",
        party: "D",
        state: "OR",
        role: "Ranking Member, Senate Finance Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "W000779",
        kalshi_ticker: null,
        contact_url: "https://www.wyden.senate.gov/contact",
        opensecrets_id: "N00007724",
      },
      {
        name: "Martin Heinrich",
        party: "D",
        state: "NM",
        role: "Senate Finance Committee Member",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "H001046",
        kalshi_ticker: "NMSEN26",
        contact_url: "https://www.heinrich.senate.gov/contact",
        opensecrets_id: "N00029852",
      },
    ],
  },

  // ── ELECTION INTEGRITY / VOTING RIGHTS ───────────────────────────────────
  {
    slug: "voting-rights-restrictions",
    players: [
      {
        name: "Kari Lake",
        party: "R",
        state: "AZ",
        role: "U.S. Senate Candidate / Trump Ally",
        chamber: "Executive",
        next_election: null,
        bioguide_id: null,
        kalshi_ticker: null,
        contact_url: "https://www.whitehouse.gov/contact/",
        opensecrets_id: null,
      },
      {
        name: "Amy Klobuchar",
        party: "D",
        state: "MN",
        role: "Ranking Member, Senate Rules Committee",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "K000367",
        kalshi_ticker: null,
        contact_url: "https://www.klobuchar.senate.gov/public/index.cfm/contact",
        opensecrets_id: "N00029097",
      },
      {
        name: "Mark Warner",
        party: "D",
        state: "VA",
        role: "Senate Intelligence Committee (election security)",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "W000805",
        kalshi_ticker: "VASEN26",
        contact_url: "https://www.warner.senate.gov/public/index.cfm/contact",
        opensecrets_id: "N00002097",
      },
    ],
  },

  // ── FISA / SURVEILLANCE ───────────────────────────────────────────────────
  {
    slug: "fisa-warrantless-surveillance-expanded",
    players: [
      {
        name: "Tulsi Gabbard",
        party: "R",
        state: "HI",
        role: "Director of National Intelligence",
        chamber: "Executive",
        next_election: null,
        bioguide_id: "G000571",
        kalshi_ticker: null,
        contact_url: "https://www.dni.gov/index.php/contact-the-odni",
        opensecrets_id: "N00027861",
      },
      {
        name: "Ron Wyden",
        party: "D",
        state: "OR",
        role: "Senate Intelligence Committee (privacy advocate)",
        chamber: "Senate",
        next_election: 2028,
        bioguide_id: "W000779",
        kalshi_ticker: null,
        contact_url: "https://www.wyden.senate.gov/contact",
        opensecrets_id: "N00007724",
      },
      {
        name: "Tom Cotton",
        party: "R",
        state: "AR",
        role: "Chair, Senate Intelligence Committee",
        chamber: "Senate",
        next_election: 2026,
        bioguide_id: "C001095",
        kalshi_ticker: "ARSEN26",
        contact_url: "https://www.cotton.senate.gov/contact/",
        opensecrets_id: "N00033363",
      },
    ],
  },
];

async function run() {
  console.log(`Seeding players for ${ISSUE_PLAYERS.length} issues…\n`);

  let updated = 0;
  let notFound = 0;

  for (const { slug, players } of ISSUE_PLAYERS) {
    // Verify the issue exists
    const { data: existing, error: fetchErr } = await supabase
      .from("issues")
      .select("id, title")
      .eq("slug", slug)
      .single();

    if (fetchErr || !existing) {
      console.warn(`  ⚠  NOT FOUND: ${slug}`);
      notFound++;
      continue;
    }

    // Update players column
    const { error: updateErr } = await supabase
      .from("issues")
      .update({ players })
      .eq("slug", slug);

    if (updateErr) {
      console.error(`  ✗  FAILED: ${slug} —`, updateErr.message);
    } else {
      console.log(`  ✓  ${existing.title} (${players.length} players)`);
      updated++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${notFound} not found.`);
}

run().catch(console.error);
