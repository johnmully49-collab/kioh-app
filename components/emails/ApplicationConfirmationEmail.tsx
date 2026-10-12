import * as React from "react";

interface ApplicationConfirmationEmailProps {
  fullName: string;
  opportunityTitle: string;
  organization: string;
  county: string;
  grantAmountLabel: string;
}

export const ApplicationConfirmationEmail: React.FC<
  ApplicationConfirmationEmailProps
> = ({ fullName, opportunityTitle, organization, county, grantAmountLabel }) => (
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
        APPLICATION CONFIRMATION
      </div>

      <h1
        style={{
          fontSize: "22px",
          fontWeight: "bold",
          marginTop: "16px",
          color: "#ffffff",
        }}
      >
        Application Received! 🚀
      </h1>

      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Jambo {fullName},
      </p>

      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Your application for{" "}
        <strong style={{ color: "#2dd4bf" }}>{opportunityTitle}</strong> has
        been successfully received by{" "}
        <strong style={{ color: "#ffffff" }}>{organization}</strong>.
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
          Opportunity Overview:
        </h3>
        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "4px 0" }}>
          📍 <strong>County/Region:</strong> {county}
        </p>
        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "4px 0" }}>
          💰 <strong>Funding Support:</strong> {grantAmountLabel}
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
        The opportunity coordinator will review your profile and application
        details. You can track the status of your application from your KIOH
        Dashboard.
      </p>
    </div>
  </div>
);