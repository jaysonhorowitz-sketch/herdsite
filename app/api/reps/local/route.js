import { NextResponse } from "next/server"

const LOCAL_TYPES = new Set(["LOCAL", "LOCAL_EXEC", "LOCAL_UPPER", "LOCAL_LOWER", "COUNTY", "COUNTY_EXEC", "COUNTY_UPPER", "COUNTY_LOWER", "SCHOOL"])

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")
  if (!zip) return NextResponse.json({ error: "zip required" }, { status: 400 })

  // Geocode zip → lat/lng
  let lat, lng
  try {
    const geoCtl = new AbortController()
    const geoTimer = setTimeout(() => geoCtl.abort(), 8000)
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: geoCtl.signal })
    clearTimeout(geoTimer)
    if (!geoRes.ok) return NextResponse.json({ error: "Zip code not found" }, { status: 404 })
    const geoData = await geoRes.json()
    lat = geoData.places[0].latitude
    lng = geoData.places[0].longitude
  } catch (e) {
    if (e.name === "AbortError") return NextResponse.json({ error: "Geocoding timed out" }, { status: 504 })
    return NextResponse.json({ error: "Failed to geocode zip" }, { status: 500 })
  }

  // Fetch all officials from Cicero, then filter to local/county
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 12000)
  try {
    const url = `https://cicero.azavea.com/v3.1/official?lat=${lat}&lon=${lng}&format=json&key=${process.env.CICERO_API_KEY}`
    const res = await fetch(url, { signal: ctl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`Cicero returned ${res.status}`)

    const data = await res.json()
    const all = data.response?.results?.officials || []

    // Keep only local/county officials
    const local = all.filter(o => {
      const dt = o.office?.district?.district_type || ""
      return LOCAL_TYPES.has(dt)
    })

    const normalize = o => {
      const addr    = o.addresses?.[0] || {}
      const dt      = o.office?.district?.district_type || ""
      const twitter = o.identifiers?.find(i => i.identifier_type === "TWITTER")?.identifier_value || null
      const instagram = o.identifiers?.find(i => i.identifier_type === "INSTAGRAM")?.identifier_value || null

      let role = "local"
      if (dt.includes("COUNTY_EXEC"))    role = "county_exec"
      else if (dt.includes("COUNTY"))    role = "county"
      else if (dt.includes("LOCAL_EXEC")) role = "local_exec"
      else if (dt.includes("SCHOOL"))    role = "school"

      return {
        name:      [o.first_name, o.last_name].filter(Boolean).join(" "),
        party:     o.party || null,
        title:     o.office?.title || "Local Official",
        role,
        phone:     addr.phone_1 || null,
        link:      o.urls?.[0] || null,
        email:     o.email_addresses?.[0] || null,
        photoURL:  o.photo_origin_url || null,
        twitter,
        instagram,
        office:    [addr.address_1, addr.city, addr.state].filter(Boolean).join(", ") || null,
      }
    }

    const reps = local.map(normalize)

    return NextResponse.json({
      county_exec: reps.filter(r => r.role === "county_exec"),
      county:      reps.filter(r => r.role === "county"),
      local_exec:  reps.filter(r => r.role === "local_exec"),
      local:       reps.filter(r => r.role === "local"),
      school:      reps.filter(r => r.role === "school"),
    })
  } catch (e) {
    clearTimeout(timer)
    if (e.name === "AbortError") return NextResponse.json({ error: "Request timed out" }, { status: 504 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
