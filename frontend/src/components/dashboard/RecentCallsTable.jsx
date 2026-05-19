import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const SENT_COLOR = { Positive: 'bg-green-100 text-green-700', Negative: 'bg-red-100 text-red-700', Neutral: 'bg-yellow-100 text-yellow-700' };
const STATUS_COLOR = { completed: 'bg-green-100 text-green-700', processing: 'bg-blue-100 text-blue-700', failed: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700' };

export default function RecentCallsTable({ calls: propCalls }) {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    if (propCalls) {
      setCalls([...propCalls].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
    } else {
      API.get('/calls').then(res => {
        const data = res.data.calls || [];
        setCalls([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      }).catch(() => {});
    }
  }, [propCalls]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100">
          <tr>
            <th className="text-left py-3 font-medium text-gray-500">Agent</th>
            <th className="text-left py-3 font-medium text-gray-500">File</th>
            <th className="text-left py-3 font-medium text-gray-500">Lead Score</th>
            <th className="text-left py-3 font-medium text-gray-500">Sentiment</th>
            <th className="text-left py-3 font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {calls.length === 0 ? (
            <tr><td colSpan={5} className="py-8 text-center text-gray-400">No calls yet</td></tr>
          ) : calls.map(call => {
            const score = call.leadScore;
            const scoreClass = score == null ? '' : score >= 7 ? 'bg-green-100 text-green-700' : score >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
            const statusClass = STATUS_COLOR[call.status] || 'bg-gray-100 text-gray-600';
            const sentClass = SENT_COLOR[call.sentiment] || 'bg-gray-100 text-gray-600';
            return (
              <tr key={call._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 font-medium">{call.uploadedBy?.fullName || '—'}</td>
                <td className="py-3 text-gray-600 max-w-[160px] truncate">{call.originalFileName || '—'}</td>
                <td className="py-3">
                  {score != null
                    ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${scoreClass}`}>{score}</span>
                    : '—'}
                </td>
                <td className="py-3">
                  {call.sentiment
                    ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${sentClass}`}>{call.sentiment}</span>
                    : '—'}
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                    {call.status ? call.status.charAt(0).toUpperCase() + call.status.slice(1) : '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
