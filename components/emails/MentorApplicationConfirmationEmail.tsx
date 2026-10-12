import * as React from "react";

interface MentorApplicationConfirmationEmailProps {
  fullName: string;
  specialties: string[];
  county: string;
}

export const MentorApplicationConfirmationEmail: React.FC<
  MentorApplicationConfirmationEmailProps
> = ({ fullName, specialties, county }) => (
  <div
    style={{
      fontFamily: "sans-serif",
      backgroundColor: "#020617",
      color: "#f8fafc",
      padding: "40px 20px",
    }}
  >
    <div
      style={{
        maxWidth: "560px",
        margin: "0 auto",
        backgroundColor: "#0f172a",
        borderRadius: "24px",
        padding: "32px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "8px 16px",
          backgroundColor: "rgba(45,212,191,0.1)",
          color: "#2dd4bf",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        NAVIGATOR APPLICATION RECEIVED
      </div>

      <h1
        style={{
          fontSize: "22px",
          fontWeight: "bold",
          marginTop: "16px",
          color: "#ffffff",
        }}
      >
        Welcome to the Navigator Pipeline! 🌟
      </h1>

      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Jambo {fullName},
      </p>

      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Thank you for applying to become a <strong style={{ color: "#2dd4bf" }}>KIOH Ecosystem Navigator/Mentor</strong>. Your experience will play a critical role in supporting young innovators across Kenya.
      </p>

      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: "16px",
          padding: "20px",
          marginTop: "20px",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            margin: "0 0 10px 0",
            textTransform: "uppercase",
          }}
        >
          Application Summary:
        </h3>
        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "4px 0" }}>
          📍 <strong>Base County:</strong> {county}
        </p>
        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "4px 0" }}>
          🎯 <strong>Core Domains:</strong> {specialties.join(", ")}
        </p>
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "#64748b",
          marginTop: "24px",
          lineHeight: "1.5",
        }}
      >
        Our ecosystem team will review your profile and reach out via email within 3-5 business days to finalize your onboarding.
      </p>
    </div>
  </div>
);