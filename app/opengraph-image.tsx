import { ImageResponse } from "next/og";

export const alt = "WC2026 AI Predictor — Predict the World Cup with AI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

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
          backgroundColor: "#080b14",
          backgroundImage:
            "radial-gradient(ellipse at 50% 120%, rgba(245, 197, 24, 0.18) 0%, transparent 65%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "10px 28px",
            borderRadius: 9999,
            border: "1px solid #2d3a5a",
            backgroundColor: "#0e1220",
            color: "#8899bb",
            fontSize: 26,
            marginBottom: 36,
          }}
        >
          🏆 FIFA World Cup 2026
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            color: "#f5c518",
            letterSpacing: -2,
            marginBottom: 20,
          }}
        >
          WC2026 AI Predictor
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#e8eaf0",
            marginBottom: 48,
          }}
        >
          Predict the World Cup with AI
        </div>
        <div
          style={{
            display: "flex",
            gap: 48,
            color: "#8899bb",
            fontSize: 28,
          }}
        >
          <span>48 teams</span>
          <span style={{ color: "#2d3a5a" }}>|</span>
          <span>104 matches</span>
          <span style={{ color: "#2d3a5a" }}>|</span>
          <span>AI-powered predictions</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
