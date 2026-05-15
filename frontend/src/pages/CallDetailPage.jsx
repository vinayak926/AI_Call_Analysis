// src/pages/CallDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, BookOpen, Star, MessageSquare } from 'lucide-react';
import API from '../services/api';

const sentimentColor = { Positive: '#16a34a', Negative: '#dc2626', Neutral: '#d97706' };

export default function CallDetailPage() {
    const { id } = useParams();
    const [call, setCall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
        fetchCall();

        // Poll for status if still processing
        const poll = setInterval(async () => {
            try {
                const res = await API.get(`/calls/${id}/status`);
                if (res.data.status === 'completed' || res.data.status === 'failed') {
                    clearInterval(poll);
                    const full = await API.get(`/calls/${id}`);
                    setCall(full.data.call);
                }
            } catch { }
        }, 5000);

        return () => clearInterval(poll);
    }, [id]);

    if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!call) return null;

    const scoreItems = [
        { label: 'Confidence', value: call.scores?.confidence },
        { label: 'Communication', value: call.scores?.communication },
        { label: 'Engagement', value: call.scores?.engagement },
        { label: 'Objection Handling', value: call.scores?.objectionHandling },
        { label: 'Script Compliance', value: call.scores?.scriptCompliance },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/calls" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
                    <ArrowLeft size={16} /> Back to Call Records
                </Link>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{call.originalFileName}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Uploaded {new Date(call.createdAt).toLocaleString()} · {call.fileSizeMB} MB
                        {call.durationSeconds && ` · ${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`}
                    </p>
                </div>

                {/* Status banner */}
                {call.status !== 'completed' && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 font-medium">
                        {call.status === 'processing' && '⚙️ AI analysis is in progress. This page will update automatically.'}
                        {call.status === 'pending' && '⏳ This call is queued for processing.'}
                        {call.status === 'failed' && `❌ Processing failed: ${call.errorMessage}`}
                    </div>
                )}

                {call.status === 'completed' && (
                    <div className="space-y-6">
                        {/* Lead Info Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Student</p>
                                <p className="font-bold text-gray-800">{call.studentName || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Counsellor</p>
                                <p className="font-bold text-gray-800">{call.counsellorName || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Course Interest</p>
                                <p className="font-bold text-gray-800">{call.courseInterest || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">City</p>
                                <p className="font-bold text-gray-800">{call.studentCity || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Sentiment</p>
                                <p className="font-bold" style={{ color: sentimentColor[call.sentiment] || '#888' }}>{call.sentiment || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Lead Score</p>
                                <p className="font-bold text-gray-800 text-xl">{call.leadScore ?? '—'}<span className="text-sm text-gray-400">/10</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Follow-up Date</p>
                                <p className="font-bold text-gray-800">{call.followUpDate || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Language</p>
                                <p className="font-bold text-gray-800">{call.detectedLanguage?.toUpperCase() || '—'}</p>
                            </div>
                        </div>

                        {/* Key Concerns */}
                        {call.keyConcerns?.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Key Concerns</h3>
                                <ul className="space-y-1">
                                    {call.keyConcerns.map((c, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-gray-400 mt-0.5">•</span> {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Summary */}
                        {call.callSummary && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">AI Summary</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{call.callSummary}</p>
                            </div>
                        )}

                        {/* Performance Scores */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Counsellor Performance Scores</h3>
                            <div className="space-y-3">
                                {scoreItems.map(({ label, value }) => (
                                    <div key={label} className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
                                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-blue-500"
                                                style={{ width: value ? `${value * 10}%` : '0%' }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800 w-8 text-right">{value ?? '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transcript */}
                        {call.transcriptEnglish && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Transcript (English)</h3>
                                <pre className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
                                    {call.transcriptEnglish}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}