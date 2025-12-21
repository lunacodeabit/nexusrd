import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputGroupProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, prefix, suffix, className, ...props }) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400">{prefix}</span>}
        <input
          className={`w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600 ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
          {...props}
        />
        {suffix && <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
};