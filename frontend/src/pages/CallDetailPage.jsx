// src/pages/CallDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Zap, Loader, RefreshCw } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Layout/Navbar';

const sentimentColor = { Positive: '#16a34a', Negative: '#dc2626', Neutral: '#d97706' };

export default function CallDetailPage() {
  const { id } = useParams();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysing, setAnalysing] = useState(false);

  const fetchCall = async () => {
    try {
      const res = await API.get(`/calls/${id}`);
      setCall(res.data.call);
    } catch (err) {
      setError('Failed to load call details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCall();

    // Poll for status if still processing
    const poll = setInterval(async () => {
      try {
        const res = await API.get(`/calls/${id}/status`);
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          clearInterval(poll);
          fetchCall();
          setAnalysing(false);
        }
      } catch { }
    }, 5000);

    return () => clearInterval(poll);
  }, [id]);

  // ── Trigger AI analysis ─────────────────────────────
  const handleAnalyse = async () => {
    setAnalysing(true);
    try {
      await API.post(`/audio/${id}/analyse`);
      // Poll will pick up completion
    } catch (err) {
      alert(err.response?.data?.message || 'Analysis failed.');
      setAnalysing(false);
    }
  };

  const scoreItems = [
    { label: 'Confidence', value: call?.scores?.confidence },
    { label: 'Communication', value: call?.scores?.communication },
    { label: 'Engagement', value: call?.scores?.engagement },
    { label: 'Objection Handling', value: call?.scores?.objectionHandling },
    { label: 'Script Compliance', value: call?.scores?.scriptCompliance },
  ];

  const scoreColor = (val) => {
    if (!val) return '#e5e7eb';
    if (val >= 7) return '#22c55e';
    if (val >= 4) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <div className="md:ml-[240px]" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <div className="md:ml-[240px]" style={{ flex: 1, padding: '40px' }}>
        <p style={{ color: '#dc2626' }}>{error}</p>
      </div>
    </div>
  );

  if (!call) return null;

  const needsAnalysis = call.status === 'pending' || call.status === 'failed';
  const isProcessing = call.status === 'processing' || analysing;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <div className="md:ml-[240px]" style={{ flex: 1, background: '#f8f7f4', minHeight: '100vh', padding: '32px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link to="/calls" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b6560', textDecoration: 'none', marginBottom: '24px', fontWeight: '600' }}>
            <ArrowLeft size={16} /> Back to Call Records
          </Link>

          {/* Header + Analyse Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {call.originalFileName}
              </h1>
              <p style={{ fontSize: '13px', color: '#8a8480', margin: 0 }}>
                Uploaded {new Date(call.createdAt).toLocaleString()} · {call.fileSizeMB} MB
                {call.durationSeconds && ` · ${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`}
              </p>
            </div>

            {/* Analyse Now button */}
            {(needsAnalysis || isProcessing) && (
              <button
                onClick={handleAnalyse}
                disabled={isProcessing}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', borderRadius: '14px',
                  background: isProcessing ? '#f0f0f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: isProcessing ? '#888' : 'white',
                  border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '700', fontFamily: 'inherit',
                  boxShadow: isProcessing ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
                }}
              >
                {isProcessing ? (
                  <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing...</>
                ) : (
                  <><Zap size={16} /> Analyse Now</>
                )}
              </button>
            )}
          </div>

          {/* Status banner */}
          {isProcessing && (
            <div style={{
              marginBottom: '20px', padding: '16px 20px', borderRadius: '14px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
              <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                AI analysis is in progress. This page will update automatically when complete.
              </span>
            </div>
          )}

          {call.status === 'pending' && !analysing && (
            <div style={{
              marginBottom: '20px', padding: '16px 20px', borderRadius: '14px',
              background: '#fffbeb', border: '1px solid #fde68a',
              fontSize: '14px', color: '#92400e', fontWeight: '600',
            }}>
              ⏳ This call has not been analysed yet. Click "Analyse Now" to start AI processing.
            </div>
          )}

          {call.status === 'failed' && !analysing && (
            <div style={{
              marginBottom: '20px', padding: '16px 20px', borderRadius: '14px',
              background: '#fef2f2', border: '1px solid #fecaca',
              fontSize: '14px', color: '#991b1b', fontWeight: '600',
            }}>
              ❌ Processing failed{call.errorMessage ? `: ${call.errorMessage}` : ''}. You can retry by clicking "Analyse Now".
            </div>
          )}

          {/* ── Analysis Results ────────────────────────── */}
          {call.status === 'completed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Lead Info Card */}
              <div style={{ background: 'white', border: '1px solid #e8e3da', borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  {[
                    { label: 'Student', value: call.studentName },
                    { label: 'Counsellor', value: call.counsellorName },
                    { label: 'Course Interest', value: call.courseInterest },
                    { label: 'City', value: call.studentCity },
                    { label: 'Sentiment', value: call.sentiment, color: sentimentColor[call.sentiment] },
                    { label: 'Lead Score', value: call.leadScore != null ? `${call.leadScore}/10` : null, large: true },
                    { label: 'Follow-up Date', value: call.followUpDate },
                    { label: 'Language', value: call.detectedLanguage?.toUpperCase() },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ fontSize: '11px', color: '#8a8480', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{item.label}</p>
                      <p style={{
                        fontWeight: '700', color: item.color || '#1a1a1a', margin: 0,
                        fontSize: item.large ? '22px' : '14px',
                      }}>
                        {item.value || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Concerns */}
              {call.keyConcerns?.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #e8e3da', borderRadius: '20px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px' }}>Key Concerns</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {call.keyConcerns.map((c, i) => (
                      <span key={i} style={{
                        padding: '6px 14px', borderRadius: '10px', fontSize: '13px',
                        background: '#fef3c7', color: '#92400e', fontWeight: '600',
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {call.callSummary && (
                <div style={{ background: 'white', border: '1px solid #e8e3da', borderRadius: '20px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px' }}>AI Summary</h3>
                  <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{call.callSummary}</p>
                </div>
              )}

              {/* Performance Scores */}
              <div style={{ background: 'white', border: '1px solid #e8e3da', borderRadius: '20px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }}>Counsellor Performance Scores</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {scoreItems.map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '13px', color: '#6b6560', width: '160px', flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1, background: '#f0ece6', borderRadius: '50px', height: '8px' }}>
                        <div style={{
                          width: value ? `${value * 10}%` : '0%', height: '8px', borderRadius: '50px',
                          background: scoreColor(value),
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a1a', width: '32px', textAlign: 'right' }}>
                        {value ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transcript */}
              {call.transcriptEnglish && (
                <div style={{ background: 'white', border: '1px solid #e8e3da', borderRadius: '20px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px' }}>Transcript (English)</h3>
                  <pre style={{
                    fontSize: '13px', color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit', margin: 0, maxHeight: '400px', overflowY: 'auto',
                    padding: '16px', background: '#f8f7f4', borderRadius: '12px',
                  }}>
                    {call.transcriptEnglish}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}