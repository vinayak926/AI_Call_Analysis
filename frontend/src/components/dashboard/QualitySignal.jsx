import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const QualitySignal = ({ label, value, status }) => {
  const statusConfig = {
    good: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' }
  };
  const Icon = statusConfig[status].icon;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${status === 'good' ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: value }} />
      </div>
    </div>
  );
};

export default QualitySignal;