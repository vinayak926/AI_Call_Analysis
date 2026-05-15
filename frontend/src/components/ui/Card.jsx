import React from 'react';

const Card = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      bg-white rounded-2xl border border-gray-100 p-8
      ${hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;