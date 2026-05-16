// src/pages/UploadPage.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileAudio, CheckCircle, AlertCircle, Loader, X, ArrowRight } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Layout/Navbar';

const ALLOWED_EXTS = ['.mp3', '.wav', '.m4a'];
const ALLOWED_MIME = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];

function isAudioFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return ALLOWED_EXTS.includes(ext) || ALLOWED_MIME.includes(file.type);
}

export default function UploadPage() {
  const [files, setFiles]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults]   = useState([]);
  const [error, setError]       = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(isAudioFile);
    if (valid.length < incoming.length) {
      setError(`Some files were skipped. Only MP3, WAV, and M4A are allowed.`);
    } else {
      setError(null);
    }
    setFiles(prev => [...prev, ...valid]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    files.forEach(f => formData.append('audioFiles', f));

    try {
      const res = await API.post('/calls/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(res.data.calls || []);
      setFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fmtSize = (bytes) => {
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <main style={{ flex: 1, marginLeft: '240px', padding: '40px', maxWidth: 'calc(100vw - 240px)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* Header */}
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Upload Call Recordings
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px' }}>
            Supported formats: MP3, WAV, M4A — max 100 MB per file
          </p>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? '#6366f1' : '#cbd5e1'}`,
              borderRadius: '20px',
              padding: '56px 32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#eef2ff' : '#fff',
              transition: 'all 0.2s',
              marginBottom: '24px',
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: dragOver ? '#e0e7ff' : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              transition: 'all 0.2s',
            }}>
              <Upload size={28} color={dragOver ? '#6366f1' : '#94a3b8'} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: dragOver ? '#6366f1' : '#0f172a', margin: '0 0 6px' }}>
              {dragOver ? 'Drop files here' : 'Drag & drop audio files here'}
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              or click to browse · MP3, WAV, M4A accepted
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".mp3,.wav,.m4a"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {files.map((file, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', padding: '14px 16px',
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileAudio size={18} color="#6366f1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                      {fmtSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '6px', display: 'flex' }}
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                  background: uploading ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: uploading ? '#94a3b8' : '#fff',
                  fontWeight: '700', fontSize: '15px', cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: 'inherit', marginTop: '4px',
                  boxShadow: uploading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {uploading
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>
                  : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '12px', padding: '14px 16px',
              color: '#dc2626', fontSize: '14px', fontWeight: '500',
              marginBottom: '16px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Success */}
          {results.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <CheckCircle size={18} color="#16a34a" />
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#15803d' }}>
                  {results.length} file{results.length > 1 ? 's' : ''} uploaded successfully!
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {results.map(call => (
                  <div key={call._id} style={{ fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileAudio size={14} />
                    <span style={{ fontWeight: '600' }}>{call.originalFileName}</span>
                    <span style={{ color: '#4ade80' }}>·</span>
                    <span>Pending analysis</span>
                  </div>
                ))}
              </div>
              <Link
                to="/calls"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '10px',
                  background: '#16a34a', color: '#fff',
                  fontWeight: '700', fontSize: '13px', textDecoration: 'none',
                }}
              >
                Go to Calls <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) { main { margin-left: 0 !important; padding: 16px !important; } }
      `}</style>
    </div>
  );
}