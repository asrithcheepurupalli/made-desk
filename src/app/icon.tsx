import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
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
          border: "16px solid #16130f",
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
              fontSize: 160,
              fontFamily: "sans-serif",
              fontWeight: 900,
              color: "#f6f3ee",
              letterSpacing: "-0.05em",
            }}
          >
            made
          </span>
          <span
            style={{
              fontSize: 160,
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
            marginTop: -10,
            padding: "8px 24px",
            background: "#f6f3ee",
            border: "4px solid #16130f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#16130f",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
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
