import * as React from "react";

interface WelcomeEmailProps {
  fullName: string;
  role: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  fullName,
  role,
}) => (
  <div style={{ fontFamily: "sans-serif", backgroundColor: "#020617", color: "#f8fafc", padding: "40px 20px" }}>
    <div style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#0f172a", borderRadius: "24px", padding: "32px", border: "1px solid rgba(255,255,255,0.1)" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#2dd4bf" }}>
        Welcome to KIOH! 🚀
      </h1>
      <p style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Jambo {fullName},
      </p>
      <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
        Your account is verified! You are officially registered as a <strong style={{ color: "#2dd4bf" }}>{role.toUpperCase()}</strong> inside the Kenya Innovation & Opportunity Hub.
      </p>

      <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px", marginTop: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ fontSize: "14px", color: "#ffffff", margin: "0 0 10px 0" }}>What you can do next:</h3>
        <ul style={{ fontSize: "13px", color: "#94a3b8", paddingLeft: "20px", margin: 0, lineHeight: "1.8" }}>
          <li>Explore live opportunities, grants, and programs.</li>
          <li>Connect with Navigators and experienced mentors.</li>
          <li>Complete your profile with your location and focus area.</li>
        </ul>
      </div>

      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
          style={{
            backgroundColor: "#2dd4bf",
            color: "#020617",
            padding: "12px 24px",
            borderRadius: "9999px",
            fontWeight: "bold",
            fontSize: "13px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  </div>
);