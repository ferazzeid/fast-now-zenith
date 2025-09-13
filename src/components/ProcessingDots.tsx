import React from 'react';

export const ProcessingDots = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center space-x-1 ${className}`}>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
  </div>
);