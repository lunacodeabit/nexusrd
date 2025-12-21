import React from 'react';

export const RefreshIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5.222 1.333a8.96 8.96 0 11.94-6.48M20 20v-5h-5" />
  </svg>
);
