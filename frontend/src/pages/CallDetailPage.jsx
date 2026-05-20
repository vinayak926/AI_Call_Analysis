// src/pages/CallDetailPage.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Zap, Loader, RefreshCw, CheckCircle, XCircle,
  Clock, AlertTriangle, RotateCcw, FileText, User, BookOpen,
  MapPin, TrendingUp, MessageSquare, PhoneCall, Star
} from 'lucide-react';
import API from '../services/api';
import AppLayout from '../components/Layout/AppLayout';
import AudioPlayer from '../components/AudioPlayer';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Phone, Mic, Upload } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getCallStreamUrl = (id) => {
  const token = localStorage.getItem('token');
  return `${BASE}/api/calls/${id}/stream?token=${token}`;
};

const sentimentStyles = {
  Positive: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Negative: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Neutral:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
};

const statusStyles = {
  completed:  { bg: '#f0fdf4', color: '#16a34a' },
  processing: { bg: '#eff6ff', color: '#2563eb' },
  failed:     { bg: '#fef2f2', color: '#dc2626' },
  pending:    { bg: '#fffbeb', color: '#d97706' },
};

const scoreColor = (val, max = 10) => {
  const pct = val / max;
  if (pct >= 0.7) return '#16a34a';
  if (pct >= 0.4) return '#f59e0b';
  return '#ef4444';
};

const fmt = (secs) => {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

// ── Sub-components ────────────────────────────────────────────────────

function Badge({ label, style }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: '999px',
      fontSize: '12px', fontWeight: '700', border: '1px solid',
      ...style,
    }}>{label}</span>
  );
}

function ScoreBar({ label, value, max = 10 }) {
  const pct = value != null ? (value / max) * 100 : 0;
  const color = value != null ? scoreColor(value, max) : '#e5e7eb';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '13px', color: '#6b7280', width: '190px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '8px', borderRadius: '999px',
          background: color, transition: 'width 0.7s ease',
        }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', width: '36px', textAlign: 'right' }}>
        {value != null ? `${value}${max === 100 ? '%' : ''}` : '—'}
      </span>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: '16px', padding: '24px', ...style,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return (
    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {children}
    </h3>
  );
}

function MetaField({ label, value, large, color }) {
  return (
    <div>
      <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ margin: 0, fontWeight: '700', fontSize: large ? '22px' : '14px', color: color || '#0f172a' }}>
        {value || '—'}
      </p>
    </div>
  );
}

