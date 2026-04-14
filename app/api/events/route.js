import { load } from "cheerio"

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
}

// Convert a zip code to city + state using Mapbox geocoding
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
    const city = feature.context?.find(c => c.id.startsWith("place"))?.text
    const state = feature.context?.find(c => c.id.startsWith("region"))?.short_code?.replace("US-", "")
    const [lng, lat] = feature.center
    return { city, state, lat, lng }
  } catch {
    return null
  }
}

// Scrape Idealist for volunteer opportunities
async function scrapeIdealist(city, state) {
  try {
    const query = encodeURIComponent(`${city} ${state}`)
    const url = `https://www.idealist.org/en/volunteer-opportunities?q=${query}&type=VOLUNTEER`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const html = await res.text()
    const $ = load(html)
    const events = []

    // Idealist renders cards with data attributes / JSON in script tags
    // Try to find listing cards
    $("[data-testid='listing-card'], .listing-card, article").each((i, el) => {
      if (i >= 8) return false
      const title = $(el).find("h2, h3, [data-testid='listing-title']").first().text().trim()
      const org   = $(el).find("[data-testid='org-name'], .org-name, .organization").first().text().trim()
      const loc   = $(el).find("[data-testid='location'], .location").first().text().trim()
      const link  = $(el).find("a").first().attr("href")

      if (title) {
        events.push({
          id: `idealist-${i}`,
          title,
          org: org || "Organization",
          type: "Volunteering",
          category: "Community",
          date: "Ongoing",
          time: "Flexible",
          address: loc || `${city}, ${state}`,
          city,
          state,
          lat: null,
          lng: null,
          description: `Volunteer opportunity in ${city}, ${state}.`,
          url: link ? (link.startsWith("http") ? link : `https://www.idealist.org${link}`) : url,
          source: "Idealist",
        })
      }
    })

    // Fallback: try to parse embedded JSON
    if (events.length === 0) {
      const scriptContent = $("script[type='application/json'], script#__NEXT_DATA__").first().html()
      if (scriptContent) {
        try {
          const json = JSON.parse(scriptContent)
          const listings = json?.props?.pageProps?.listings || json?.listings || []
          listings.slice(0, 8).forEach((item, i) => {
            const title = item.name || item.title
            if (title) {
              events.push({
                id: `idealist-${i}`,
                title,
                org: item.organization?.name || item.org || "Organization",
                type: "Volunteering",
                category: item.cause || "Community",
                date: "Ongoing",
                time: "Flexible",
                address: item.location?.city || `${city}, ${state}`,
                city,
                state,
                lat: item.location?.lat || null,
                lng: item.location?.lon || null,
                description: item.description?.slice(0, 120) || `Volunteer opportunity in ${city}.`,
                url: item.url || `https://www.idealist.org/en/volunteer-opportunity/${item.id}`,
                source: "Idealist",
              })
            }
          })
        } catch { /* ignore parse errors */ }
      }
    }

    return events
  } catch {
    return []
  }
}

// Scrape Mobilize for civic/political events
async function scrapeMobilize(zip) {
  try {
    // Mobilize has a public API endpoint (no key required for basic search)
    const url = `https://api.mobilize.us/v1/events?zipcode=${zip}&timeslot_start=gte_now&per_page=10`
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": HEADERS["User-Agent"] }
    })
    if (!res.ok) return []
    const data = await res.json()
    const items = data.data || []

    return items.slice(0, 8).map((item, i) => {
      const timeslot = item.timeslots?.[0]
      const date = timeslot?.start_date
        ? new Date(timeslot.start_date * 1000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        : "Upcoming"
      const time = timeslot?.start_date
        ? new Date(timeslot.start_date * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : ""
      const loc = item.location
      return {
        id: `mobilize-${item.id || i}`,
        title: item.title || "Civic Event",
        org: item.sponsor?.name || "Organization",
        type: "Political",
        category: "Civil Rights",
        date,
        time,
        address: loc?.address_lines?.[0] || loc?.locality || `${loc?.locality || ""}, ${loc?.region || ""}`,
        city: loc?.locality || "",
        state: loc?.region || "",
        lat: loc?.lat || null,
        lng: loc?.lon || null,
        description: item.description?.replace(/<[^>]*>/g, "").slice(0, 120) || "Civic action event.",
        url: item.browser_url || "https://www.mobilize.us",
        source: "Mobilize",
      }
    })
  } catch {
    return []
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")?.trim()

  if (!zip || !/^\d{5}$/.test(zip)) {
    return Response.json({ error: "Valid 5-digit zip required" }, { status: 400 })
  }

  const location = await zipToLocation(zip)
  const city  = location?.city  || "your area"
  const state = location?.state || ""

  // Scrape both sources in parallel
  const [idealist, mobilize] = await Promise.all([
    scrapeIdealist(city, state),
    scrapeMobilize(zip),
  ])

  // Fill in lat/lng from zip location if scraper didn't get coordinates
  const fallbackLat = location?.lat
  const fallbackLng = location?.lng

  const events = [...idealist, ...mobilize].map(e => ({
    ...e,
    lat: e.lat || fallbackLat,
    lng: e.lng || fallbackLng,
  }))

  return Response.json({ events, location, zip }, { next: { revalidate: 3600 } })
}
