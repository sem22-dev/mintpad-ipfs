// components/HoverCard.tsx

import React, { ReactNode } from "react";

interface HoverCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

const HoverCard: React.FC<HoverCardProps> = ({ title, description, children }) => {
  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "30px",
        backgroundColor: "black",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        display: "inline-block",
        width: "100%",
        boxSizing: "border-box",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.03)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      }}
    >
      <p
        style={{
          fontSize: "22px",
          fontWeight: "600",
          color: "#e0e0e0",
          marginBottom: "15px",
        }}
      >
        {title}
      </p>
      <p style={{ fontSize: "16px", color: "#aaaaaa", marginBottom: "20px" }}>
        {description}
      </p>
      <div>{children}</div>
    </div>
  );
};

export default HoverCard;
