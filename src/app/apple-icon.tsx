import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
          background: "#0b0b0c",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontFamily: "Georgia, serif",
              fontWeight: 600,
              fontStyle: "italic",
              color: "#f6f3ee",
              letterSpacing: "-0.03em",
            }}
          >
            made
          </span>
          <span
            style={{
              fontSize: 64,
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              fontStyle: "normal",
              color: "#c8102e",
              marginLeft: 1,
            }}
          >
            .
          </span>
        </div>

        <div
          style={{
            marginTop: -6,
            padding: "2px 8px",
            background: "#f6f3ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#0b0b0c",
              letterSpacing: "0.2em",
            }}
          >
            DESK
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
