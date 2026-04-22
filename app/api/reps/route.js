import { NextResponse } from "next/server"

const PRESIDENT = {
  name: "Donald J. Trump",
  party: "Republican",
  title: "President of the United States",
  phone: "202-456-1111",
  link: "https://www.whitehouse.gov/contact/",
  office: "The White House, 1600 Pennsylvania Ave NW, Washington, DC 20500",
  role: "president",
  photoURL: "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")
  if (!zip) return NextResponse.json({ error: "zip required" }, { status: 400 })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `https://api.5calls.org/v1/representatives?location=${zip}`,
      {
        headers: { "X-5Calls-Token": process.env.FIVE_CALLS_API_KEY || "" },
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`5calls returned ${res.status}`)

    const data = await res.json()
    const raws = data.representatives || []

    // Extract bioguide ID from 5calls photo URL, then use unitedstates.github.io (more reliable)
    const bioguideFromUrl = url => {
      if (!url) return null
      const m = url.match(/\/([A-Z]\d{6})\.jpg/)
      return m ? m[1] : null
    }

    const checkPhoto = async url => {
      if (!url) return null
      try {
        const r = await fetch(url, { method: "HEAD" })
        return r.ok ? url : null
      } catch { return null }
    }

    const reps = await Promise.all(raws.map(async r => {
      const bioguide = bioguideFromUrl(r.photoURL)
      const githubUrl = bioguide ? `https://unitedstates.github.io/images/congress/450x550/${bioguide}.jpg` : null
      const photoURL = await checkPhoto(githubUrl) || await checkPhoto(r.photoURL)
      return {
        name: r.name,
        party: r.party,
        area: r.area,
        role: r.area === "US Senate" ? "senator" : "house",
        title: r.area === "US Senate"
          ? `U.S. Senator · ${r.state}`
          : `U.S. Representative · ${r.state}${r.district ? `-${r.district}` : ""}`,
        phone: r.phone || null,
        link: r.url || null,
        office: null,
        photoURL,
        state: r.state || null,
        district: r.district || null,
        twitter: r.twitter || null,
        instagram: r.instagram || null,
        fieldOffices: r.field_offices || [],
      }
    }))

    return NextResponse.json({
      reps: [PRESIDENT, ...reps],
      lowAccuracy: data.lowAccuracy || false,
    })
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
