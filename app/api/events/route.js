import { load } from "cheerio"

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
}

const RADIUS_MILES = 25

// ── Category detection from title + description ────────────────────────────────
const CATEGORY_RULES = [
  { category: "Environment",         keywords: ["environment","climate","clean","green","earth","wildlife","nature","conservation","energy","recycle","park","tree"] },
  { category: "Healthcare",          keywords: ["health","medical","mental","food bank","hunger","nutrition","hospital","clinic","wellbeing","wellness"] },
  { category: "Civil Rights",        keywords: ["civil rights","voting","equity","justice","discrimination","lgbtq","racial","protest","march","rally","rights","inclusion"] },
  { category: "Immigration",         keywords: ["immigra","asylum","refugee","border","citizenship","undocumented","daca","legal aid","deport"] },
  { category: "Economy",             keywords: ["economy","job","housing","afford","wage","worker","labor","poverty","finance","budget","tariff","trade"] },
  { category: "Education & Science", keywords: ["education","school","tutor","literacy","stem","science","research","university","college","youth","student","learn","teach"] },
  { category: "Media & Democracy",   keywords: ["democracy","media","press","election","vote","ballot","campaign","canvass","phone bank","transparency"] },
  { category: "National Security",   keywords: ["veteran","military","security","defense","army","navy","service member"] },
  { category: "Rule of Law",         keywords: ["legal","law","court","attorney","justice","policy","legislation","advocacy","bill","congress"] },
  { category: "Executive Power",     keywords: ["executive","president","administration","federal","government","white house","cabinet"] },
]

function detectCategory(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) return rule.category
  }
  return "Community"
}

function detectType(title = "", description = "", defaultType = "Volunteering") {
  const text = `${title} ${description}`.toLowerCase()
  const politicalWords = ["rally","march","protest","canvass","phone bank","vote","ballot","campaign","town hall","advocacy","congress","senate","petition"]
  if (politicalWords.some(w => text.includes(w))) return "Political"
  return defaultType
}

