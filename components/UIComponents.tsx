import React from 'react';
import { IssueStatus, Priority, DeliveryStatus } from '../types';

// --- Badges ---

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-blue-100 text-blue-800',
    [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [Priority.HIGH]: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[priority]}`}>
      {priority}
    </span>
  );
};

export const IssueStatusBadge: React.FC<{ status: IssueStatus }> = ({ status }) => {
  const colors = {
    [IssueStatus.OPEN]: 'bg-gray-100 text-gray-700 border border-gray-300',
    [IssueStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-600 border border-blue-200',
    [IssueStatus.WAITING]: 'bg-purple-50 text-purple-600 border border-purple-200',
    [IssueStatus.DONE]: 'bg-green-50 text-green-600 border border-green-200',
    [IssueStatus.REJECTED]: 'bg-red-50 text-red-600 border border-red-200',
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${colors[status]}`}>
      {status}
    </span>
  );
};

export const DeliveryStatusBadge: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  const colors = {
    [DeliveryStatus.SCHEDULED]: 'bg-blue-50 text-blue-600',
    [DeliveryStatus.ARRIVED]: 'bg-yellow-50 text-yellow-700',
    [DeliveryStatus.CHECKED]: 'bg-green-50 text-green-700',
    [DeliveryStatus.PROBLEM]: 'bg-red-50 text-red-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status]}`}>
      {status}
    </span>
  );
};

// --- Inputs ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${className}`}
      {...props}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}
export const Select: React.FC<SelectProps> = ({ label, children, ...props }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <select
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}
export const TextArea: React.FC<TextAreaProps> = ({ label, className = "", ...props }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  </div>
);

// --- Buttons ---

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ variant = 'primary', className = "", children, ...props }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    ghost: 'bg-transparent text-gray-500 hover:text-gray-700',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};