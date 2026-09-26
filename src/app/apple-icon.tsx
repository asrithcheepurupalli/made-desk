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
              fontSize: 78,
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
              fontSize: 78,
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
      </div>
    ),
    {
      ...size,
    }
  );
}