// ── Geocode zip → city, state, lat, lng ───────────────────────────────────────
async function zipToLocation(zip) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?country=us&types=postcode&access_token=${token}`
    )
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null
    const city  = feature.context?.find(c => c.id.startsWith("place"))?.text || ""
    const state = feature.context?.find(c => c.id.startsWith("region"))?.short_code?.replace("US-", "") || ""
    const [lng, lat] = feature.center
    return { city, state, lat, lng }
  } catch { return null }
}

// ── Mobilize.us (free public API, 25mi radius) ────────────────────────────────
async function fetchMobilize(zip) {
  try {
    const url = `https://api.mobilize.us/v1/events?zipcode=${zip}&radius=${RADIUS_MILES}&timeslot_start=gte_now&per_page=20`
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": HEADERS["User-Agent"] }
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map((item, i) => {
      const timeslot = item.timeslots?.[0]
      const date = timeslot?.start_date
        ? new Date(timeslot.start_date * 1000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        : "Upcoming"
      const time = timeslot?.start_date
        ? new Date(timeslot.start_date * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : ""
      const loc  = item.location
      const desc = item.description?.replace(/<[^>]*>/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim().slice(0, 140) || ""
      return {
        id:          `mobilize-${item.id || i}`,
        title:       item.title || "Civic Event",
        org:         item.sponsor?.name || "Organization",
        type:        detectType(item.title, desc, "Political"),
        category:    detectCategory(item.title, desc),
        date,
        time,
        address:     loc?.address_lines?.[0] || loc?.locality || "",
        city:        loc?.locality || "",
        state:       loc?.region  || "",
        lat:         loc?.lat  || null,
        lng:         loc?.lon  || null,
        description: desc,
        url:         item.browser_url || "https://www.mobilize.us",
        source:      "Mobilize",
      }
    })
  } catch { return [] }
}

// ── Idealist (scrape, 25mi radius via city/state) ─────────────────────────────
async function scrapeIdealist(city, state) {
  try {
    const query = encodeURIComponent(`${city} ${state}`)
    const url   = `https://www.idealist.org/en/volunteer-opportunities?q=${query}&type=VOLUNTEER`
    const res   = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const html  = await res.text()
    const $     = load(html)
    const events = []

    // Try __NEXT_DATA__ JSON first
    const scriptContent = $("#__NEXT_DATA__").first().html()
    if (scriptContent) {
      try {
        const json     = JSON.parse(scriptContent)
        const listings = json?.props?.pageProps?.results?.listings
          || json?.props?.pageProps?.listings
          || []
        listings.slice(0, 10).forEach((item, i) => {
          const title = item.name || item.title
          if (!title) return
          const desc = item.description?.replace(/<[^>]*>/g, "").slice(0, 140) || ""
          events.push({
            id:          `idealist-${i}`,
            title,
            org:         item.organization?.name || "Organization",
            type:        "Volunteering",
            category:    detectCategory(title, desc),
            date:        "Flexible",
            time:        "",
            address:     item.location?.city || `${city}, ${state}`,
            city:        item.location?.city  || city,
            state:       item.location?.state || state,
            lat:         item.location?.lat   || null,
            lng:         item.location?.lon   || null,
            description: desc,
            url:         item.url || `https://www.idealist.org/en/volunteer-opportunity/${item.id}`,
            source:      "Idealist",
          })
        })
      } catch { /* ignore */ }
    }

    // DOM fallback
    if (events.length === 0) {
      $("[data-testid='listing-card'], .listing-card, article").each((i, el) => {
        if (i >= 8) return false
        const title = $(el).find("h2, h3, [data-testid='listing-title']").first().text().trim()
        const org   = $(el).find("[data-testid='org-name'], .org-name").first().text().trim()
        const loc   = $(el).find("[data-testid='location'], .location").first().text().trim()
        const link  = $(el).find("a").first().attr("href")
        if (!title) return
        events.push({
          id:          `idealist-dom-${i}`,
          title,
          org:         org || "Organization",
          type:        "Volunteering",
          category:    detectCategory(title),
          date:        "Flexible",
          time:        "",
          address:     loc || `${city}, ${state}`,
          city,
          state,
          lat:         null,
          lng:         null,
          description: `Volunteer opportunity in ${city}, ${state}.`,
          url:         link ? (link.startsWith("http") ? link : `https://www.idealist.org${link}`) : url,
          source:      "Idealist",
        })
      })
    }

    return events
  } catch { return [] }
}

// ── Eventbrite (scrape public charity/community search) ───────────────────────
async function scrapeEventbrite(city, state) {
  try {
    const citySlug  = city.toLowerCase().replace(/\s+/g, "-")
    const stateSlug = state.toLowerCase()
    const url       = `https://www.eventbrite.com/d/${stateSlug}--${citySlug}/community--charity--causes/`
    const res       = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const html = await res.text()
    const $    = load(html)
    const events = []

    // Try JSON-LD (most reliable on Eventbrite)
    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "")
        const items = Array.isArray(json) ? json : [json]
        items.forEach((item, i) => {
          if (item["@type"] !== "Event") return
          if (events.length >= 10) return
          const startDate = item.startDate ? new Date(item.startDate) : null
          const desc = (item.description || "").replace(/<[^>]*>/g, "").slice(0, 140)
          events.push({
            id:          `eventbrite-${i}`,
            title:       item.name || "Community Event",
            org:         item.organizer?.name || "Organizer",
            type:        detectType(item.name, desc, "Volunteering"),
            category:    detectCategory(item.name, desc),
            date:        startDate ? startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Upcoming",
            time:        startDate ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
            address:     item.location?.address?.streetAddress || `${city}, ${state}`,
            city:        item.location?.address?.addressLocality || city,
            state:       item.location?.address?.addressRegion   || state,
            lat:         null,
            lng:         null,
            description: desc,
            url:         item.url || "https://www.eventbrite.com",
            source:      "Eventbrite",
          })
        })
      } catch { /* ignore */ }
    })

    // DOM fallback
    if (events.length === 0) {
      $(".eds-event-card, [data-testid='event-card'], .search-event-card-wrapper").each((i, el) => {
        if (i >= 8) return false
        const title = $(el).find("h2, h3, .eds-event-card__formatted-name").first().text().trim()
        const date  = $(el).find(".eds-event-card__formatted-date, time").first().text().trim()
        const loc   = $(el).find(".card-text--truncated__one, .eds-event-card__sub-title").first().text().trim()
        const link  = $(el).find("a").first().attr("href")
        if (!title) return
        events.push({
          id:          `eventbrite-dom-${i}`,
          title,
          org:         "Organizer",
          type:        detectType(title, "", "Volunteering"),
          category:    detectCategory(title),
          date:        date || "Upcoming",
          time:        "",
          address:     loc || `${city}, ${state}`,
          city,
          state,
          lat:         null,
          lng:         null,
          description: `Community event in ${city}, ${state}.`,
          url:         link ? (link.startsWith("http") ? link : `https://www.eventbrite.com${link}`) : "https://www.eventbrite.com",
          source:      "Eventbrite",
        })
      })
    }

    return events
  } catch { return [] }
}

