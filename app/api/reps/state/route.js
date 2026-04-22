import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")
  if (!zip) return NextResponse.json({ error: "zip required" }, { status: 400 })

  // Geocode zip → lat/lng via Nominatim
  let lat, lng
  try {
    const geoCtl = new AbortController()
    const geoTimer = setTimeout(() => geoCtl.abort(), 10000)
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json`,
      { headers: { "User-Agent": "howbadisite/1.0" }, signal: geoCtl.signal }
    )
    clearTimeout(geoTimer)
    const geoData = await geoRes.json()
    if (!geoData.length) return NextResponse.json({ error: "Zip code not found" }, { status: 404 })
    lat = geoData[0].lat
    lng = geoData[0].lon
  } catch (e) {
    if (e.name === "AbortError") return NextResponse.json({ error: "Geocoding timed out" }, { status: 504 })
    return NextResponse.json({ error: "Failed to geocode zip" }, { status: 500 })
  }

  // Fetch reps from Open States
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 10000)
  try {
    const res = await fetch(
      `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}&include=offices`,
      { headers: { "X-API-KEY": process.env.OPEN_STATES_API_KEY || "" }, signal: ctl.signal }
    )
    clearTimeout(timer)
    if (!res.ok) throw new Error(`Open States returned ${res.status}`)

    const data = await res.json()
    const stateOnly = (data.results || []).filter(r => r.jurisdiction.classification === "state")

    const normalize = r => ({
      name: r.name,
      party: r.party === "Democratic" ? "Democrat" : r.party,
      district: r.current_role.district,
      title: `${r.current_role.org_classification === "upper" ? "NY State Senator" : "NY Assembly Member"} · District ${r.current_role.district}`,
      photoURL: r.image || null,
      link: r.openstates_url || null,
      email: r.email || null,
      phone: r.offices?.find(o => o.voice)?.voice || null,
      role: r.current_role.org_classification === "upper" ? "state_senate" : "state_assembly",
    })

    return NextResponse.json({
      senate:   stateOnly.filter(r => r.current_role.org_classification === "upper").map(normalize),
      assembly: stateOnly.filter(r => r.current_role.org_classification === "lower").map(normalize),
    })
  } catch (e) {
    clearTimeout(timer)
    if (e.name === "AbortError") return NextResponse.json({ error: "Request timed out" }, { status: 504 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
