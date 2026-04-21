import { NextResponse } from "next/server"

const PRESIDENT = {
  name: "Donald J. Trump",
  party: "Republican",
  state: "Washington, D.C.",
  title: "President of the United States",
  phone: "202-456-1111",
  link: "https://www.whitehouse.gov/contact/",
  office: "The White House, 1600 Pennsylvania Ave NW, Washington, DC 20500",
  role: "president",
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")
  if (!zip) return NextResponse.json({ error: "zip required" }, { status: 400 })

  try {
    const res = await fetch(
      `https://whoismyrepresentative.com/getall_mems.php?zip=${zip}&output=json`
    )
    const text = await res.text()
    const data = JSON.parse(text)
    const results = data.results || []

    const members = results.map(r => ({
      name: r.name,
      party: r.party,
      state: r.state,
      district: r.district || null,
      phone: r.phone || null,
      office: r.office || null,
      link: r.link || null,
      role: r.district ? "house" : "senator",
      title: r.district
        ? `U.S. Representative · ${r.state}-${r.district}`
        : `U.S. Senator · ${r.state}`,
    }))

    return NextResponse.json({ reps: [PRESIDENT, ...members] })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
