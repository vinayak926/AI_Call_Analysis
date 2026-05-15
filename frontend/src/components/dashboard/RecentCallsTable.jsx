import React from 'react';

const RecentCallsTable = () => {
  const calls = [
    { id: 1, agent: "Priya Sharma", customer: "Rahul M.", duration: "12:34", score: 45, risk: "High", sentiment: "Negative" },
    { id: 2, agent: "Amit Patel", customer: "Sneha K.", duration: "8:22", score: 68, risk: "Medium", sentiment: "Neutral" },
    { id: 3, agent: "Neha Gupta", customer: "Vikram S.", duration: "15:01", score: 92, risk: "Low", sentiment: "Positive" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100">
          <tr><th className="text-left py-3 font-medium text-gray-500">Agent</th><th className="text-left py-3 font-medium text-gray-500">Customer</th><th className="text-left py-3 font-medium text-gray-500">Duration</th><th className="text-left py-3 font-medium text-gray-500">Score</th><th className="text-left py-3 font-medium text-gray-500">Risk</th></tr>
        </thead>
        <tbody>
          {calls.map(call => (
            <tr key={call.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 font-medium">{call.agent}</td>
              <td className="py-3 text-gray-600">{call.customer}</td>
              <td className="py-3 text-gray-500">{call.duration}</td>
              <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${call.score < 60 ? 'bg-red-100 text-red-700' : call.score < 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{call.score}</span></td>
              <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs ${call.risk === 'High' ? 'bg-red-100 text-red-700' : call.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{call.risk}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentCallsTable;