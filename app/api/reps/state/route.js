import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")
  if (!zip) return NextResponse.json({ error: "zip required" }, { status: 400 })

  // Geocode zip → lat/lng via Zippopotam (works from serverless/cloud IPs)
  let lat, lng
  try {
    const geoCtl = new AbortController()
    const geoTimer = setTimeout(() => geoCtl.abort(), 10000)
    const geoRes = await fetch(
      `https://api.zippopotam.us/us/${zip}`,
      { signal: geoCtl.signal }
    )
    clearTimeout(geoTimer)
    if (!geoRes.ok) return NextResponse.json({ error: "Zip code not found" }, { status: 404 })
    const geoData = await geoRes.json()
    lat = geoData.places[0].latitude
    lng = geoData.places[0].longitude
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

    const checkPhoto = async url => {
      if (!url) return null
      try {
        const r = await fetch(url, { method: "HEAD", redirect: "follow" })
        return r.ok ? url : null
      } catch { return null }
    }

    const stateName = stateOnly[0]?.jurisdiction?.name || ""
    const chamber = org => org === "upper" ? `${stateName} State Senator` : `${stateName} Assembly Member`

    const normalize = async r => ({
      name: r.name,
      party: r.party === "Democratic" ? "Democrat" : r.party,
      district: r.current_role.district,
      title: `${chamber(r.current_role.org_classification)} · District ${r.current_role.district}`,
      photoURL: await checkPhoto(r.image),
      link: r.openstates_url || null,
      email: r.email || null,
      phone: r.offices?.find(o => o.voice)?.voice || null,
      role: r.current_role.org_classification === "upper" ? "state_senate" : "state_assembly",
    })

    const normalized = await Promise.all(stateOnly.map(normalize))

    return NextResponse.json({
      senate:   normalized.filter(r => r.role === "state_senate"),
      assembly: normalized.filter(r => r.role === "state_assembly"),
    })
  } catch (e) {
    clearTimeout(timer)
    if (e.name === "AbortError") return NextResponse.json({ error: "Request timed out" }, { status: 504 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