// ── All for Good (scrape volunteering aggregator) ─────────────────────────────
async function scrapeAllForGood(city, state) {
  try {
    const loc = encodeURIComponent(`${city}, ${state}`)
    const url = `https://www.allforgood.org/search?q=&vol_loc=${loc}&vol_dist=${RADIUS_MILES}`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const html = await res.text()
    const $    = load(html)
    const events = []

    $(".opp-listing, .opportunity-card, [class*='opportunity']").each((i, el) => {
      if (i >= 8) return false
      const title = $(el).find("h2, h3, .opp-title, [class*='title']").first().text().trim()
      const org   = $(el).find(".org-name, [class*='org']").first().text().trim()
      const loc   = $(el).find(".location, [class*='location']").first().text().trim()
      const link  = $(el).find("a").first().attr("href")
      if (!title) return
      events.push({
        id:          `allforgood-${i}`,
        title,
        org:         org || "Organization",
        type:        "Volunteering",
        category:    detectCategory(title),
        date:        "Flexible",
        time:        "",
        address:     loc || `${city}, ${state}`,
        city,
        state,
        lat:         null,
        lng:         null,
        description: `Volunteer opportunity in ${city}, ${state}.`,
        url:         link ? (link.startsWith("http") ? link : `https://www.allforgood.org${link}`) : url,
        source:      "All for Good",
      })
    })

    return events
  } catch { return [] }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")?.trim()

  if (!zip || !/^\d{5}$/.test(zip)) {
    return Response.json({ error: "Valid 5-digit zip required" }, { status: 400 })
  }

  const location = await zipToLocation(zip)
  const city     = location?.city  || ""
  const state    = location?.state || ""

  const [mobilize, idealist, eventbrite, allForGood] = await Promise.all([
    fetchMobilize(zip),
    scrapeIdealist(city, state),
    scrapeEventbrite(city, state),
    scrapeAllForGood(city, state),
  ])

  const fallbackLat = location?.lat
  const fallbackLng = location?.lng

  // Merge all sources, fill missing coords, deduplicate by title
  const seen = new Set()
  const events = [...mobilize, ...idealist, ...eventbrite, ...allForGood]
    .map(e => ({ ...e, lat: e.lat || fallbackLat, lng: e.lng || fallbackLng }))
    .filter(e => {
      const key = e.title.toLowerCase().slice(0, 40)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  return Response.json(
    { events, location, zip },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" } }
  )
}
