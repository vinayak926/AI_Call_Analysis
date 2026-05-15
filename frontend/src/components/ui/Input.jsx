import React from 'react';

const Input = ({ label, error, icon: Icon, children, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 rounded-lg border border-gray-200 
            focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400
            transition-all duration-200
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}
            ${className}
          `}
          {...props}
        />
        {children}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;