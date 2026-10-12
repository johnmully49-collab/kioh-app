import * as React from "react";

interface VerificationEmailProps {
  fullName: string;
  verificationUrl: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  fullName,
  verificationUrl,
}) => (
  <div style={{ fontFamily: "sans-serif", backgroundColor: "#020617", color: "#f8fafc", padding: "40px 20px" }}>
    <div style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#0f172a", borderRadius: "24px", padding: "32px", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "inline-block", padding: "8px 16px", backgroundColor: "rgba(45,212,191,0.1)", color: "#2dd4bf", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" }}>
        KIOH ECOSYSTEM
      </div>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "16px", color: "#ffffff" }}>
        Verify Your Email Address
      </h1>
      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Hi {fullName},
      </p>
      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Welcome to the Kenya Innovation & Opportunity Hub! Please click the button below to verify your email address and activate your account:
      </p>

      <div style={{ marginTop: "32px", marginBottom: "32px", textAlign: "center" }}>
        <a
          href={verificationUrl}
          style={{
            backgroundColor: "#2dd4bf",
            color: "#020617",
            padding: "14px 28px",
            borderRadius: "9999px",
            fontWeight: "bold",
            fontSize: "14px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Verify Email Address →
        </a>
      </div>

      <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
        If you did not create an account with KIOH, you can safely ignore this email.
      </p>
    </div>
  </div>
);