import React, { useState } from 'react';
import '../styles/dashboard.css';

export const Dashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [segmentedAudios, setSegmentedAudios] = useState<{ sentence: string; audio_filename: string }[]>([]);

  // Show the upload form
  const handleButtonClick = () => {
    setShowForm(true);
    setUploadMessage('');
    setSegmentedAudios([]); // Optionally clear previous results
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Download a base64-encoded file
  function downloadFile(base64String: string, filename: string, mimeType: string) {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    // Optionally, revoke the object URL after download
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  // Handle file upload and streaming response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadMessage('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadMessage('Uploading and processing...');
    setSegmentedAudios([]); // Clear previous results

    const response = await fetch('/api/upload-audio', {
      method: 'POST',
      body: formData
    });

    const reader = response.body?.getReader();
    let receivedText = '';
    let allSegments: { sentence: string; audio_filename: string }[] = [];
    while (reader) {
      const { value, done } = await reader.read();
      if (done) break;
      receivedText += new TextDecoder().decode(value);
      const lines = receivedText.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const data = JSON.parse(lines[i]);
          if (data.progress) setUploadMessage(data.progress);
          if (data.sentence && data.audio_data && data.audio_filename) {
            downloadFile(data.audio_data, data.audio_filename, "audio/mp3");
            allSegments.push({ sentence: data.sentence, audio_filename: data.audio_filename });
          }
        } catch {
          // ignore parse errors for incomplete lines
        }
      }
      receivedText = lines[lines.length - 1];
    }
    setSegmentedAudios(allSegments);
    setUploadMessage('Done!');
    setShowForm(false);
    setSelectedFile(null);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">UPolly</h1>
        <h2 className="dashboard-subtitle">
          Practise English via polly!
        </h2>
      </header>
      <button className="new-audio-btn" onClick={handleButtonClick}>
        + New Audio
      </button>
      {showForm && (
        <form className="upload-form" onSubmit={handleSubmit}>
          <label>
            Select audio file:
            <input type="file" accept="audio/*" onChange={handleFileChange} />
          </label>
          <button type="submit" className="upload-btn">
            Upload
          </button>
        </form>
      )}
      {uploadMessage && (
        <div className="upload-message">{uploadMessage}</div>
      )}
      <section className="segmented-audios">
        <h3>Segmented Audios</h3>
        {segmentedAudios.length === 0 ? (
          <p>No segmented audio yet. Upload your first file!</p>
        ) : (
          <ul>
            {segmentedAudios.map((seg, idx) => (
              <li key={idx}>
                <strong>{seg.sentence}</strong>
                <span style={{ marginLeft: '10px', color: '#888' }}>
                  ({seg.audio_filename} saved)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};