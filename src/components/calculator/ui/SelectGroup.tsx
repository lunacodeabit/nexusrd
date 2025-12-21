import React from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectGroupProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  className?: string;
}

export const SelectGroup: React.FC<SelectGroupProps> = ({ label, children, className, ...props }) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <select
        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
