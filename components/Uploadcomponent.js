"use client";
import { useState } from 'react';

export default function UploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState('');

  const handleFolderUpload = async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    const files = event.target.files;

    // Check if any files are selected
    if (files.length === 0) {
      setMessage('Please select a folder to upload.');
      return;
    }

    // Filter only mp4 files and append them
    let mp4FilesSelected = false;
    Array.from(files).forEach(file => {
      if (file.type === 'video/mp4') {
        formData.append('files', file, file.name);
        mp4FilesSelected = true;
      }
    });

    if (!mp4FilesSelected) {
      setMessage('Please select at least one MP4 file.');
      return;
    }

    setUploading(true);
    setMessage('');
    setLogs('');

    try {
      const response = await fetch('http://localhost:8020/uploadfiles', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Upload successful.');
        setLogs(result.logs);
      } else {
        setMessage('Upload failed.');
        setLogs(result.logs);
      }
    } catch (error) {
      setMessage('An error occurred during the upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Upload Folder or MP4 Files</h1>
      <input
        type="file"
        multiple
        webkitdirectory="true"
        onChange={handleFolderUpload}
        accept="video/mp4, .mp4"
      />
      <div>
        <button disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {message && <p>{message}</p>}
      {logs && <pre>{logs}</pre>}
    </div>
  );
}
