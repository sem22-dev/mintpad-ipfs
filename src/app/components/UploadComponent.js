import { useState, useCallback } from "react";
import UpdateIpfsToContract from "./UpdateIpfsToContract";

const CHUNK_SIZE = 40 * 1024 * 1024; // 40MB chunks

export default function UploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [ipfsLink, setIpfsLink] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [lastRootCid, setLastRootCid] = useState("");
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  // Function to create chunks from files
  const createFileChunks = useCallback((files) => {
    const chunks = [];
    let currentChunk = new FormData();
    let currentSize = 0;
    let chunkIndex = 0;
    let totalSize = 0;

    Array.from(files).forEach((file) => {
      totalSize += file.size;
      
      if (currentSize + file.size > CHUNK_SIZE) {
        chunks.push({
          formData: currentChunk,
          index: chunkIndex,
          size: currentSize
        });
        currentChunk = new FormData();
        currentSize = 0;
        chunkIndex++;
      }
      
      currentChunk.append("files", file, file.webkitRelativePath);
      currentSize += file.size;
    });

    if (currentSize > 0) {
      chunks.push({
        formData: currentChunk,
        index: chunkIndex,
        size: currentSize
      });
    }

    return { chunks, totalSize };
  }, []);

  // Function to upload a single chunk
  const uploadChunk = useCallback(async (chunk, sessionId, totalChunks) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://app.mintpad.co/uploadfiles", true);
      
      // Set chunk-related headers
      xhr.setRequestHeader("X-Chunk-Index", chunk.index);
      xhr.setRequestHeader("X-Total-Chunks", totalChunks);
      xhr.setRequestHeader("X-Session-Id", sessionId);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Calculate overall progress including previous chunks
          const chunkProgress = (event.loaded / event.total) * 100;
          const overallProgress = ((chunk.index * 100) + chunkProgress) / totalChunks;
          setProgress(Math.round(overallProgress));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Invalid server response"));
          }
        } else {
          reject(new Error(xhr.responseText || "Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(chunk.formData);
    });
  }, []);

  // Handle folder upload
  const handleFolderUpload = async (event) => {
    event.preventDefault();
    const files = event.target.files.files;

    if (files.length === 0) {
      setMessage("Please select a folder to upload.");
      return;
    }

    setUploading(true);
    setMessage("");
    setLogs("");
    setProgress(0);
    setCurrentChunkIndex(0);

    try {
      const { chunks, totalSize } = createFileChunks(files);
      setTotalChunks(chunks.length);
      const sessionId = Date.now().toString();

      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunkIndex(i + 1);
        const result = await uploadChunk(chunks[i], sessionId, chunks.length);
        
        // Handle the final response from the last chunk
        if (i === chunks.length - 1 && result.lastRootCID) {
          const fullIpfsLink = `https://private-gray-tiger.myfilebase.com/ipfs/${result.lastRootCID}/`;
          setIpfsLink(fullIpfsLink);
          setLastRootCid(result.lastRootCID);
          setFileSize(totalSize);
          setUploadComplete(true);
          setMessage("Upload completed successfully!");
        }
      }
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
      setLogs(error.toString());
    } finally {
      setUploading(false);
    }
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

    let totalSize = 0;

    Array.from(files).forEach(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (allowedExtensions.includes(fileExtension)) {
        fileCount[fileExtension]++;
        totalSize += file.size;

        // Check if the file exceeds the max size (1.5 GB)
        const maxFileSize = 1.5 * 1024 * 1024 * 1024;
        if (file.size > maxFileSize) {
          setMessage(`File ${file.name} is too large. Max allowed size is 1.5 GB.`);
          return;
        }
      }
    });

    const collectionSize = Object.values(fileCount).reduce((acc, count) => acc + count, 0);
    setTotalFiles(collectionSize);

    if (totalSize > 1.5 * 1024 * 1024 * 1024) {
      setMessage("Total file size exceeds 1.5 GB limit.");
    } else {
      setMessage("");
    }
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
          {uploading ? `Uploading (${currentChunkIndex}/${totalChunks})...` : "Upload"}
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

      {message && (
        <p style={{ textAlign: "center", color: message.includes("failed") ? "red" : "green" }}>
          {message}
        </p>
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
            fileSize={Math.floor(fileSize / 2)}
            collectionSize={totalFiles}
          />
        </>
      )}
    </div>
  );
}
