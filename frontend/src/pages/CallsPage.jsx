
// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   Phone,
//   Search,
//   Zap,
//   Loader,
//   RefreshCw,
//   FileAudio,
//   Clock,
// } from "lucide-react";
// import API from "../services/api";
// import Navbar from "../components/Layout/Navbar";

// const statusConfig = {
//   pending: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
//   processing: { label: "Processing", color: "#2563eb", bg: "#eff6ff" },
//   completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
//   failed: { label: "Failed", color: "#dc2626", bg: "#fef2f2" },
// };

// const sentimentColors = {
//   Positive: { color: "#16a34a", bg: "#f0fdf4" },
//   Negative: { color: "#dc2626", bg: "#fef2f2" },
//   Neutral: { color: "#d97706", bg: "#fffbeb" },
// };

// export default function CallsPage() {
//   const [calls, setCalls] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [analysingId, setAnalysingId] = useState(null);

//   const fetchCalls = async () => {
//     setLoading(true);
//     try {
//       const res = await API.get("/calls");
//       setCalls(res.data.calls || []);
//       setError(null);
//     } catch (err) {
//       setError("Failed to load calls.");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCalls();
//   }, []);

//   // BUG FIX: handleAnalyse posted to /api/analysis/process/:callId but
//   // that endpoint expects an audioRecordingId (AudioRecording collection).
//   // The calls list uses the Call model, whose _id is different from
//   // AudioRecording._id. The audio analyse route (/api/audio/:id/analyse)
//   // also expects an AudioRecording _id.
//   //
//   // For the MVP/offline flow (no actual AI processing yet), we optimistically
//   // update the UI and then refetch. When the AI pipeline is wired up, the
//   // backend can enqueue the callId directly in callController.uploadCalls.
//   // For now we post to the most appropriate endpoint available.
//   // Trigger analysis on a Call document via the correct endpoint
//   const handleAnalyse = async (callId) => {
//     setAnalysingId(callId);
//     try {
//       await API.post(`/calls/${callId}/analyse`);
//       // Poll for completion every 4s then refresh
//       const poll = setInterval(async () => {
//         try {
//           const res = await API.get(`/calls/${callId}/status`);
//           const s = res.data.status;
//           if (s === 'completed' || s === 'failed') {
//             clearInterval(poll);
//             setAnalysingId(null);
//             fetchCalls();
//           }
//         } catch {
//           clearInterval(poll);
//           setAnalysingId(null);
//         }
//       }, 4000);
//     } catch (err) {
//       console.error('Analysis trigger error:', err.response?.data?.message || err.message);
//       alert(err.response?.data?.message || 'Could not start analysis.');
//       setAnalysingId(null);
//     }
//   };

//   // ── Filter logic ─────────────────────────────────────────────────
//   const filteredCalls = calls.filter((call) => {
//     const matchStatus =
//       statusFilter === "all" || call.status === statusFilter;
//     const q = searchQuery.toLowerCase();
//     const matchSearch =
//       !q ||
//       call.originalFileName?.toLowerCase().includes(q) ||
//       call.uploadedBy?.fullName?.toLowerCase().includes(q) ||
//       call.sentiment?.toLowerCase().includes(q) ||
//       call.studentName?.toLowerCase().includes(q) ||
//       call.counsellorName?.toLowerCase().includes(q);
//     return matchStatus && matchSearch;
//   });

//   const statusCounts = {
//     all: calls.length,
//     pending: calls.filter((c) => c.status === "pending").length,
//     completed: calls.filter((c) => c.status === "completed").length,
//     failed: calls.filter((c) => c.status === "failed").length,
//   };

