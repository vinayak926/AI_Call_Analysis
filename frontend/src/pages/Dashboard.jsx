import React, { useState } from 'react';
import { 
  Phone, TrendingUp, AlertCircle, Users, CheckCircle, 
  XCircle, Clock, Download, Filter, Search, Star, 
  Mic, FileText, Activity, Calendar 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import StatCard from '../components/dashboard/StatCard';
import QualitySignal from '../components/dashboard/QualitySignal';
import RecentCallsTable from '../components/dashboard/RecentCallsTable';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState('Today');

  // Sample data for charts
  const qualityData = [
    { name: 'Mon', score: 88 }, { name: 'Tue', score: 92 }, { name: 'Wed', score: 85 },
    { name: 'Thu', score: 94 }, { name: 'Fri', score: 91 }, { name: 'Sat', score: 89 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call quality</h1>
              <p className="text-sm text-gray-500 mt-1">Real-time analytics & agent performance</p>
            </div>
            <div className="flex gap-3">
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Download size={18} />
              </button>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Calls analyzed" value="1,284" change="+12%" icon={Phone} color="blue" />
          <StatCard title="Avg score" value="91" change="+3%" icon={TrendingUp} color="green" />
          <StatCard title="Review risk" value="Low" change="-5%" icon={AlertCircle} color="yellow" />
          <StatCard title="Active agents" value="24" change="+2" icon={Users} color="purple" />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Quality Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-900">Quality trends</h3>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quality Signals */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Live quality signals</h3>
            <div className="space-y-4">
              <QualitySignal label="Script compliance" value="100%" status="good" />
              <QualitySignal label="Sentiment positive" value="78%" status="good" />
              <QualitySignal label="Interruptions" value="12%" status="warning" />
              <QualitySignal label="Dead air" value="4%" status="good" />
              <QualitySignal label="Objections handled" value="86%" status="good" />
            </div>
          </div>
        </div>

        {/* Coaching Priority & Recent Calls */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h3 className="font-semibold text-gray-900">Coaching priority</h3>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl">
              <p className="text-sm font-medium text-yellow-800 mb-2">Agent handling of objections needs review</p>
              <p className="text-xs text-yellow-600">3 agents below threshold</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Priya Sharma</span><span className="text-red-600">Objection handling: 62%</span></div>
              <div className="flex justify-between text-sm"><span>Rahul Verma</span><span className="text-yellow-600">Script compliance: 71%</span></div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent calls needing review</h3>
            <RecentCallsTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;