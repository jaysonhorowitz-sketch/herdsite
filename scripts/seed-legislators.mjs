/**
 * seed-legislators.mjs
 * Seeds the `legislators` table from congress-legislators public data.
 *
 * FIRST: run this SQL in the Supabase dashboard SQL editor:
 * ─────────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS legislators (
 *   bioguide_id text PRIMARY KEY,
 *   name        text NOT NULL,
 *   party       text,
 *   state       text,
 *   chamber     text,
 *   district    integer,
 *   phone       text,
 *   photo_url   text,
 *   committees  jsonb DEFAULT '[]'::jsonb,
 *   website     text
 * );
 * ALTER TABLE legislators ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "public_read"   ON legislators FOR SELECT USING (true);
 * CREATE POLICY "service_write" ON legislators FOR ALL   USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────────
 *
 * Usage: node scripts/seed-legislators.mjs
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

console.log("Fetching congress-legislators data…")

const [legislators, committees, memberships] = await Promise.all([
  fetch("https://unitedstates.github.io/congress-legislators/legislators-current.json").then(r => r.json()),
  fetch("https://unitedstates.github.io/congress-legislators/committees-current.json").then(r => r.json()),
  fetch("https://unitedstates.github.io/congress-legislators/committee-membership-current.json").then(r => r.json()),
])

console.log(`Fetched ${legislators.length} legislators, ${committees.length} committees`)

// Build thomas_id → committee name lookup (including subcommittees)
const committeeNames = {}
for (const c of committees) {
  if (c.thomas_id) committeeNames[c.thomas_id] = c.name
  for (const sub of (c.subcommittees || [])) {
    if (sub.thomas_id) committeeNames[sub.thomas_id] = `${c.name} – ${sub.name}`
  }
}

// Build bioguide_id → [committee name, …]
const bioguideCommittees = {}
for (const [thomasId, members] of Object.entries(memberships)) {
  const name = committeeNames[thomasId]
  if (!name) continue
  for (const m of members) {
    if (!m.bioguide) continue
    ;(bioguideCommittees[m.bioguide] ??= []).push(name)
  }
}

function mapParty(p = "") {
  if (p.startsWith("R")) return "R"
  if (p.startsWith("D")) return "D"
  return "I"
}

const records = []
for (const leg of legislators) {
  const bioguide = leg.id?.bioguide
  if (!bioguide) continue

  const terms = leg.terms || []
  if (!terms.length) continue
  const t = terms[terms.length - 1]   // most recent term

  const chamber  = t.type === "sen" ? "senate" : "house"
  const district = chamber === "house" ? (typeof t.district === "number" ? t.district : null) : null

  records.push({
    bioguide_id: bioguide,
    name:        leg.name?.official_full || `${leg.name?.first} ${leg.name?.last}`,
    party:       mapParty(t.party),
    state:       t.state,
    chamber,
    district,
    phone:       t.phone    || null,
    photo_url:   `https://unitedstates.github.io/images/congress/225x275/${bioguide}.jpg`,
    committees:  bioguideCommittees[bioguide] || [],
    website:     t.url      || null,
  })
}

console.log(`Upserting ${records.length} records in batches…`)

const BATCH = 50
let errors = 0
for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH)
  const { error } = await supabase
    .from("legislators")
    .upsert(batch, { onConflict: "bioguide_id" })
  if (error) {
    console.error(`  Batch ${Math.floor(i / BATCH) + 1} error:`, error.message)
    errors++
  } else {
    process.stdout.write(".")
  }
}

console.log(`\nDone. ${records.length} legislators seeded. ${errors} batch errors.`)