//   const formatDuration = (seconds) => {
//     if (!seconds) return "—";
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}:${String(s).padStart(2, "0")}`;
//   };

//   return (
//     <div style={{ display: "flex", minHeight: "100vh" }}>
//       <Navbar />
//       <div
//         style={{ flex: 1, background: "#f8f7f4", minHeight: "100vh", marginLeft: "240px" }}
//       >
//         <div style={{ padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" }}>
//           {/* ── Header ─────────────────────────────────────────── */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "24px",
//               flexWrap: "wrap",
//               gap: "12px",
//             }}
//           >
//             <div>
//               <h1
//                 style={{
//                   fontSize: "26px",
//                   fontWeight: "800",
//                   color: "#1a1a1a",
//                   letterSpacing: "-0.02em",
//                   margin: "0 0 4px",
//                 }}
//               >
//                 Call Records
//               </h1>
//               <p style={{ fontSize: "14px", color: "#8a8480", margin: 0 }}>
//                 {calls.length} total · {statusCounts.completed} analysed
//               </p>
//             </div>
//             <div style={{ display: "flex", gap: "10px" }}>
//               <button
//                 onClick={fetchCalls}
//                 disabled={loading}
//                 style={{
//                   padding: "10px 16px",
//                   background: "white",
//                   border: "1px solid #e8e3da",
//                   borderRadius: "12px",
//                   cursor: "pointer",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "6px",
//                   fontSize: "13px",
//                   fontWeight: "600",
//                   color: "#6b6560",
//                   fontFamily: "inherit",
//                 }}
//               >
//                 <RefreshCw
//                   size={14}
//                   style={
//                     loading ? { animation: "spin 1s linear infinite" } : {}
//                   }
//                 />
//                 Refresh
//               </button>
//               <Link
//                 to="/upload"
//                 style={{
//                   padding: "10px 20px",
//                   background: "#111",
//                   color: "white",
//                   borderRadius: "12px",
//                   fontWeight: "700",
//                   fontSize: "13px",
//                   textDecoration: "none",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "6px",
//                 }}
//               >
//                 + Upload Calls
//               </Link>
//             </div>
//           </div>

//           {/* ── Status Filter Tabs ─────────────────────────────── */}
//           <div
//             style={{
//               display: "flex",
//               gap: "8px",
//               marginBottom: "20px",
//               flexWrap: "wrap",
//             }}
//           >
//             {["all", "pending", "completed", "failed"].map((s) => (
//               <button
//                 key={s}
//                 onClick={() => setStatusFilter(s)}
//                 style={{
//                   padding: "7px 16px",
//                   borderRadius: "10px",
//                   border: "1px solid",
//                   borderColor:
//                     statusFilter === s ? "#111" : "#e8e3da",
//                   background: statusFilter === s ? "#111" : "white",
//                   color: statusFilter === s ? "white" : "#6b6560",
//                   fontSize: "13px",
//                   fontWeight: "600",
//                   cursor: "pointer",
//                   fontFamily: "inherit",
//                 }}
//               >
//                 {s.charAt(0).toUpperCase() + s.slice(1)} (
//                 {statusCounts[s] ?? 0})
//               </button>
//             ))}
//           </div>

//           {/* ── Search ────────────────────────────────────────── */}
//           <div style={{ position: "relative", marginBottom: "24px" }}>
//             <Search
//               size={15}
//               style={{
//                 position: "absolute",
//                 left: "14px",
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 color: "#8a8480",
//               }}
//             />
//             <input
//               type="text"
//               placeholder="Search by file name, student, counsellor, sentiment…"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               style={{
//                 width: "100%",
//                 padding: "11px 14px 11px 40px",
//                 border: "1px solid #e8e3da",
//                 borderRadius: "12px",
//                 fontSize: "14px",
//                 background: "white",
//                 color: "#1a1a1a",
//                 fontFamily: "inherit",
//                 outline: "none",
//                 boxSizing: "border-box",
//               }}
//             />
//           </div>

//           {/* ── Error ─────────────────────────────────────────── */}
//           {error && (
//             <div
//               style={{
//                 background: "#fef2f2",
//                 border: "1px solid #fca5a5",
//                 borderRadius: "12px",
//                 padding: "14px 18px",
//                 color: "#dc2626",
//                 fontSize: "14px",
//                 marginBottom: "20px",
//               }}
//             >
//               {error}
//             </div>
//           )}

//           {/* ── Loading ───────────────────────────────────────── */}
//           {loading && (
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 padding: "60px",
//               }}
//             >
//               <Loader
//                 size={28}
//                 style={{
//                   animation: "spin 1s linear infinite",
//                   color: "#6366f1",
//                 }}
//               />
//             </div>
//           )}

//           {/* BUG FIX: Original had no empty-state UI. When the calls array
//               was empty (first-time user or all filtered out) the page
//               showed a blank table with no guidance, making it look broken. */}
//           {!loading && !error && filteredCalls.length === 0 && (
//             <div
//               style={{
//                 textAlign: "center",
//                 padding: "80px 20px",
//                 background: "white",
//                 borderRadius: "20px",
//                 border: "1px solid #e8e3da",
//               }}
//             >
//               <FileAudio
//                 size={40}
//                 style={{ color: "#d4d0cc", marginBottom: "16px" }}
//               />
//               <p
//                 style={{
//                   fontSize: "16px",
//                   fontWeight: "700",
//                   color: "#1a1a1a",
//                   margin: "0 0 8px",
//                 }}
//               >
//                 {searchQuery || statusFilter !== "all"
//                   ? "No calls match your filters"
//                   : "No call recordings yet"}
//               </p>
//               <p style={{ fontSize: "13px", color: "#8a8480", margin: "0 0 20px" }}>
//                 {searchQuery || statusFilter !== "all"
//                   ? "Try adjusting your search or filter."
//                   : "Upload your first call recording to get started."}
//               </p>
//               {!searchQuery && statusFilter === "all" && (
//                 <Link
//                   to="/upload"
//                   style={{
//                     display: "inline-flex",
//                     alignItems: "center",
//                     gap: "8px",
//                     padding: "12px 24px",
//                     background: "#111",
//                     color: "white",
//                     borderRadius: "12px",
//                     fontWeight: "700",
//                     fontSize: "14px",
//                     textDecoration: "none",
//                   }}
//                 >
//                   + Upload Calls
//                 </Link>
//               )}
//             </div>
//           )}

//           {/* ── Table ─────────────────────────────────────────── */}
//           {!loading && filteredCalls.length > 0 && (
//             <div
//               style={{
//                 background: "white",
//                 border: "1px solid #e8e3da",
//                 borderRadius: "20px",
//                 overflow: "hidden",
//               }}
//             >
//               <table
//                 style={{
//                   width: "100%",
//                   borderCollapse: "collapse",
//                   fontSize: "13px",
//                 }}
//               >
//                 <thead>
//                   <tr
//                     style={{
//                       background: "#f8f7f4",
//                       borderBottom: "1px solid #e8e3da",
//                     }}
//                   >
//                     {[
//                       "File",
//                       "Uploaded By",
//                       "Duration",
//                       "Lead Score",
//                       "Sentiment",
//                       "Status",
//                       "Actions",
//                     ].map((h) => (
//                       <th
//                         key={h}
//                         style={{
//                           padding: "13px 18px",
//                           textAlign: "left",
//                           fontWeight: "700",
//                           color: "#6b6560",
//                           fontSize: "11px",
//                           textTransform: "uppercase",
//                           letterSpacing: "0.05em",
//                         }}
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredCalls.map((call, idx) => {
//                     const st =
//                       statusConfig[call.status] || statusConfig.pending;
//                     const snt = sentimentColors[call.sentiment];
//                     const canAnalyse =
//                       call.status === "pending" ||
//                       call.status === "failed";
//                     const isAnalysing = analysingId === call._id;

//                     return (
//                       <tr
//                         key={call._id}
//                         style={{
//                           borderBottom:
//                             idx < filteredCalls.length - 1
//                               ? "1px solid #f0ece6"
//                               : "none",
//                         }}
//                       >
//                         {/* File name */}
//                         <td style={{ padding: "16px 18px" }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               gap: "10px",
//                             }}
//                           >
//                             <div
//                               style={{
//                                 width: "34px",
//                                 height: "34px",
//                                 borderRadius: "10px",
//                                 background: "#f0ece6",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 flexShrink: 0,
//                               }}
//                             >
//                               <FileAudio size={16} style={{ color: "#8a8480" }} />
//                             </div>
//                             <div>
//                               <p
//                                 style={{
//                                   fontWeight: "700",
//                                   color: "#1a1a1a",
//                                   margin: 0,
//                                   fontSize: "13px",
//                                   maxWidth: "200px",
//                                   overflow: "hidden",
//                                   textOverflow: "ellipsis",
//                                   whiteSpace: "nowrap",
//                                 }}
//                               >
//                                 {call.originalFileName}
//                               </p>
//                               <p
//                                 style={{
//                                   fontSize: "11px",
//                                   color: "#8a8480",
//                                   margin: 0,
//                                 }}
//                               >
//                                 {new Date(call.createdAt).toLocaleDateString()}
//                               </p>
//                             </div>
//                           </div>
//                         </td>

//                         {/* Uploaded By */}
//                         <td
//                           style={{
//                             padding: "16px 18px",
//                             fontSize: "13px",
//                             color: "#6b6560",
//                           }}
//                         >
//                           {call.uploadedBy?.fullName || "—"}
//                         </td>

//                         {/* Duration */}
//                         <td
//                           style={{
//                             padding: "16px 18px",
//                             fontSize: "13px",
//                             color: "#6b6560",
//                           }}
//                         >
//                           <span
//                             style={{
//                               display: "inline-flex",
//                               alignItems: "center",
//                               gap: "4px",
//                             }}
//                           >
//                             <Clock size={12} style={{ opacity: 0.5 }} />
//                             {formatDuration(call.durationSeconds)}
//                           </span>
//                         </td>

//                         {/* Lead Score */}
//                         <td style={{ padding: "16px 18px" }}>
//                           {call.leadScore != null ? (
//                             <span
//                               style={{
//                                 display: "inline-flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 width: "32px",
//                                 height: "32px",
//                                 borderRadius: "10px",
//                                 fontWeight: "800",
//                                 fontSize: "14px",
//                                 background:
//                                   call.leadScore >= 7
//                                     ? "#f0fdf4"
//                                     : call.leadScore >= 4
//                                       ? "#fffbeb"
//                                       : "#fef2f2",
//                                 color:
//                                   call.leadScore >= 7
//                                     ? "#16a34a"
//                                     : call.leadScore >= 4
//                                       ? "#d97706"
//                                       : "#dc2626",
//                               }}
//                             >
//                               {call.leadScore}
//                             </span>
//                           ) : (
//                             <span style={{ color: "#d4d0cc", fontSize: "13px" }}>
//                               —
//                             </span>
//                           )}
//                         </td>

//                         {/* Sentiment */}
//                         <td style={{ padding: "16px 18px" }}>
//                           {snt ? (
//                             <span
//                               style={{
//                                 fontSize: "11px",
//                                 fontWeight: "700",
//                                 padding: "4px 12px",
//                                 borderRadius: "50px",
//                                 background: snt.bg,
//                                 color: snt.color,
//                               }}
//                             >
//                               {call.sentiment}
//                             </span>
//                           ) : (
//                             <span style={{ color: "#d4d0cc", fontSize: "13px" }}>
//                               —
//                             </span>
//                           )}
//                         </td>

//                         {/* Status */}
//                         <td style={{ padding: "16px 18px" }}>
//                           <span
//                             style={{
//                               background: st.bg,
//                               color: st.color,
//                               padding: "4px 12px",
//                               borderRadius: "50px",
//                               fontSize: "11px",
//                               fontWeight: "700",
//                             }}
//                           >
//                             {st.label}
//                           </span>
//                         </td>

//                         {/* Actions */}
//                         <td style={{ padding: "16px 18px" }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               gap: "8px",
//                               alignItems: "center",
//                             }}
//                           >
//                             <Link
//                               to={`/calls/${call._id}`}
//                               style={{
//                                 color: "#6366f1",
//                                 fontSize: "13px",
//                                 fontWeight: "700",
//                                 textDecoration: "none",
//                               }}
//                             >
//                               View →
//                             </Link>
//                             {canAnalyse && (
//                               <button
//                                 onClick={() => handleAnalyse(call._id)}
//                                 disabled={isAnalysing}
//                                 style={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                   gap: "5px",
//                                   padding: "6px 12px",
//                                   borderRadius: "8px",
//                                   background: isAnalysing
//                                     ? "#f0f0f0"
//                                     : "#6366f1",
//                                   color: isAnalysing ? "#999" : "white",
//                                   border: "none",
//                                   cursor: isAnalysing
//                                     ? "not-allowed"
//                                     : "pointer",
//                                   fontSize: "11px",
//                                   fontWeight: "700",
//                                   fontFamily: "inherit",
//                                 }}
//                               >
//                                 {isAnalysing ? (
//                                   <>
//                                     <Loader
//                                       size={12}
//                                       style={{
//                                         animation: "spin 1s linear infinite",
//                                       }}
//                                     />
//                                     Analysing…
//                                   </>
//                                 ) : (
//                                   <>
//                                     <Zap size={12} /> Analyse
//                                   </>
//                                 )}
//                               </button>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
//       </div>
//     </div>
//   );
// }

// // src/pages/CallsPage.jsx
// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Phone, Search, Zap, Loader, RefreshCw, FileAudio, Clock } from 'lucide-react';
// import API from '../services/api';
// import Navbar from '../components/Layout/Navbar';

// const statusConfig = {
//   pending:    { label: 'Pending',    color: '#d97706', bg: '#fffbeb' },
//   processing: { label: 'Processing', color: '#2563eb', bg: '#eff6ff' },
//   completed:  { label: 'Completed',  color: '#16a34a', bg: '#f0fdf4' },
//   failed:     { label: 'Failed',     color: '#dc2626', bg: '#fef2f2' },
// };

// const sentimentColors = {
//   Positive: { color: '#16a34a', bg: '#f0fdf4' },
//   Negative: { color: '#dc2626', bg: '#fef2f2' },
//   Neutral:  { color: '#d97706', bg: '#fffbeb' },
// };

// export default function CallsPage() {
//   const [calls, setCalls] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [analysingId, setAnalysingId] = useState(null);

//   const fetchCalls = async () => {
//     setLoading(true);
//     try {
//       const res = await API.get('/calls');
//       setCalls(res.data.calls || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load calls.');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchCalls(); }, []);

//   // ── Trigger AI analysis on a Call record ────────────
//   // The Call model stores analysis inline, but the
//   // processing happens via the analysis worker.
//   // We need a backend endpoint to process a Call.
//   // For now, let's just update status and show the detail page.
//   const handleAnalyse = async (callId) => {
//     setAnalysingId(callId);
//     try {
//       // Try the analysis endpoint (if backend supports it)
//       await API.post(`/analysis/process/${callId}`);
//     } catch (err) {
//       // Fallback: just navigate to detail page
//       console.error('Analysis trigger error:', err);
//     }
//     // Refresh after short delay
//     setTimeout(() => {
//       fetchCalls();
//       setAnalysingId(null);
//     }, 2500);
//   };

//   // ── Filter logic ────────────────────────────────────
//   const filteredCalls = calls.filter(call => {
//     const matchStatus = statusFilter === 'all' || call.status === statusFilter;
//     const q = searchQuery.toLowerCase();
//     const matchSearch = !q ||
//       call.originalFileName?.toLowerCase().includes(q) ||
//       call.uploadedBy?.fullName?.toLowerCase().includes(q) ||
//       call.sentiment?.toLowerCase().includes(q) ||
//       call.studentName?.toLowerCase().includes(q) ||
//       call.counsellorName?.toLowerCase().includes(q);
//     return matchStatus && matchSearch;
//   });

//   const statusCounts = {
//     all: calls.length,
//     pending: calls.filter(c => c.status === 'pending').length,
//     completed: calls.filter(c => c.status === 'completed').length,
//     failed: calls.filter(c => c.status === 'failed').length,
//   };

//   const formatDuration = (seconds) => {
//     if (!seconds) return '—';
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}:${String(s).padStart(2, '0')}`;
//   };

