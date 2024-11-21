"use client"
import { useState } from 'react';

export default function UploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState('');

  const handleFolderUpload = async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    const files = event.target.files.files;

    if (files.length === 0) {
      setMessage('Please select a folder to upload.');
      return;
    }

    Array.from(files).forEach(file => {
      formData.append('files', file, file.webkitRelativePath);
    });

    setUploading(true);
    setMessage('');
    setLogs('');

    try {
      const response = await fetch('http://localhost:6000/uploadFiles', {
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
      <h1 style={{ textAlign: 'center' }}>Upload Folder</h1>
      <form id="uploadForm" onSubmit={handleFolderUpload} encType="multipart/form-data" style={{ textAlign: 'center' }}>
        <input 
          type="file" 
          name="files" 
          multiple 
          webkitdirectory="true" 
          directory="true" 
          style={{ display: 'block', margin: '0 auto', padding: '10px', fontSize: '16px' }} 
        />
        <button 
          type="submit" 
          disabled={uploading} 
          style={{
            display: 'block', 
            margin: '20px auto', 
            padding: '12px 24px', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#fff', 
            background: uploading ? '#8c8c8c' : 'linear-gradient(135deg, #4e74e6, #1d56f1)', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: uploading ? 'not-allowed' : 'pointer', 
            transition: 'all 0.3s ease-in-out', 
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {message && <p style={{ textAlign: 'center', fontSize: '16px', fontWeight: '500', color: '#333' }}>{message}</p>}
      {logs && <pre style={{ textAlign: 'center', color: '#333' }}>{logs}</pre>}
    </div>
  );
}
