// src/pages/counselor/CounselorUploadPage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import {
    LayoutDashboard, Phone, Mic, Upload,
    FileAudio, CheckCircle, AlertCircle, Loader, X,
} from 'lucide-react';

const COUNSELOR_NAV = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/calls', label: 'My Calls', icon: Phone },
    { path: '/recordings', label: 'Recordings', icon: Mic },
    { path: '/upload', label: 'Upload', icon: Upload },
];

const ALLOWED_EXTS = ['.mp3', '.wav', '.m4a'];
const ALLOWED_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];

const isAudio = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return ALLOWED_EXTS.includes(ext) || ALLOWED_MIME.includes(file.type);
};

export default function CounselorUploadPage() {
    const navigate = useNavigate();
    const inputRef = useRef();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [progress, setProgress] = useState(0);

    const addFiles = (incoming) => {
        const valid = Array.from(incoming).filter(isAudio);
        const invalid = Array.from(incoming).length - valid.length;
        if (invalid > 0) setError(`${invalid} file(s) skipped — only MP3, WAV, M4A allowed.`);
        else setError(null);
        setFiles(prev => [...prev, ...valid]);
    };

    const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

    const handleUpload = async () => {
        if (!files.length) return;
        setUploading(true); setError(null); setResults([]); setProgress(0);
        const formData = new FormData();
        files.forEach(f => formData.append('audioFiles', f));
        try {
            const res = await API.post('/calls/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
            });
            setResults(res.data.calls || []);
            setFiles([]);
        } catch (e) {
            setError(e.response?.data?.message || 'Upload failed. Please try again.');
        } finally { setUploading(false); }
    };

    const totalSizeMB = files.reduce((s, f) => s + f.size / 1024 / 1024, 0).toFixed(1);

    return (
        <AppLayout navItems={COUNSELOR_NAV} panelLabel="My Panel">
            <div style={{ padding: '32px 40px' }}>
                <div style={{ maxWidth: '680px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Upload Call Recordings</h1>
                    <p style={{ color: '#8a8480', fontSize: '14px', margin: '0 0 28px' }}>MP3, WAV, M4A — up to 100 MB per file</p>

                    {/* Drop Zone */}
                    <div
                        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onClick={() => inputRef.current.click()}
                        style={{
                            border: `2px dashed ${dragOver ? '#6366f1' : '#e8e3da'}`,
                            borderRadius: '20px',
                            padding: '52px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: dragOver ? '#eef2ff' : 'white',
                            transition: 'all .2s',
                            marginBottom: '20px',
                        }}
                    >
                        <Upload size={36} style={{ color: dragOver ? '#6366f1' : '#d4d0cc', marginBottom: '14px' }} />
                        <p style={{ fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', fontSize: '15px' }}>
                            Drop audio files here, or click to browse
                        </p>
                        <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>MP3 · WAV · M4A · up to 100 MB each</p>
                        <input ref={inputRef} type="file" multiple accept=".mp3,.wav,.m4a"
                            onChange={e => addFiles(e.target.files)} style={{ display: 'none' }} />
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <p style={{ fontWeight: '700', fontSize: '13px', color: '#1a1a1a', margin: 0 }}>
                                    {files.length} file{files.length > 1 ? 's' : ''} selected · {totalSizeMB} MB total
                                </p>
                                <button onClick={() => setFiles([])} style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {files.map((file, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', border: '1px solid #e8e3da', borderRadius: '12px', padding: '12px 14px' }}>
                                        <FileAudio size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                                            <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '2px' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Progress */}
                            {uploading && (
                                <div style={{ marginTop: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#6366f1' }}>Uploading…</span>
                                        <span style={{ fontSize: '12px', color: '#aaa' }}>{progress}%</span>
                                    </div>
                                    <div style={{ background: '#f0ece6', borderRadius: '50px', height: '6px' }}>
                                        <div style={{ width: `${progress}%`, height: '6px', borderRadius: '50px', background: '#6366f1', transition: 'width .3s' }} />
                                    </div>
                                </div>
                            )}

                            <button onClick={handleUpload} disabled={uploading}
                                style={{ width: '100%', marginTop: '16px', padding: '14px', background: uploading ? '#e8e3da' : '#111', color: uploading ? '#aaa' : 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '15px', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {uploading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</> : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                            <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
                        </div>
                    )}

                    {/* Success */}
                    {results.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <CheckCircle size={18} style={{ color: '#16a34a' }} />
                                    <span style={{ fontWeight: '700', color: '#15803d', fontSize: '14px' }}>{results.length} file{results.length > 1 ? 's' : ''} uploaded successfully!</span>
                                </div>
                                {results.map(call => (
                                    <div key={call._id} style={{ fontSize: '12px', color: '#166534', padding: '4px 0', borderTop: '1px solid #bbf7d0' }}>
                                        ✓ {call.originalFileName} — <span style={{ fontWeight: '700' }}>pending analysis</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => navigate('/calls')}
                                style={{ width: '100%', padding: '13px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                View My Calls →
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </AppLayout>
    );
}