//   return (
//     <div style={{ display: 'flex', minHeight: '100vh' }}>
//       <Navbar />
//       <div className="sidebar-content" style={{ flex: 1, background: '#f8f7f4', minHeight: '100vh' }}>
//         <div style={{ padding: '32px 40px', maxWidth: '1100px', margin: '0 auto' }}>

//           {/* ── Header ──────────────────────────────────── */}
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
//             <div>
//               <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
//                 Call Records
//               </h1>
//               <p style={{ fontSize: '14px', color: '#8a8480', margin: 0 }}>
//                 {calls.length} total · {statusCounts.completed} analysed
//               </p>
//             </div>
//             <div style={{ display: 'flex', gap: '10px' }}>
//               <button onClick={fetchCalls} disabled={loading} style={{
//                 padding: '10px 16px', background: 'white', border: '1px solid #e8e3da',
//                 borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
//                 fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit',
//               }}>
//                 <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
//               </button>
//               <Link to="/upload" style={{
//                 padding: '10px 20px', background: '#111', color: 'white', borderRadius: '12px',
//                 fontWeight: '700', fontSize: '13px', textDecoration: 'none',
//                 display: 'flex', alignItems: 'center', gap: '6px',
//               }}>
//                 + Upload Calls
//               </Link>
//             </div>
//           </div>

