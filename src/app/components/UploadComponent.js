import { useState, useCallback, useEffect } from "react";
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import UpdateIpfsToContract from "./UpdateIpfsToContract";

const CHUNK_SIZE = 40 * 1024 * 1024; // 40MB chunks

export default function UploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [ipfsLink, setIpfsLink] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [lastRootCid, setLastRootCid] = useState("");
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadLogs, setUploadLogs] = useState([]);
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle', 'copied', 'error'

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

  // Function to set up SSE for progress tracking
  const setupProgressTracking = useCallback((sessionId) => {
    const eventSource = new EventSource(`http://localhost:8020/upload-progress/${sessionId}`);

    eventSource.onmessage = (event) => {
      try {
        const progressData = JSON.parse(event.data);
        
        // Add log entry
        setUploadLogs(prevLogs => [
          ...prevLogs, 
          { 
            timestamp: new Date().toLocaleTimeString(), 
            ...progressData 
          }
        ]);

        // Handle specific progress stages
        if (progressData.stage === 'complete') {
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return eventSource;
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

    // Reset all states
    setUploading(true);
    setMessage("");
    setUploadLogs([]);
    setProgress(0);
    setCurrentChunkIndex(0);

    try {
      const { chunks, totalSize } = createFileChunks(files);
      setTotalChunks(chunks.length);
      const sessionId = Date.now().toString();

      // Set up SSE connection for progress tracking
      const eventSource = setupProgressTracking(sessionId);

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

          // Close event source
          eventSource.close();
        }
      }
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
      setUploadLogs(prevLogs => [
        ...prevLogs, 
        { 
          timestamp: new Date().toLocaleTimeString(), 
          stage: 'error', 
          message: error.message 
        }
      ]);
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
      .then(() => {
        setCopyStatus('copied');
        // Reset copy status after 2 seconds
        setTimeout(() => setCopyStatus('idle'), 2000);
      })
      .catch((err) => {
        setCopyStatus('error');
        setMessage("Failed to copy URL: " + err);
        // Reset copy status after 2 seconds
        setTimeout(() => setCopyStatus('idle'), 2000);
      });
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-2xl border border-gray-800">
      <h1 className="text-3xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
        Upload Folder to IPFS
      </h1>
      
      <form
        id="uploadForm"
        onSubmit={handleFolderUpload}
        encType="multipart/form-data"
        className="text-center"
      >
        <input
          type="file"
          name="files"
          multiple
          webkitdirectory="true"
          directory="true"
          className="block mx-auto mb-6 p-4 bg-gray-800 text-white rounded-xl 
            file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 
            file:text-sm file:bg-blue-600 file:text-white 
            hover:file:bg-blue-700 transition-all duration-300 
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={handleFileSelection}
        />
        
        {totalFiles > 0 && (
          <p className="text-sm mb-6 text-gray-300 flex items-center justify-center gap-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            {totalFiles} image/video/gif{totalFiles > 1 ? "s" : ""} selected
          </p>
        )}
        
        <button
          type="submit"
          disabled={uploading}
          className={`mx-auto mb-6 px-8 py-3.5 rounded-xl text-white font-bold 
            transition-all duration-300 flex items-center gap-2 justify-center
            ${uploading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl'
            }`}
        >
          {uploading ? `Uploading (${currentChunkIndex}/${totalChunks})...` : "Upload"}
        </button>
      </form>

      {uploading && (
        <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {message && (
        <p className={`text-center mb-6 flex items-center justify-center gap-2 ${message.includes("failed") ? "text-red-400" : "text-green-400"}`}>
          {message.includes("failed") ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          {message}
        </p>
      )}

      {/* Detailed Logs Section */}
      {uploadLogs.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">Upload Logs</h2>
          <div className="max-h-64 overflow-y-auto">
            {uploadLogs.map((log, index) => (
              <div 
                key={index} 
                className={`text-sm mb-2 p-2.5 rounded-lg ${
                  log.stage === 'error' 
                    ? 'bg-red-900/50 text-red-300' 
                    : log.stage === 'complete'
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-gray-700/50 text-gray-300'
                }`}
              >
                <span className="font-mono text-xs mr-2">{log.timestamp}</span>
                {log.stage && <span className="font-bold mr-2 uppercase">[{log.stage}]</span>}
                {log.message && <span>{log.message}</span>}
                {log.processedChunks && (
                  <span>
                    Processed Chunks: {log.processedChunks}/{log.totalChunks} 
                    ({log.percentage}%)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadComplete && lastRootCid && (
        <>
          {lastRootCid && typeof lastRootCid === 'string' && (
            <p className="mt-6 text-center text-gray-300 flex items-center justify-center gap-2">
              Latest Root CID:{" "}
              <a 
                href={`https://private-gray-tiger.myfilebase.com/ipfs/${lastRootCid}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline hover:text-blue-300 transition-colors"
              >
                {lastRootCid}
              </a>
            </p>
          )}

          <div className="flex flex-col justify-center mt-6 space-x-4">
            <button
              onClick={copyFullUrlToClipboard}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 
                ${copyStatus === 'copied' 
                  ? 'bg-green-600 text-white' 
                  : copyStatus === 'error' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {copyStatus === 'copied' ? (
                <>
                  <CheckCircle size={20} /> Copied!
                </>
              ) : copyStatus === 'error' ? (
                <>
                  <AlertTriangle size={20} /> Copy Failed
                </>
              ) : (
                <>
                  <Copy size={20} /> Copy IPFS Full URL
                </>
              )}
            </button>

            <UpdateIpfsToContract
              ipfsLink={ipfsLink}
              fileSize={Math.floor(fileSize / 2)}
              collectionSize={totalFiles}
            />
          </div>
        </>
      )}
    </div>
  );
}