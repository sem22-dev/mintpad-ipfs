"use client"
import Head from "next/head";
import UploadComponent from "./components/UploadComponent";
import HoverCard from "./components/HoverCard"; // Import the HoverCard component

export default function Home() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: '"Poppins", Arial, sans-serif',
        backgroundColor: "#000000", // Black background
        borderRadius: "20px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
        width: "100%",
        color: "#ffffff", // White text color
      }}
    >
      <Head>
        <title>Mintpad v2 - File Uploader</title>
        <meta name="description" content="Mintpad IPFS and contract updater" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </Head>

{/* Logo Section */}
<div style={{ textAlign: "center", marginBottom: "30px" }}>
  <a href="https://mintpad.co">
    <img
      src="https://mintpad.co/wp-content/uploads/2023/03/Logo-Mintpad-Grey.webp"
      alt="Mintpad Logo"
      style={{
        height: "80px",
        objectFit: "contain",
        marginBottom: "20px",
      }}
    />
  </a>
</div>

      <main
        style={{
          padding: "50px 20px",
          textAlign: "center",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "38px",
            fontWeight: "700",
            marginBottom: "30px",
            color: "#e0e0e0",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Mintpad v2 Beta File Uploader
        </h1>

 

        {/* Upload Folder Section */}
        <HoverCard title="Upload Folder" description={""}>
          <UploadComponent /> {/* Add the UploadComponent here */}
        </HoverCard>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "25px",
          backgroundColor: "black",
          borderTop: "1px solid #444",
          marginTop: "40px",
          borderRadius: "0 0 20px 20px",
          fontSize: "15px",
          color: "#cccccc",
        }}
      >
        <p style={{ margin: 0 }}>
          &copy; 2024 MintPad - All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