//           {/* ── Filter Bar ──────────────────────────────── */}
//           <div style={{
//             background: 'white', borderRadius: '16px', border: '1px solid #e8e3da',
//             padding: '12px 16px', marginBottom: '20px',
//             display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
//           }}>
//             {/* Search */}
//             <div style={{
//               display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px',
//               background: '#f8f7f4', borderRadius: '10px', padding: '8px 12px',
//             }}>
//               <Search size={16} style={{ color: '#8a8480', flexShrink: 0 }} />
//               <input
//                 type="text"
//                 placeholder="Search by file, counsellor, student, sentiment..."
//                 value={searchQuery}
//                 onChange={e => setSearchQuery(e.target.value)}
//                 style={{
//                   border: 'none', outline: 'none', background: 'transparent', width: '100%',
//                   fontSize: '13px', color: '#1a1a1a', fontFamily: 'inherit',
//                 }}
//               />
//             </div>

//             {/* Status Tabs */}
//             <div style={{ display: 'flex', gap: '4px' }}>
//               {['all', 'pending', 'completed', 'failed'].map(key => (
//                 <button
//                   key={key}
//                   onClick={() => setStatusFilter(key)}
//                   style={{
//                     padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
//                     fontSize: '12px', fontWeight: '700', fontFamily: 'inherit',
//                     background: statusFilter === key ? '#111' : '#f8f7f4',
//                     color: statusFilter === key ? 'white' : '#6b6560',
//                     transition: 'all 0.15s',
//                   }}
//                 >
//                   {key.charAt(0).toUpperCase() + key.slice(1)} ({statusCounts[key]})
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ── Loading / Error ──────────────────────────── */}
//           {loading && (
//             <div style={{ padding: '60px 0', textAlign: 'center' }}>
//               <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '8px' }} />
//               <p style={{ color: '#8a8480', fontSize: '14px' }}>Loading calls...</p>
//             </div>
//           )}
//           {error && <div style={{ padding: '32px', color: '#dc2626', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

