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

// ── Mobilize.us (free public API, 25mi radius, multiple pages) ───────────────
async function fetchMobilize(zip) {
  try {
    const base = `https://api.mobilize.us/v1/events?zipcode=${zip}&radius=${RADIUS_MILES}&timeslot_start=gte_now&per_page=50`
    const [res1, res2] = await Promise.all([
      fetch(base + "&page=1", { headers: { "Accept": "application/json", "User-Agent": HEADERS["User-Agent"] } }),
      fetch(base + "&page=2", { headers: { "Accept": "application/json", "User-Agent": HEADERS["User-Agent"] } }),
    ])
    const [d1, d2] = await Promise.all([res1.json().catch(() => ({})), res2.json().catch(() => ({}))])
    const items = [...(d1.data || []), ...(d2.data || [])]
    return items.map((item, i) => {
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

// ── Eventbrite (free API key) ─────────────────────────────────────────────────
async function fetchEventbrite(lat, lng) {
  try {
    const token = process.env.EVENTBRITE_API_KEY
    if (!token) return []
    const url = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${lat}&location.longitude=${lng}&location.within=${RADIUS_MILES}mi&expand=organizer,venue&status=live`
    const res  = await fetch(url, { headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.events || []).map((item, i) => {
      const startDate = item.start?.local ? new Date(item.start.local) : null
      const venue     = item.venue
      const desc      = (item.description?.text || item.summary || "").slice(0, 140)
      return {
        id:          `eb-${item.id || i}`,
        title:       item.name?.text || "Community Event",
        org:         item.organizer?.name || "Organizer",
        type:        detectType(item.name?.text || "", desc, "Volunteering"),
        category:    detectCategory(item.name?.text || "", desc),
        date:        startDate ? startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Upcoming",
        time:        startDate ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
        address:     venue?.address?.address_1 || venue?.address?.localized_address_display || "",
        city:        venue?.address?.city || "",
        state:       venue?.address?.region || "",
        lat:         venue?.latitude  ? parseFloat(venue.latitude)  : null,
        lng:         venue?.longitude ? parseFloat(venue.longitude) : null,
        description: desc,
        url:         item.url || "https://www.eventbrite.com",
        source:      "Eventbrite",
      }
    })
  } catch { return [] }
}

// ── Action Network (free public API, no key needed for public events) ─────────
async function fetchActionNetwork(city, state) {
  try {
    // Action Network hosts events from thousands of progressive orgs — public read
    const query = encodeURIComponent(`${city} ${state}`)
    const url   = `https://actionnetwork.org/api/v2/events?filter[location]=${query}&filter[status]=confirmed&per_page=25`
    const res   = await fetch(url, {
      headers: { "Content-Type": "application/json", "User-Agent": HEADERS["User-Agent"] }
    })
    if (!res.ok) return []
    const data   = await res.json()
    const items  = data._embedded?.["osdi:events"] || []
    return items.map((item, i) => {
      const startDate = item.start_date ? new Date(item.start_date) : null
      const loc = item.location
      return {
        id:          `an-${item.identifiers?.[0] || i}`,
        title:       item.name || "Community Event",
        org:         item.sponsor?.name || "Action Network",
        type:        detectType(item.name, item.description || "", "Political"),
        category:    detectCategory(item.name, item.description || ""),
        date:        startDate ? startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Upcoming",
        time:        startDate ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
        address:     loc?.address_lines?.[0] || loc?.locality || "",
        city:        loc?.locality || city,
        state:       loc?.region  || state,
        lat:         loc?.latitude  ? parseFloat(loc.latitude)  : null,
        lng:         loc?.longitude ? parseFloat(loc.longitude) : null,
        description: (item.description || "").replace(/<[^>]*>/g, "").slice(0, 140),
        url:         item.browser_url || item._links?.self?.href || "https://actionnetwork.org",
        source:      "Action Network",
      }
    })
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

// ── VolunteerMatch (scrape public search) ─────────────────────────────────────
async function scrapeVolunteerMatch(zip) {
  try {
    const url = `https://www.volunteermatch.org/search/opps.jsp?l=${zip}&v=true&categories=&s=1&o=20&sort=distance`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const html = await res.text()
    const $    = load(html)
    const events = []

    $(".oppcard, .result-item, [class*='opp-card'], [class*='opportunity']").each((i, el) => {
      if (i >= 15) return false
      const title = $(el).find("h3, h2, .title, [class*='title']").first().text().trim()
      const org   = $(el).find(".org, [class*='org'], .organization").first().text().trim()
      const loc   = $(el).find(".loc, .location, [class*='location']").first().text().trim()
      const link  = $(el).find("a").first().attr("href")
      if (!title) return
      events.push({
        id:          `vm-${i}`,
        title,
        org:         org || "Organization",
        type:        "Volunteering",
        category:    detectCategory(title),
        date:        "Flexible",
        time:        "",
        address:     loc || "",
        city:        "",
        state:       "",
        lat:         null,
        lng:         null,
        description: `Volunteer opportunity near ${zip}.`,
        url:         link ? (link.startsWith("http") ? link : `https://www.volunteermatch.org${link}`) : `https://www.volunteermatch.org/search/opps.jsp?l=${zip}`,
        source:      "VolunteerMatch",
      })
    })

    // Try JSON-LD fallback
    if (events.length === 0) {
      $("script[type='application/ld+json']").each((_, el) => {
        try {
          const json  = JSON.parse($(el).html() || "")
          const items = Array.isArray(json) ? json : [json]
          items.forEach((item, i) => {
            if (item["@type"] !== "VolunteerAction" && item["@type"] !== "Event") return
            if (events.length >= 15) return
            const title = item.name
            if (!title) return
            events.push({
              id:          `vm-ld-${i}`,
              title,
              org:         item.organizer?.name || "Organization",
              type:        "Volunteering",
              category:    detectCategory(title, item.description || ""),
              date:        "Flexible",
              time:        "",
              address:     item.location?.address?.streetAddress || "",
              city:        item.location?.address?.addressLocality || "",
              state:       item.location?.address?.addressRegion || "",
              lat:         null,
              lng:         null,
              description: (item.description || "").replace(/<[^>]*>/g, "").slice(0, 140),
              url:         item.url || `https://www.volunteermatch.org`,
              source:      "VolunteerMatch",
            })
          })
        } catch { /* ignore */ }
      })
    }

    return events
  } catch { return [] }
}

// ── Meetup (scrape public search) ─────────────────────────────────────────────
async function scrapeMeetup(city, state) {
  try {
    const query = encodeURIComponent(`${city} ${state} volunteer community activism`)
    const url   = `https://www.meetup.com/find/?keywords=${query}&source=EVENTS&distance=twentyFiveMiles`
    const res   = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const html  = await res.text()
    const $     = load(html)
    const events = []

    // Try __NEXT_DATA__ JSON
    const scriptContent = $("#__NEXT_DATA__").first().html()
    if (scriptContent) {
      try {
        const json = JSON.parse(scriptContent)
        const results = json?.props?.pageProps?.searchResults?.edges
          || json?.props?.pageProps?.results
          || []
        results.slice(0, 12).forEach((edge, i) => {
          const item  = edge?.node || edge
          const title = item?.name || item?.title || item?.event?.name
          if (!title) return
          const startTime = item?.dateTime || item?.event?.dateTime
          const startDate = startTime ? new Date(startTime) : null
          const venue = item?.venue || item?.event?.venue
          events.push({
            id:          `meetup-${i}`,
            title,
            org:         item?.group?.name || item?.event?.group?.name || "Meetup Group",
            type:        detectType(title, item?.description || "", "Volunteering"),
            category:    detectCategory(title, item?.description || ""),
            date:        startDate ? startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Upcoming",
            time:        startDate ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
            address:     venue?.address || `${city}, ${state}`,
            city:        venue?.city || city,
            state:       venue?.state || state,
            lat:         venue?.lat || null,
            lng:         venue?.lng || null,
            description: (item?.description || "").replace(/<[^>]*>/g, "").slice(0, 140),
            url:         item?.eventUrl || item?.event?.eventUrl || "https://www.meetup.com",
            source:      "Meetup",
          })
        })
      } catch { /* ignore */ }
    }

    // DOM fallback
    if (events.length === 0) {
      $("[data-testid='event-card'], .event-listing, [class*='eventCard']").each((i, el) => {
        if (i >= 10) return false
        const title = $(el).find("h3, h2, [class*='title']").first().text().trim()
        const date  = $(el).find("time, [class*='date']").first().text().trim()
        const link  = $(el).find("a").first().attr("href")
        if (!title) return
        events.push({
          id:          `meetup-dom-${i}`,
          title,
          org:         "Meetup Group",
          type:        detectType(title, "", "Volunteering"),
          category:    detectCategory(title),
          date:        date || "Upcoming",
          time:        "",
          address:     `${city}, ${state}`,
          city,
          state,
          lat:         null,
          lng:         null,
          description: `Community event in ${city}, ${state}.`,
          url:         link ? (link.startsWith("http") ? link : `https://www.meetup.com${link}`) : "https://www.meetup.com",
          source:      "Meetup",
        })
      })
    }

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

  const [mobilize, eventbrite] = await Promise.all([
    fetchMobilize(zip),
    fetchEventbrite(location?.lat, location?.lng),
  ])

  const fallbackLat = location?.lat
  const fallbackLng = location?.lng

  // Merge all sources, fill missing coords, deduplicate by title
  const seen = new Set()
  const events = [...mobilize, ...eventbrite]
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