function ConcernChip({ label, active }) {
  return (
    <span style={{
      padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
      background: active ? '#fef2f2' : '#f8fafc',
      color: active ? '#dc2626' : '#94a3b8',
      border: `1px solid ${active ? '#fecaca' : '#e2e8f0'}`,
    }}>
      {active ? '⚠ ' : ''}{label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function CallDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'company_admin'].includes(user?.role);

  const ADMIN_NAV = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/calls', label: 'All Calls', icon: Phone },
    { path: '/admin/recordings', label: 'Recordings', icon: Mic },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];
  const COUNSELOR_NAV = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/calls', label: 'My Calls', icon: Phone },
    { path: '/recordings', label: 'Recordings', icon: Mic },
    { path: '/upload', label: 'Upload', icon: Upload },
  ];
  const navItems = isAdmin ? ADMIN_NAV : COUNSELOR_NAV;
  const panelLabel = isAdmin ? 'Admin Panel' : 'My Panel';

  const [call, setCall]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [activeTab, setActiveTab]   = useState('original'); // 'original' | 'english'
  const pollRef = useRef(null);

  // ── Fetch call ────────────────────────────────────────────────────
  const fetchCall = useCallback(async () => {
    try {
      const res = await API.get(`/calls/${id}`);
      const c = res.data.call || res.data;
      setCall(c);
      setError(null);
      return c;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load call details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Polling ───────────────────────────────────────────────────────
  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await API.get(`/calls/${id}/status`);
        const status = res.data.status;
        if (status === 'completed' || status === 'failed') {
          stopPolling();
          setTriggering(false);
          await fetchCall();
        }
      } catch { /* keep polling on network blip */ }
    }, 5000);
  }, [id, fetchCall]);

  useEffect(() => {
    fetchCall().then((c) => {
      if (c && (c.status === 'processing')) startPolling();
    });
    return stopPolling;
  }, [id]);

  useEffect(() => {
    if (!call) return;
    if (call.status === 'processing') startPolling();
    if (call.status === 'completed' || call.status === 'failed') stopPolling();
  }, [call?.status]);

  // ── Trigger Analysis ──────────────────────────────────────────────
  // Uses /calls/:id/analyse — the call-specific pipeline endpoint
  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await API.post(`/calls/${id}/analyse`);
      startPolling();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not start analysis.';
      alert(msg);
      setTriggering(false);
    }
  };

  // ── Re-Analyse (admin) ────────────────────────────────────────────
  const handleReanalyse = async () => {
    if (!window.confirm('Re-run AI analysis? Previous results will be cleared.')) return;
    setTriggering(true);
    try {
      await API.post(`/calls/${id}/reanalyse`);
      startPolling();
      await fetchCall();
    } catch (err) {
      const msg = err.response?.data?.message || 'Re-analysis failed.';
      alert(msg);
      setTriggering(false);
    }
  };

  // ── Render states ─────────────────────────────────────────────────
  if (loading) return (
    <AppLayout navItems={navItems} panelLabel={panelLabel}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout navItems={navItems} panelLabel={panelLabel}>
      <div style={{ padding: '40px' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
        <Link to={isAdmin ? '/admin/calls' : '/calls'} style={{ color: '#6366f1', fontWeight: '600', fontSize: '14px' }}>← Back to Calls</Link>
      </div>
    </AppLayout>
  );

  if (!call) return null;

  const isPending    = call.status === 'pending';
  const isProcessing = call.status === 'processing' || triggering;
  const isCompleted  = call.status === 'completed';
  const isFailed     = call.status === 'failed';

  const scores = {
    communication: call.communicationScore,
    engagement:    call.engagementScore,
    confidence:    call.counsellorConfidenceScore,
  };

  const sentiment = call.sentiment;
  const sentSt = sentiment ? sentimentStyles[sentiment] : null;
  const statusSt = statusStyles[call.status] || statusStyles.pending;

  const hasTranscript = call.transcript?.originalText || call.transcript?.englishText;
  const isTranslated  = call.transcript?.detectedLanguage !== 'en' && call.transcript?.englishText;

  return (
    <AppLayout navItems={navItems} panelLabel={panelLabel}>
      <div style={{ padding: '32px 40px', maxWidth: '960px', margin: '0 auto' }}>

          {/* ── Back link ── */}
          <Link to={isAdmin ? '/admin/calls' : '/calls'} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: '#64748b', textDecoration: 'none',
            fontWeight: '600', marginBottom: '24px',
          }}>
            <ArrowLeft size={15} /> Back to Calls
          </Link>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <PhoneCall size={18} style={{ marginRight: '8px', color: '#6366f1', verticalAlign: 'middle' }} />
                {call.originalFileName}
              </h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                <span>📅 {new Date(call.createdAt).toLocaleString()}</span>
                {call.fileSizeMB && <span>💾 {call.fileSizeMB} MB</span>}
                {call.durationSeconds && <span>⏱ {fmt(call.durationSeconds)}</span>}
                {call.transcript?.detectedLanguage && <span>🌐 {call.transcript.detectedLanguage.toUpperCase()}</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {isAdmin && isCompleted && (
                <button onClick={handleReanalyse} disabled={triggering} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px', borderRadius: '10px', fontSize: '13px',
                  fontWeight: '600', cursor: triggering ? 'not-allowed' : 'pointer',
                  background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                  fontFamily: 'inherit',
                }}>
                  <RotateCcw size={14} /> Re-analyse
                </button>
              )}
              {(isPending || isFailed) && !triggering && (
                <button onClick={handleTrigger} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                  fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', border: 'none',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}>
                  <Zap size={15} /> Trigger Analysis
                </button>
              )}
              {isProcessing && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '10px',
                  background: '#eff6ff', color: '#2563eb', fontSize: '13px', fontWeight: '600',
                }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Analysing…
                </div>
              )}
            </div>
          </div>

          {/* ── Status + flags row ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Badge label={call.status.charAt(0).toUpperCase() + call.status.slice(1)} style={{ bg: statusSt.bg, color: statusSt.color, background: statusSt.bg, borderColor: statusSt.color + '44' }} />
            {sentSt && <Badge label={sentiment} style={{ background: sentSt.bg, color: sentSt.color, borderColor: sentSt.border }} />}
            {call.followUpRequired && <Badge label="Follow-up Required" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }} />}
          </div>

          {/* ── Status banners ── */}
          {isProcessing && (
            <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#2563eb', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                AI pipeline is running (Whisper → Translation → GPT-4o). This page refreshes automatically every 5 seconds.
              </span>
            </div>
          )}
          {isFailed && call.errorMessage && (
            <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <XCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: '#991b1b', fontWeight: '600' }}>{call.errorMessage}</span>
            </div>
          )}
          {isPending && !triggering && (
            <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '14px', color: '#92400e', fontWeight: '600' }}>
              ⏳ This call has not been analysed yet. Click "Trigger Analysis" to start.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Audio Player ── */}
            <Card>
              <CardTitle><PhoneCall size={15} color="#6366f1" /> Audio Recording</CardTitle>
              <AudioPlayer src={getCallStreamUrl(id)} fileName={call.originalFileName} />
              {/* Preprocessing / quality badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {call.preprocessed && (
                  <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                    ✓ Noise Reduced
                  </span>
                )}
                {call.durationSeconds && (
                  <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                    ⏱ {fmt(call.durationSeconds)}
                  </span>
                )}
                {call.transcript?.detectedLanguage && call.transcript.detectedLanguage !== 'en' && call.transcript?.translationRequired && (
                  <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                    🌐 Auto-translated from {call.transcript.detectedLanguage.toUpperCase()}
                  </span>
                )}
              </div>
            </Card>

            {/* ── Analysis Results (only when completed) ── */}
            {isCompleted && (
              <>
                {/* Lead Info Grid */}
                <Card>
                  <CardTitle><User size={15} color="#6366f1" /> Lead Information</CardTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                    <MetaField label="Student" value={call.studentName} />
                    <MetaField label="Counsellor" value={call.counsellorName} />
                    <MetaField label="Course Interested" value={call.courseInterested} />
                    <MetaField label="City" value={call.city} />
                    <MetaField label="Lead Score" value={call.leadScore != null ? `${call.leadScore} / 10` : null} large color="#6366f1" />
                    <MetaField label="Sentiment" value={sentiment}
                      color={sentSt?.color} />
                    <MetaField label="Follow-up Date" value={call.followUpDate} />
                    <MetaField label="Language" value={call.transcript?.detectedLanguage?.toUpperCase()} />
                  </div>
                </Card>

                {/* Scores */}
                <Card>
                  <CardTitle><TrendingUp size={15} color="#6366f1" /> Performance Scores</CardTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <ScoreBar label="Communication Score"    value={scores.communication} />
                    <ScoreBar label="Engagement Score"       value={scores.engagement} />
                    <ScoreBar label="Counsellor Confidence"  value={scores.confidence} />
                    {call.closingProbability != null && (
                      <ScoreBar label="Closing Probability (%)" value={call.closingProbability} max={100} />
                    )}
                    {call.leadScore != null && (
                      <ScoreBar label="Lead Score" value={call.leadScore} />
                    )}
                  </div>
                </Card>

                {/* Key Concerns + Flags */}
                {(call.keyConcerns?.length > 0 || call.feesIssue || call.placementConcern || call.timingConcern || call.parentConcern) && (
                  <Card>
                    <CardTitle><AlertTriangle size={15} color="#f59e0b" /> Concerns</CardTitle>
                    {call.keyConcerns?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                        {call.keyConcerns.map((c, i) => (
                          <span key={i} style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '13px', background: '#fef3c7', color: '#92400e', fontWeight: '600', border: '1px solid #fde68a' }}>{c}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <ConcernChip label="Fees Issue"          active={!!call.feesIssue} />
                      <ConcernChip label="Placement Concern"   active={!!call.placementConcern} />
                      <ConcernChip label="Timing Concern"      active={!!call.timingConcern} />
                      <ConcernChip label="Parent Concern"      active={!!call.parentConcern} />
                    </div>
                  </Card>
                )}

                {/* Call Summary */}
                {call.callSummary && (
                  <Card>
                    <CardTitle><MessageSquare size={15} color="#6366f1" /> AI Call Summary</CardTitle>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, margin: 0 }}>{call.callSummary}</p>
                  </Card>
                )}

                {/* Transcript */}
                {hasTranscript && (
                  <Card>
                    <CardTitle><FileText size={15} color="#6366f1" /> Transcript</CardTitle>

                    {/* Tab switcher — always show both tabs when translation exists */}
                    {isTranslated && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {['original', 'english'].map((tab) => (
                          <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '7px 18px', borderRadius: '8px', fontSize: '13px',
                            fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                            border: 'none',
                            background: activeTab === tab ? '#6366f1' : '#f1f5f9',
                            color: activeTab === tab ? '#fff' : '#64748b',
                          }}>
                            {tab === 'original' ? `Original (${call.transcript?.detectedLanguage?.toUpperCase()})` : 'English'}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Plain text transcript — always shows full originalText or englishText */}
                    <pre style={{
                      fontSize: '13px', color: '#374151', lineHeight: 1.8,
                      whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                      margin: 0, maxHeight: '420px', overflowY: 'auto',
                      padding: '16px', background: '#f8fafc',
                      borderRadius: '10px', border: '1px solid #e2e8f0',
                    }}>
                      {activeTab === 'english'
                        ? (call.transcript?.englishText || 'No English translation available.')
                        : (call.transcript?.originalText || call.transcript?.englishText || 'No transcript available.')}
                    </pre>

                    {/* Diarized speaker view — shown below transcript as a separate section */}
                    {call.diarizedSegments?.length > 0 && (
                      <>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '20px 0 10px' }}>Speaker View</p>
                        <div style={{
                          maxHeight: '500px', overflowY: 'auto', display: 'flex',
                          flexDirection: 'column', gap: '12px', padding: '16px',
                          background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0',
                        }}>
                          {call.diarizedSegments.map((seg, i) => {
                            const isCounsellor = seg.speaker === 'COUNSELLOR';
                            const mins = Math.floor(seg.start / 60);
                            const secs = Math.floor(seg.start % 60);
                            const ts = `${mins}:${String(secs).padStart(2, '0')}`;
                            return (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isCounsellor ? 'flex-start' : 'flex-end' }}>
                                <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px', textAlign: isCounsellor ? 'left' : 'right' }}>
                                  {isCounsellor ? (call.counsellorName || 'Counsellor') : (call.studentName || 'Student')}
                                </p>
                                <div style={{
                                  maxWidth: '75%', borderRadius: '12px', padding: '10px 14px',
                                  fontSize: '13px', lineHeight: 1.6,
                                  background: isCounsellor ? '#f1f5f9' : '#eff6ff',
                                  color: isCounsellor ? '#1e293b' : '#1e3a8a',
                                }}>
                                  {seg.text}
                                </div>
                                <p style={{ fontSize: '10px', color: '#cbd5e1', margin: '3px 0 0' }}>{ts}</p>
                              </div>
                            );
                          })}
                        </div>
                        {/* Speaking stats */}
                        {(() => {
                          const total = call.diarizedSegments.length;
                          const cCount = call.diarizedSegments.filter(s => s.speaker === 'COUNSELLOR').length;
                          const sCount = total - cCount;
                          return (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                              <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                                Counsellor: {cCount} segments ({Math.round(cCount / total * 100)}%)
                              </span>
                              <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                                Student: {sCount} segments ({Math.round(sCount / total * 100)}%)
                              </span>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* Empty state for pending */}
            {(isPending || isFailed) && !triggering && (
              <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
                <Star size={40} color="#e2e8f0" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#94a3b8', margin: '0 0 8px' }}>
                  {isFailed ? 'Analysis failed — retry to see results.' : 'No analysis yet.'}
                </p>
                <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
                  Click "Trigger Analysis" to run the AI pipeline.
                </p>
              </Card>
            )}

          </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}