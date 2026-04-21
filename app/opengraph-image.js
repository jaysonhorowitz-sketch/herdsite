import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Herd — Track. Act. Organize."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1C2E1E",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 96,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Herd
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 32,
            fontWeight: 400,
            color: "#A8C5A0",
            letterSpacing: "0.04em",
          }}
        >
          Track. Act. Organize.
        </div>
      </div>
    ),
    { ...size }
  )
}
