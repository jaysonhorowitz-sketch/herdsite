// Proxy for Kalshi public market data — cached 1 hour
// GET /api/kalshi/:ticker  →  { odds: 67, title: "...", ticker: "..." }

export async function GET(request, { params }) {
  const { ticker } = params

  try {
    const res = await fetch(
      `https://trading-api.kalshi.com/trade-api/v2/markets/${ticker}`,
      {
        headers: { "Accept": "application/json" },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      return Response.json({ error: "market_not_found" }, { status: 404 })
    }

    const data = await res.json()
    const market = data.market

    // Kalshi prices are in cents (0–99), convert to 0–100 percentage
    const price = market.yes_bid ?? market.last_price ?? null
    const odds  = price !== null ? Math.round(price) : null

    return Response.json({
      ticker:  market.ticker,
      title:   market.title,
      odds,                         // e.g. 67 = 67% probability
      volume:  market.volume,
      closes:  market.close_time,
    })
  } catch {
    return Response.json({ error: "fetch_failed" }, { status: 500 })
  }
}