//           {/* ── Empty State ──────────────────────────────── */}
//           {!loading && !error && filteredCalls.length === 0 && (
//             <div style={{ textAlign: 'center', padding: '80px 0' }}>
//               <Phone size={40} style={{ margin: '0 auto 16px', color: '#d4d0cc' }} />
//               <p style={{ color: '#8a8480', fontSize: '15px', fontWeight: '600' }}>
//                 {calls.length === 0 ? 'No calls uploaded yet' : 'No calls match your filters'}
//               </p>
//               {calls.length === 0 && (
//                 <Link to="/upload" style={{ color: '#6366f1', fontSize: '14px', fontWeight: '700', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
//                   Upload your first recording →
//                 </Link>
//               )}
//             </div>
//           )}

//           {/* ── Calls Table ─────────────────────────────── */}
//           {!loading && !error && filteredCalls.length > 0 && (
//             <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
//               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                 <thead>
//                   <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e3da' }}>
//                     {['File', 'Uploaded By', 'Duration', 'Lead Score', 'Sentiment', 'Status', 'Actions'].map(h => (
//                       <th key={h} style={{
//                         padding: '14px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
//                         color: '#b0aca8', letterSpacing: '0.08em', textTransform: 'uppercase',
//                       }}>{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredCalls.map((call, i) => {
//                     const st = statusConfig[call.status] || statusConfig.pending;
//                     const snt = call.sentiment ? sentimentColors[call.sentiment] : null;
//                     const isAnalysing = analysingId === call._id;
//                     const canAnalyse = call.status === 'pending' || call.status === 'failed';

