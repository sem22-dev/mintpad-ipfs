import { useState } from "react";
import UpdateIpfsToContract from "./UpdateIpfsToContract"; // Import the contract interaction component

export default function UploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [ipfsLink, setIpfsLink] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [lastRootCid, setLastRootCid] = useState(""); // Last root CID

  // Handle folder upload
  const handleFolderUpload = async (event) => {
    event.preventDefault();
  
    const formData = new FormData();
    const files = event.target.files.files;
  
    if (files.length === 0) {
      setMessage("Please select a folder to upload.");
      return;
    }
  
    // Append files to formData
    Array.from(files).forEach((file) => {
      formData.append("files", file, file.webkitRelativePath);
    });
  
    setUploading(true);
    setMessage("");
    setLogs("");
    setProgress(0);
  
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://app.mintpad.co/uploadfiles", true); // Ensure you're hitting the correct endpoint
  
    // Handle progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };
  
    // Handle successful upload and server response
    xhr.onload = () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.lastRootCID) {
          const fullIpfsLink = `https://private-gray-tiger.myfilebase.com/ipfs/${result.lastRootCID}/`;
          setIpfsLink(fullIpfsLink);
          setLastRootCid(result.lastRootCID); // Last root CID as a string
          setFileSize(result.fileSize); // Ensure fileSize is updated
          setUploadComplete(true); // Mark the upload as complete
        }
      } else {
        setMessage("Upload failed.");
        setLogs(xhr.responseText); // Set logs from response
      }
      setUploading(false);
    };
    
    // Handle error
    xhr.onerror = () => {
      setMessage("Error uploading files.");
      setUploading(false);
    };

    xhr.send(formData);
  };
  
  // Handle file selection for upload
  const handleFileSelection = (event) => {
    const files = event.target.files;
    const allowedExtensions = ['png', 'jpeg', 'jpg', 'mp4', 'gif'];

    const fileCount = {
      png: 0,
      jpg: 0,
      jpeg: 0,
      mp4: 0,
      gif: 0
    };

    Array.from(files).forEach(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (allowedExtensions.includes(fileExtension)) {
        fileCount[fileExtension]++;
      }
    });

    const collectionSize = Object.values(fileCount).reduce((acc, count) => acc + count, 0);
    setTotalFiles(collectionSize);
  };

  // Copy the full IPFS URL to the clipboard
  const copyFullUrlToClipboard = () => {
    const fullUrl = `https://private-gray-tiger.myfilebase.com/ipfs/${lastRootCid}/`;
    navigator.clipboard.writeText(fullUrl)
      .then(() => setMessage("Full URL copied to clipboard!"))
      .catch((err) => setMessage("Failed to copy URL: " + err));
  };

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Upload Folder</h1>
      <form
        id="uploadForm"
        onSubmit={handleFolderUpload}
        encType="multipart/form-data"
        style={{ textAlign: "center" }}
      >
        <input
          type="file"
          name="files"
          multiple
          webkitdirectory="true"
          directory="true"
          style={{ display: "block", margin: "0 auto", padding: "10px", fontSize: "16px" }}
          onChange={handleFileSelection}
        />
        {totalFiles > 0 && (
          <p style={{ fontSize: "16px", color: "white" }}>
            {totalFiles} image/videos/gif{totalFiles > 1 ? "s" : ""} selected
          </p>
        )}
        <button
          type="submit"
          disabled={uploading}
          style={{
            display: "block",
            margin: "20px auto",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "600",
            color: "#fff",
            background: uploading ? "#8c8c8c" : "linear-gradient(135deg, #4e74e6, #1d56f1)",
            border: "none",
            borderRadius: "8px",
            cursor: uploading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease-in-out",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {uploading && (
        <div style={{ marginTop: "20px", width: "100%", backgroundColor: "#f3f3f3", borderRadius: "8px" }}>
          <div style={{
            height: "10px",
            width: `${progress}%`,
            backgroundColor: "#4e74e6",
            borderRadius: "8px",
            transition: "width 0.5s ease-in-out"
          }}></div>
        </div>
      )}

      {uploadComplete && lastRootCid && (
        <>
          {lastRootCid && typeof lastRootCid === 'string' && (
            <p>
              Latest Root CID:{" "}
              <a href={`https://private-gray-tiger.myfilebase.com/ipfs/${lastRootCid}`} target="_blank" rel="noopener noreferrer">
                {lastRootCid}
              </a>
            </p>
          )}

          <button
            onClick={copyFullUrlToClipboard}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#fff",
              background: "linear-gradient(135deg, #4e74e6, #1d56f1)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease-in-out",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            Copy IPFS Full URL
          </button>

          <UpdateIpfsToContract
            ipfsLink={ipfsLink}
            fileSize={Math.floor(fileSize / 2)} // Assuming you need this in bytes
            collectionSize={totalFiles}
          />
        </>
      )}
    </div>
  );
}
