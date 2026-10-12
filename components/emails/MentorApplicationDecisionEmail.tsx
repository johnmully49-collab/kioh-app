import * as React from "react";

interface MentorApplicationDecisionEmailProps {
  fullName: string;
  status: "Approved" | "Rejected";
  dashboardUrl: string;
}

export const MentorApplicationDecisionEmail: React.FC<
  MentorApplicationDecisionEmailProps
> = ({ fullName, status, dashboardUrl }) => (
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
        NAVIGATOR APPLICATION UPDATE
      </div>

      <h1
        style={{
          fontSize: "22px",
          fontWeight: "bold",
          marginTop: "16px",
          color: "#ffffff",
        }}
      >
        Your application was {status.toLowerCase()}
      </h1>

      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Jambo {fullName},
      </p>

      {status === "Approved" ? (
        <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
          Your application to become a KIOH Navigator has been approved. Your
          account has been updated, and you can sign in to view your dashboard.
        </p>
      ) : (
        <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
          Thank you for applying to become a KIOH Navigator. After review, we
          are unable to approve your application at this time.
        </p>
      )}

      <p
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          marginTop: "24px",
          lineHeight: "1.5",
        }}
      >
        You can view your application status from your KIOH dashboard.
      </p>

      <a
        href={dashboardUrl}
        style={{
          display: "inline-block",
          marginTop: "12px",
          padding: "12px 20px",
          borderRadius: "9999px",
          backgroundColor: "#2dd4bf",
          color: "#020617",
          fontSize: "13px",
          fontWeight: "bold",
          textDecoration: "none",
        }}
      >
        Open your dashboard
      </a>
    </div>
  </div>
);
