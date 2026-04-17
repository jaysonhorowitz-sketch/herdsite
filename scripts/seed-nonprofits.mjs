/**
 * seed-nonprofits.mjs
 *
 * FIRST: run this SQL in the Supabase dashboard SQL editor:
 * ─────────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS nonprofits (
 *   id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name           text NOT NULL,
 *   ein            text,
 *   category       text NOT NULL,
 *   description    text,
 *   logo_url       text,
 *   every_org_slug text,
 *   website        text,
 *   verified       boolean DEFAULT true
 * );
 * ALTER TABLE nonprofits ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "public_read"   ON nonprofits FOR SELECT USING (true);
 * CREATE POLICY "service_write" ON nonprofits FOR ALL   USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────────
 *
 * Usage: node scripts/seed-nonprofits.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env.local") })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// logo_url uses Clearbit Logo API (free, no key) — falls back gracefully if missing
function logo(domain) {
  return `https://logo.clearbit.com/${domain}`
}

const NONPROFITS = [
  // ── Civil Rights ────────────────────────────────────────────────────────────
  {
    name: "ACLU",
    ein: "13-3871360",
    category: "Civil Rights",
    description: "Defends the individual rights and liberties guaranteed to every person by the Constitution and laws of the United States, in courts, legislatures, and communities.",
    logo_url: logo("aclu.org"),
    every_org_slug: "aclu",
    website: "https://www.aclu.org",
    verified: true,
  },
  {
    name: "NAACP",
    ein: "13-1084580",
    category: "Civil Rights",
    description: "Secures the political, educational, social, and economic equality of rights to eliminate race-based discrimination and ensure the well-being of all persons.",
    logo_url: logo("naacp.org"),
    every_org_slug: "naacp",
    website: "https://naacp.org",
    verified: true,
  },
  {
    name: "Southern Poverty Law Center",
    ein: "63-0598743",
    category: "Civil Rights",
    description: "Fights hate and bigotry and seeks justice for the most vulnerable members of society through litigation, education, and other forms of advocacy.",
    logo_url: logo("splcenter.org"),
    every_org_slug: "splcenter",
    website: "https://www.splcenter.org",
    verified: true,
  },

  // ── Healthcare ───────────────────────────────────────────────────────────────
  {
    name: "Doctors Without Borders USA",
    ein: "13-3433452",
    category: "Healthcare",
    description: "Delivers emergency medical care to people affected by conflict, epidemics, disasters, or exclusion from health care, regardless of nationality, religion, or political affiliation.",
    logo_url: logo("doctorswithoutborders.org"),
    every_org_slug: "doctors-without-borders-usa",
    website: "https://www.doctorswithoutborders.org",
    verified: true,
  },
  {
    name: "Planned Parenthood Federation of America",
    ein: "13-1644147",
    category: "Healthcare",
    description: "Delivers vital reproductive health care, sex education, and information to millions of people worldwide, believing in everyone's right to safe and affordable health care.",
    logo_url: logo("plannedparenthood.org"),
    every_org_slug: "planned-parenthood-federation-of-america",
    website: "https://www.plannedparenthood.org",
    verified: true,
  },
  {
    name: "Partners in Health",
    ein: "04-3567502",
    category: "Healthcare",
    description: "Provides a preferential option for the poor in health care, bringing the benefits of modern medical science to those most in need while serving as an antidote to despair.",
    logo_url: logo("pih.org"),
    every_org_slug: "partners-in-health",
    website: "https://www.pih.org",
    verified: true,
  },

  // ── Environment ──────────────────────────────────────────────────────────────
  {
    name: "Sierra Club Foundation",
    ein: "94-6069890",
    category: "Environment",
    description: "Channels the power of nature to protect communities and the planet by funding effective environmental advocates and the movement that sustains them.",
    logo_url: logo("sierraclub.org"),
    every_org_slug: "sierra-club-foundation",
    website: "https://www.sierraclub.org",
    verified: true,
  },
  {
    name: "Natural Resources Defense Council",
    ein: "13-2654926",
    category: "Environment",
    description: "Works to safeguard the earth—its people, its plants and animals, and the natural systems on which all life depends—through law, science, and the support of 3.2 million members.",
    logo_url: logo("nrdc.org"),
    every_org_slug: "nrdc",
    website: "https://www.nrdc.org",
    verified: true,
  },
  {
    name: "Environmental Defense Fund",
    ein: "11-6107128",
    category: "Environment",
    description: "Finds practical solutions to the most serious environmental problems. Guided by science and economics, EDF creates lasting solutions that protect the earth.",
    logo_url: logo("edf.org"),
    every_org_slug: "environmental-defense-fund",
    website: "https://www.edf.org",
    verified: true,
  },

  // ── Education ─────────────────────────────────────────────────────────────────
  {
    name: "DonorsChoose",
    ein: "13-4129457",
    category: "Education",
    description: "Connects donors directly with public school classroom projects in need. Teachers post what they need; donors give to the projects that inspire them most.",
    logo_url: logo("donorschoose.org"),
    every_org_slug: "donorschoose",
    website: "https://www.donorschoose.org",
    verified: true,
  },
  {
    name: "Khan Academy",
    ein: "26-1544963",
    category: "Education",
    description: "Provides a free, world-class education to anyone, anywhere. Offers practice exercises, instructional videos, and a personalized learning dashboard.",
    logo_url: logo("khanacademy.org"),
    every_org_slug: "khan-academy",
    website: "https://www.khanacademy.org",
    verified: true,
  },
  {
    name: "Union of Concerned Scientists",
    ein: "04-2535767",
    category: "Science",
    description: "Puts rigorous, independent science to work to solve our planet's most pressing problems by combining technical analysis with effective advocacy.",
    logo_url: logo("ucsusa.org"),
    every_org_slug: "union-of-concerned-scientists",
    website: "https://www.ucsusa.org",
    verified: true,
  },

  // ── Rule of Law ───────────────────────────────────────────────────────────────
  {
    name: "Brennan Center for Justice",
    ein: "31-1564365",
    category: "Rule of Law",
    description: "Works to reform, revitalize, and when necessary defend our country's systems of democracy and justice through research, litigation, and advocacy.",
    logo_url: logo("brennancenter.org"),
    every_org_slug: "brennan-center-for-justice",
    website: "https://www.brennancenter.org",
    verified: true,
  },
  {
    name: "Common Cause",
    ein: "23-7000150",
    category: "Rule of Law",
    description: "A nonpartisan, grassroots organization dedicated to upholding the core values of American democracy and creating open, honest, and accountable government.",
    logo_url: logo("commoncause.org"),
    every_org_slug: "common-cause",
    website: "https://www.commoncause.org",
    verified: true,
  },
  {
    name: "Protect Democracy",
    ein: "81-2857927",
    category: "Rule of Law",
    description: "A nonpartisan nonprofit working to prevent American democracy from declining into authoritarianism through litigation, research, and policy work.",
    logo_url: logo("protectdemocracy.org"),
    every_org_slug: "protect-democracy",
    website: "https://protectdemocracy.org",
    verified: true,
  },

  // ── Executive Power ───────────────────────────────────────────────────────────
  {
    name: "Issue One",
    ein: "46-3891519",
    category: "Executive Power",
    description: "A leading crosspartisan political reform group uniting Republicans, Democrats, and independents to fix our broken political system and reduce the influence of money in politics.",
    logo_url: logo("issueone.org"),
    every_org_slug: "issue-one",
    website: "https://issueone.org",
    verified: true,
  },
  {
    name: "OpenSecrets",
    ein: "52-1655893",
    category: "Executive Power",
    description: "The nation's premier research group tracking money in U.S. politics and its effect on elections and public policy. Nonpartisan, independent, and nonprofit.",
    logo_url: logo("opensecrets.org"),
    every_org_slug: "opensecrets",
    website: "https://www.opensecrets.org",
    verified: true,
  },

  // ── Economy ───────────────────────────────────────────────────────────────────
  {
    name: "Economic Policy Institute",
    ein: "52-1368786",
    category: "Economy",
    description: "Ensures that policymakers and the public have access to high-quality research on economic issues, focusing on the needs of low- and middle-income workers.",
    logo_url: logo("epi.org"),
    every_org_slug: "economic-policy-institute",
    website: "https://www.epi.org",
    verified: true,
  },
  {
    name: "Center on Budget and Policy Priorities",
    ein: "52-1218810",
    category: "Economy",
    description: "Pursues federal and state policies designed to reduce poverty and inequality and restore fiscal responsibility through rigorous, nonpartisan research.",
    logo_url: logo("cbpp.org"),
    every_org_slug: "center-on-budget-and-policy-priorities",
    website: "https://www.cbpp.org",
    verified: true,
  },

  // ── National Security ─────────────────────────────────────────────────────────
  {
    name: "Friends Committee on National Legislation",
    ein: "53-0217054",
    category: "National Security",
    description: "A Quaker lobby in the public interest, working with a nationwide network of people to advocate for peace, justice, opportunity, and environmental stewardship.",
    logo_url: logo("fcnl.org"),
    every_org_slug: "fcnl",
    website: "https://www.fcnl.org",
    verified: true,
  },
  {
    name: "Win Without War",
    ein: "20-3637273",
    category: "National Security",
    description: "A coalition of national organizations working for a more peaceful, progressive U.S. foreign policy that prioritizes diplomacy over military force.",
    logo_url: logo("winwithoutwar.org"),
    every_org_slug: "win-without-war",
    website: "https://winwithoutwar.org",
    verified: true,
  },

  // ── Immigration ───────────────────────────────────────────────────────────────
  {
    name: "RAICES",
    ein: "74-2436920",
    category: "Immigration",
    description: "Promotes justice by providing free and low-cost legal services, advocating for policy changes, and building power in immigrant communities across the country.",
    logo_url: logo("raicestexas.org"),
    every_org_slug: "raices",
    website: "https://www.raicestexas.org",
    verified: true,
  },
  {
    name: "National Immigration Law Center",
    ein: "95-3706200",
    category: "Immigration",
    description: "Defends and advances the rights and opportunities of low-income immigrants and their families through litigation, policy advocacy, and coalition-building.",
    logo_url: logo("nilc.org"),
    every_org_slug: "national-immigration-law-center",
    website: "https://www.nilc.org",
    verified: true,
  },
  {
    name: "United We Dream",
    ein: "27-2391808",
    category: "Immigration",
    description: "The nation's largest immigrant youth-led organization, building power to act on issues that impact immigrants and communities of color regardless of immigration status.",
    logo_url: logo("unitedwedream.org"),
    every_org_slug: "united-we-dream",
    website: "https://unitedwedream.org",
    verified: true,
  },

  // ── Democracy & Media ─────────────────────────────────────────────────────────
  {
    name: "Free Press",
    ein: "04-3609761",
    category: "Democracy & Media",
    description: "Fights to ensure everyone can connect and communicate freely by promoting universal access to the internet, independent media, and diverse voices in our media landscape.",
    logo_url: logo("freepress.net"),
    every_org_slug: "free-press",
    website: "https://www.freepress.net",
    verified: true,
  },
  {
    name: "Reporters Committee for Freedom of the Press",
    ein: "52-1337840",
    category: "Democracy & Media",
    description: "Provides pro bono legal representation and other resources to protect First Amendment freedoms and the newsgathering rights of journalists.",
    logo_url: logo("rcfp.org"),
    every_org_slug: "rcfp",
    website: "https://www.rcfp.org",
    verified: true,
  },
]

console.log(`Upserting ${NONPROFITS.length} nonprofits…`)

// Upsert all at once (small dataset)
const { error } = await supabase
  .from("nonprofits")
  .insert(NONPROFITS)

if (error) {
  console.error("Error:", error.message)
  console.log("\nMake sure you've run the CREATE TABLE SQL in the Supabase dashboard first.")
} else {
  console.log(`✓ ${NONPROFITS.length} nonprofits seeded successfully.`)
}