//                     return (
//                       <tr key={call._id} style={{ borderBottom: i < filteredCalls.length - 1 ? '1px solid #f0ece6' : 'none', transition: 'background 0.15s' }}
//                         onMouseEnter={e => e.currentTarget.style.background = '#fdfcfb'}
//                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//                       >
//                         {/* File */}
//                         <td style={{ padding: '16px 18px', maxWidth: '220px' }}>
//                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                             <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0ece6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                               <FileAudio size={15} style={{ color: '#8a8480' }} />
//                             </div>
//                             <div style={{ minWidth: 0 }}>
//                               <p style={{ fontWeight: '700', fontSize: '13px', color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                 {call.originalFileName}
//                               </p>
//                               <p style={{ fontSize: '11px', color: '#b0aca8', margin: '2px 0 0' }}>
//                                 {call.fileSizeMB ? `${call.fileSizeMB} MB` : ''} · {new Date(call.createdAt).toLocaleDateString()}
//                               </p>
//                             </div>
//                           </div>
//                         </td>

//                         {/* Uploaded By */}
//                         <td style={{ padding: '16px 18px', fontSize: '13px', color: '#6b6560' }}>
//                           {call.uploadedBy?.fullName || '—'}
//                         </td>

//                         {/* Duration */}
//                         <td style={{ padding: '16px 18px', fontSize: '13px', color: '#6b6560' }}>
//                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
//                             <Clock size={12} style={{ opacity: 0.5 }} />
//                             {formatDuration(call.durationSeconds)}
//                           </span>
//                         </td>

//                         {/* Lead Score */}
//                         <td style={{ padding: '16px 18px' }}>
//                           {call.leadScore != null ? (
//                             <span style={{
//                               display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//                               width: '32px', height: '32px', borderRadius: '10px', fontWeight: '800', fontSize: '14px',
//                               background: call.leadScore >= 7 ? '#f0fdf4' : call.leadScore >= 4 ? '#fffbeb' : '#fef2f2',
//                               color: call.leadScore >= 7 ? '#16a34a' : call.leadScore >= 4 ? '#d97706' : '#dc2626',
//                             }}>
//                               {call.leadScore}
//                             </span>
//                           ) : (
//                             <span style={{ color: '#d4d0cc', fontSize: '13px' }}>—</span>
//                           )}
//                         </td>

//                         {/* Sentiment */}
//                         <td style={{ padding: '16px 18px' }}>
//                           {snt ? (
//                             <span style={{
//                               fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '50px',
//                               background: snt.bg, color: snt.color,
//                             }}>
//                               {call.sentiment}
//                             </span>
//                           ) : (
//                             <span style={{ color: '#d4d0cc', fontSize: '13px' }}>—</span>
//                           )}
//                         </td>

//                         {/* Status */}
//                         <td style={{ padding: '16px 18px' }}>
//                           <span style={{
//                             background: st.bg, color: st.color,
//                             padding: '4px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: '700',
//                           }}>
//                             {st.label}
//                           </span>
//                         </td>

//                         {/* Actions */}
//                         <td style={{ padding: '16px 18px' }}>
//                           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                             <Link to={`/calls/${call._id}`} style={{
//                               color: '#6366f1', fontSize: '13px', fontWeight: '700', textDecoration: 'none',
//                             }}>
//                               View →
//                             </Link>
//                             {canAnalyse && (
//                               <button
//                                 onClick={() => handleAnalyse(call._id)}
//                                 disabled={isAnalysing}
//                                 style={{
//                                   display: 'flex', alignItems: 'center', gap: '5px',
//                                   padding: '6px 12px', borderRadius: '8px',
//                                   background: isAnalysing ? '#f0f0f0' : '#6366f1',
//                                   color: isAnalysing ? '#999' : 'white',
//                                   border: 'none', cursor: isAnalysing ? 'not-allowed' : 'pointer',
//                                   fontSize: '11px', fontWeight: '700', fontFamily: 'inherit',
//                                 }}
//                               >
//                                 {isAnalysing ? (
//                                   <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analysing...</>
//                                 ) : (
//                                   <><Zap size={12} /> Analyse</>
//                                 )}
//                               </button>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
//       </div>
//     </div>
//   );
// }
// src/pages/CallsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Search,
  Zap,
  Loader,
  RefreshCw,
  FileAudio,
  Clock,
} from "lucide-react";
import API from "../services/api";
import Navbar from "../components/Layout/Navbar";

const statusConfig = {
  pending: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  processing: { label: "Processing", color: "#2563eb", bg: "#eff6ff" },
  completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
  failed: { label: "Failed", color: "#dc2626", bg: "#fef2f2" },
};

