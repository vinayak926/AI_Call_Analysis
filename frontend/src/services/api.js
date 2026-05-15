// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Har request mein token automatically attach hoga
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Audio Recordings ──────────────────────────────────────────

// Upload a single audio file
export const uploadAudioFile = async (file, title = "", notes = "") => {
  const formData = new FormData();
  formData.append("audioFile", file);
  formData.append("title", title);
  formData.append("notes", notes);

  const res = await API.post("/audio/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Get list of all recordings
export const getRecordings = async () => {
  const res = await API.get("/audio");
  return res.data;
};

// Get single recording metadata
export const getRecordingById = async (id) => {
  const res = await API.get(`/audio/${id}`);
  return res.data;
};

// Get the stream URL for a recording (used as <audio src="...">)
// We build the URL manually so the browser can request it with the token
export const getAudioStreamUrl = (id) => {
  const token = localStorage.getItem("token");
  return `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/audio/${id}/stream?token=${token}`;
};

// Delete a recording
export const deleteRecording = async (id) => {
  const res = await API.delete(`/audio/${id}`);
  return res.data;
};

export default API;
