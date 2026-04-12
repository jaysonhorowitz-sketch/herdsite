export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get("zip")?.trim()

  if (!zip || !/^\d{5}$/.test(zip)) {
    return Response.json({ error: "Valid 5-digit zip required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://whoismyrepresentative.com/getall_mems.php?zip=${zip}&output=json`,
      { headers: { Accept: "application/json" }, next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const data = await res.json()
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 })
  }
}