const sentimentColors = {
  Positive: { color: "#16a34a", bg: "#f0fdf4" },
  Negative: { color: "#dc2626", bg: "#fef2f2" },
  Neutral: { color: "#d97706", bg: "#fffbeb" },
};

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysingId, setAnalysingId] = useState(null);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await API.get("/calls");
      setCalls(res.data.calls || []);
      setError(null);
    } catch (err) {
      setError("Failed to load calls.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // BUG FIX: handleAnalyse posted to /api/analysis/process/:callId but
  // that endpoint expects an audioRecordingId (AudioRecording collection).
  // The calls list uses the Call model, whose _id is different from
  // AudioRecording._id. The audio analyse route (/api/audio/:id/analyse)
  // also expects an AudioRecording _id.
  //
  // For the MVP/offline flow (no actual AI processing yet), we optimistically
  // update the UI and then refetch. When the AI pipeline is wired up, the
  // backend can enqueue the callId directly in callController.uploadCalls.
  // For now we post to the most appropriate endpoint available.
  // Trigger analysis on a Call document via the correct endpoint
  const handleAnalyse = async (callId) => {
    setAnalysingId(callId);
    try {
      await API.post(`/calls/${callId}/analyse`);
      // Poll for completion every 4s then refresh
      const poll = setInterval(async () => {
        try {
          const res = await API.get(`/calls/${callId}/status`);
          const s = res.data.status;
          if (s === 'completed' || s === 'failed') {
            clearInterval(poll);
            setAnalysingId(null);
            fetchCalls();
          }
        } catch {
          clearInterval(poll);
          setAnalysingId(null);
        }
      }, 4000);
    } catch (err) {
      console.error('Analysis trigger error:', err.response?.data?.message || err.message);
      alert(err.response?.data?.message || 'Could not start analysis.');
      setAnalysingId(null);
    }
  };

  // ── Filter logic ─────────────────────────────────────────────────
  const filteredCalls = calls.filter((call) => {
    const matchStatus =
      statusFilter === "all" || call.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      call.originalFileName?.toLowerCase().includes(q) ||
      call.uploadedBy?.fullName?.toLowerCase().includes(q) ||
      call.sentiment?.toLowerCase().includes(q) ||
      call.studentName?.toLowerCase().includes(q) ||
      call.counsellorName?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const statusCounts = {
    all: calls.length,
    pending: calls.filter((c) => c.status === "pending").length,
    completed: calls.filter((c) => c.status === "completed").length,
    failed: calls.filter((c) => c.status === "failed").length,
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Navbar />
      <div
        style={{ flex: 1, background: "#f8f7f4", minHeight: "100vh", marginLeft: "240px" }}
      >
        <div style={{ padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" }}>
          {/* ── Header ─────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#1a1a1a",
                  letterSpacing: "-0.02em",
                  margin: "0 0 4px",
                }}
              >
                Call Records
              </h1>
              <p style={{ fontSize: "14px", color: "#8a8480", margin: 0 }}>
                {calls.length} total · {statusCounts.completed} analysed
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={fetchCalls}
                disabled={loading}
                style={{
                  padding: "10px 16px",
                  background: "white",
                  border: "1px solid #e8e3da",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#6b6560",
                  fontFamily: "inherit",
                }}
              >
                <RefreshCw
                  size={14}
                  style={
                    loading ? { animation: "spin 1s linear infinite" } : {}
                  }
                />
                Refresh
              </button>
              <Link
                to="/upload"
                style={{
                  padding: "10px 20px",
                  background: "#111",
                  color: "white",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "13px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                + Upload Calls
              </Link>
            </div>
          </div>

          {/* ── Status Filter Tabs ─────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            {["all", "pending", "completed", "failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor:
                    statusFilter === s ? "#111" : "#e8e3da",
                  background: statusFilter === s ? "#111" : "white",
                  color: statusFilter === s ? "white" : "#6b6560",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} (
                {statusCounts[s] ?? 0})
              </button>
            ))}
          </div>

          {/* ── Search ────────────────────────────────────────── */}
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8a8480",
              }}
            />
            <input
              type="text"
              placeholder="Search by file name, student, counsellor, sentiment…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px 11px 40px",
                border: "1px solid #e8e3da",
                borderRadius: "12px",
                fontSize: "14px",
                background: "white",
                color: "#1a1a1a",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* ── Error ─────────────────────────────────────────── */}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "12px",
                padding: "14px 18px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Loading ───────────────────────────────────────── */}
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px",
              }}
            >
              <Loader
                size={28}
                style={{
                  animation: "spin 1s linear infinite",
                  color: "#6366f1",
                }}
              />
            </div>
          )}

          {/* BUG FIX: Original had no empty-state UI. When the calls array
              was empty (first-time user or all filtered out) the page
              showed a blank table with no guidance, making it look broken. */}
          {!loading && !error && filteredCalls.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "white",
                borderRadius: "20px",
                border: "1px solid #e8e3da",
              }}
            >
              <FileAudio
                size={40}
                style={{ color: "#d4d0cc", marginBottom: "16px" }}
              />
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1a1a1a",
                  margin: "0 0 8px",
                }}
              >
                {searchQuery || statusFilter !== "all"
                  ? "No calls match your filters"
                  : "No call recordings yet"}
              </p>
              <p style={{ fontSize: "13px", color: "#8a8480", margin: "0 0 20px" }}>
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : "Upload your first call recording to get started."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Link
                  to="/upload"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: "#111",
                    color: "white",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                >
                  + Upload Calls
                </Link>
              )}
            </div>
          )}

          {/* ── Table ─────────────────────────────────────────── */}
          {!loading && filteredCalls.length > 0 && (
            <div
              style={{
                background: "white",
                border: "1px solid #e8e3da",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8f7f4",
                      borderBottom: "1px solid #e8e3da",
                    }}
                  >
                    {[
                      "File",
                      "Uploaded By",
                      "Duration",
                      "Lead Score",
                      "Sentiment",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "13px 18px",
                          textAlign: "left",
                          fontWeight: "700",
                          color: "#6b6560",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call, idx) => {
                    const st =
                      statusConfig[call.status] || statusConfig.pending;
                    const snt = sentimentColors[call.sentiment];
                    const canAnalyse =
                      call.status === "pending" ||
                      call.status === "failed";
                    const isAnalysing = analysingId === call._id;

                    return (
                      <tr
                        key={call._id}
                        style={{
                          borderBottom:
                            idx < filteredCalls.length - 1
                              ? "1px solid #f0ece6"
                              : "none",
                        }}
                      >
                        {/* File name */}
                        <td style={{ padding: "16px 18px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "10px",
                                background: "#f0ece6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <FileAudio size={16} style={{ color: "#8a8480" }} />
                            </div>
                            <div>
                              <p
                                style={{
                                  fontWeight: "700",
                                  color: "#1a1a1a",
                                  margin: 0,
                                  fontSize: "13px",
                                  maxWidth: "200px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {call.originalFileName}
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#8a8480",
                                  margin: 0,
                                }}
                              >
                                {new Date(call.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Uploaded By */}
                        <td
                          style={{
                            padding: "16px 18px",
                            fontSize: "13px",
                            color: "#6b6560",
                          }}
                        >
                          {call.uploadedBy?.fullName || "—"}
                        </td>

                        {/* Duration */}
                        <td
                          style={{
                            padding: "16px 18px",
                            fontSize: "13px",
                            color: "#6b6560",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Clock size={12} style={{ opacity: 0.5 }} />
                            {formatDuration(call.durationSeconds)}
                          </span>
                        </td>

                        {/* Lead Score */}
                        <td style={{ padding: "16px 18px" }}>
                          {call.leadScore != null ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                borderRadius: "10px",
                                fontWeight: "800",
                                fontSize: "14px",
                                background:
                                  call.leadScore >= 7
                                    ? "#f0fdf4"
                                    : call.leadScore >= 4
                                      ? "#fffbeb"
                                      : "#fef2f2",
                                color:
                                  call.leadScore >= 7
                                    ? "#16a34a"
                                    : call.leadScore >= 4
                                      ? "#d97706"
                                      : "#dc2626",
                              }}
                            >
                              {call.leadScore}
                            </span>
                          ) : (
                            <span style={{ color: "#d4d0cc", fontSize: "13px" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Sentiment */}
                        <td style={{ padding: "16px 18px" }}>
                          {snt ? (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "4px 12px",
                                borderRadius: "50px",
                                background: snt.bg,
                                color: snt.color,
                              }}
                            >
                              {call.sentiment}
                            </span>
                          ) : (
                            <span style={{ color: "#d4d0cc", fontSize: "13px" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "16px 18px" }}>
                          <span
                            style={{
                              background: st.bg,
                              color: st.color,
                              padding: "4px 12px",
                              borderRadius: "50px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {st.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "16px 18px" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <Link
                              to={`/calls/${call._id}`}
                              style={{
                                color: "#6366f1",
                                fontSize: "13px",
                                fontWeight: "700",
                                textDecoration: "none",
                              }}
                            >
                              View →
                            </Link>
                            {canAnalyse && (
                              <button
                                onClick={() => handleAnalyse(call._id)}
                                disabled={isAnalysing}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  background: isAnalysing
                                    ? "#f0f0f0"
                                    : "#6366f1",
                                  color: isAnalysing ? "#999" : "white",
                                  border: "none",
                                  cursor: isAnalysing
                                    ? "not-allowed"
                                    : "pointer",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  fontFamily: "inherit",
                                }}
                              >
                                {isAnalysing ? (
                                  <>
                                    <Loader
                                      size={12}
                                      style={{
                                        animation: "spin 1s linear infinite",
                                      }}
                                    />
                                    Analysing…
                                  </>
                                ) : (
                                  <>
                                    <Zap size={12} /> Analyse
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}