"use client"
import Head from "next/head";
import UploadComponent from "./components/UploadComponent";
import HoverCard from "./components/HoverCard"; // Import the HoverCard component

export default function Home() {
  return (
    <div
    >
        <title>Mintpad v2 - File Uploader</title>
        <meta name="description" content="Mintpad IPFS and contract updater" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />

{/* Logo Section */}
      <div className="mt-8 flex justify-center items-center">
        <a href="https://mintpad.co">
          <img
            src="https://mintpad.co/wp-content/uploads/2023/03/Logo-Mintpad-Grey.webp"
            alt="Mintpad Logo"
            style={{
              height: "25px",
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
        className=""
      >
        <h1
          className="text-3xl"
        >
          Mintpad v2 Beta File Uploader
        </h1>

 

      <div className=" mt-12">
          {/* Upload Folder Section */}
          <HoverCard title="" description={""} >
          <UploadComponent /> {/* Add the UploadComponent here */}
        </HoverCard>
      </div>
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
