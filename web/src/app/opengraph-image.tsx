import { ImageResponse } from "next/og";

/**
 * Open Graph preview image for the site root.
 *
 * Generated at build time via `next/og` (Satori under the hood). Renders
 * to a static PNG at `/opengraph-image.png` in the export, and Next.js
 * automatically wires the meta tags into <head>.
 *
 * Design notes:
 * - Pulls the Verdigris & Marble palette from .windsurfrules / globals.css.
 *   Values are inlined here because Satori does not parse external CSS or
 *   tailwind classes; it only honors literal style attributes.
 * - Uses Satori's default font (a sans-serif). We don't load Fraunces here
 *   because doing so would either bundle a TTF in the repo or fetch it
 *   over the network at build time, which makes builds flaky on slow /
 *   offline runners. The OG card is a one-line hero anyway.
 * - The accent rule on the left is a 12px verdigris bar — this is the
 *   same visual signature used by the sidebar and headers in the app, so
 *   readers who land via a shared link recognise the brand.
 */

export const alt =
  "Sculpture in Data — explore how sculpture evolved across 200 years";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Required for `output: "export"` (static-export build). Without this,
// Next refuses to generate the route at build time because it treats
// opengraph-image routes as dynamic by default.
export const dynamic = "force-static";

const BG = "#FAFAF9"; // marble
const FG = "#1A1D1C"; // text-primary
const MUTED = "#5C6560"; // text-secondary
const FAINT = "#6B706D"; // text-tertiary
const ACCENT = "#3D7A68"; // verdigris

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: BG,
          color: FG,
        }}
      >
        {/* Verdigris accent rule — same brand signature as the sidebar. */}
        <div
          style={{
            width: 16,
            height: "100%",
            backgroundColor: ACCENT,
          }}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: ACCENT,
              fontWeight: 600,
            }}
          >
            Sculpture in Data
          </div>

          {/* Headline + subhead */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                fontSize: 96,
                lineHeight: 1.05,
                fontWeight: 700,
                letterSpacing: -2,
                color: FG,
              }}
            >
              How sculpture evolved
            </div>
            <div
              style={{
                fontSize: 36,
                lineHeight: 1.3,
                color: MUTED,
                maxWidth: 880,
              }}
            >
              Materials, movements, geography, and lineage —
              3,630 sculptors across 200 years.
            </div>
          </div>

          {/* Footer rule */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 22,
              color: FAINT,
            }}
          >
            <div>From Wikidata · Getty ULAN cross-referenced</div>
            <div style={{ fontWeight: 600, color: FG }}>sculptor-explorer</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
