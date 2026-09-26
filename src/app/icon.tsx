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
          background: "#0b0b0c",
          border: "12px solid #262320",
          position: "relative",
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
              fontSize: 180,
              fontFamily: "Georgia, serif",
              fontWeight: 600,
              fontStyle: "italic",
              color: "#f6f3ee",
              letterSpacing: "-0.04em",
            }}
          >
            made
          </span>
          <span
            style={{
              fontSize: 180,
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              fontStyle: "normal",
              color: "#c8102e",
              marginLeft: 2,
            }}
          >
            .
          </span>
        </div>

        <div
          style={{
            marginTop: -15,
            padding: "6px 20px",
            background: "#f6f3ee",
            border: "2px solid #0b0b0c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#0b0b0c",
              letterSpacing: "0.25em",
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
