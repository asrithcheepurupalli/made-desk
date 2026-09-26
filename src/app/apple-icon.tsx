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
          background: "#16130f",
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
              fontSize: 54,
              fontFamily: "sans-serif",
              fontWeight: 900,
              color: "#f6f3ee",
              letterSpacing: "-0.04em",
            }}
          >
            made
          </span>
          <span
            style={{
              fontSize: 54,
              fontFamily: "sans-serif",
              fontWeight: 900,
              color: "#c8102e",
            }}
          >
            .
          </span>
        </div>
        <div
          style={{
            marginTop: -4,
            padding: "3px 10px",
            background: "#f6f3ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#16130f",
              letterSpacing: "0.15em",
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
