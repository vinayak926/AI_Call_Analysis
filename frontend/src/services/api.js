// // src/services/api.js
// import axios from 'axios';

// const API = axios.create({
//   baseURL: 'http://localhost:5001/api',
// });

// // Har request mein token automatically attach hoga
// API.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // ── Audio Recordings ──────────────────────────────────────────

// // Upload a single audio file
// export const uploadAudioFile = async (file, title = "", notes = "") => {
//   const formData = new FormData();
//   formData.append("audioFile", file);
//   formData.append("title", title);
//   formData.append("notes", notes);

//   const res = await API.post("/audio/upload", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   return res.data;
// };

// // Get list of all recordings
// export const getRecordings = async () => {
//   const res = await API.get("/audio");
//   return res.data;
// };

// // Get single recording metadata
// export const getRecordingById = async (id) => {
//   const res = await API.get(`/audio/${id}`);
//   return res.data;
// };

// // Get the stream URL for a recording (used as <audio src="...">)
// // We build the URL manually so the browser can request it with the token
// export const getAudioStreamUrl = (id) => {
//   const token = localStorage.getItem("token");
//   return `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/audio/${id}/stream?token=${token}`;
// };

// // Delete a recording
// export const deleteRecording = async (id) => {
//   const res = await API.delete(`/audio/${id}`);
//   return res.data;
// };

// export default API;
// src/services/api.js
import axios from "axios";

// BUG FIX: baseURL was hardcoded to 'http://localhost:5001/api'.
// This breaks in any non-local environment. Read from env var with
// the hardcoded value as a safe fallback for local development.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:5001/api",
  withCredentials: false,
});

// ── Request interceptor — attach JWT ──────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle global 401 ─────────────────────
// BUG FIX: No response interceptor existed. When a JWT expired the app
// would show cryptic errors on every page instead of redirecting to
// login. Now any 401 clears storage and redirects automatically.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — force logout
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on a public page
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register") &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Call (main upload flow) API ───────────────────────────────────
// BUG FIX: These were missing entirely — CallsPage and CallDetailPage
// call /calls/* endpoints but there were no corresponding exported
// helpers in api.js, forcing pages to use the raw API instance
// inconsistently without proper error handling wrappers.

export const uploadCalls = async (files) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("audioFiles", f));
  const res = await API.post("/calls/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getCalls = async () => {
  const res = await API.get("/calls");
  return res.data;
};

export const getCallById = async (id) => {
  const res = await API.get(`/calls/${id}`);
  return res.data;
};

export const getCallStatus = async (id) => {
  const res = await API.get(`/calls/${id}/status`);
  return res.data;
};

// ── Audio Recordings API ──────────────────────────────────────────

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

export const getRecordings = async () => {
  const res = await API.get("/audio");
  return res.data;
};

export const getRecordingById = async (id) => {
  const res = await API.get(`/audio/${id}`);
  return res.data;
};

// Build stream URL with token in query string (browser <audio> tag
// cannot set Authorization headers, so token goes in query param)
export const getAudioStreamUrl = (id) => {
  const token = localStorage.getItem("token");
  const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
  return `${base}/api/audio/${id}/stream?token=${token}`;
};

export const deleteRecording = async (id) => {
  const res = await API.delete(`/audio/${id}`);
  return res.data;
};

// ── Analysis API ──────────────────────────────────────────────────

export const triggerAnalysis = async (audioRecordingId) => {
  const res = await API.post(`/analysis/process/${audioRecordingId}`);
  return res.data;
};

export const getAnalysisStatus = async (audioRecordingId) => {
  const res = await API.get(`/analysis/${audioRecordingId}/status`);
  return res.data;
};

export const getAnalysis = async (audioRecordingId) => {
  const res = await API.get(`/analysis/${audioRecordingId}`);
  return res.data;
};

export default API;