// src/pages/UploadPage.jsx
import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Layout/Navbar';

export default function UploadPage() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const inputRef = useRef();

    const ALLOWED = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files).filter(f => ALLOWED.includes(f.type));
        setFiles(prev => [...prev, ...dropped]);
    };

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selected]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setError(null);
        setResults([]);

        const formData = new FormData();
        files.forEach(f => formData.append('audioFiles', f));

        try {
            const res = await API.post('/calls/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResults(res.data.calls);
            setFiles([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Navbar />
            <div className="md:ml-[240px]" style={{ flex: 1, background: '#f8f7f4', minHeight: '100vh', padding: '32px 40px' }}>
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Call Recordings</h1>
                    <p className="text-sm text-gray-500 mb-8">Supported formats: MP3, WAV, M4A — max 100 MB per file</p>

                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => inputRef.current.click()}
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                        <Upload className="mx-auto mb-4 text-gray-400" size={36} />
                        <p className="text-gray-600 font-medium">Drop audio files here, or click to browse</p>
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            accept=".mp3,.wav,.m4a"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Selected Files */}
                    {files.length > 0 && (
                        <div className="mt-6 space-y-3">
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <File size={18} className="text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 text-xs font-semibold">Remove</button>
                                </div>
                            ))}

                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full mt-4 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {uploading ? <><Loader size={16} className="animate-spin" /> Uploading...</> : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <AlertCircle size={16} /> <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Success */}
                    {results.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h3 className="font-semibold text-gray-900">Upload Successful</h3>
                            {results.map((call) => (
                                <div key={call._id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                    <CheckCircle size={16} className="text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{call.originalFileName}</p>
                                        <p className="text-xs text-gray-500">Status: <span className="text-yellow-600 font-semibold">{call.status}</span> — AI processing will begin shortly.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}