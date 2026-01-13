import React from 'react';
import { X } from 'lucide-react';

export const FormField: React.FC<{
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}> = ({ label, children, error, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-800 mb-1.5">
      {label}
      {required && <span className="text-red-600">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export const FormRow: React.FC<{
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
}> = ({ children, cols = 2 }) => (
  <div className={`grid gap-6 ${cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : ''}`}>
    {children}
  </div>
);

export const Alert: React.FC<{
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  title?: string;
  onClose?: () => void;
}> = ({ type, message, title, onClose }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[type]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && <p className="font-semibold text-sm mb-1">{title}</p>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-current opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`border-t border-gray-200 ${className}`} />
);

export const Tabs: React.FC<{
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`flex gap-2 border-b border-gray-200 ${className}`}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${
          activeTab === tab.id
            ? 'text-blue-600 border-blue-600'
            : 'text-slate-600 border-transparent hover:text-slate-800'
        }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-16">
    {icon && <div className="mb-4 flex justify-center text-slate-400">{icon}</div>}
    <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
    {description && <p className="text-xs text-slate-500 mb-4">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex ${className}`}>
    <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

export const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
  const positionClass = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }[position];

  return (
    <div className="group relative inline-block">
      {children}
      <div className={`absolute ${positionClass} left-1/2 -translate-x-1/2 hidden group-hover:block z-20 whitespace-nowrap bg-slate-800 text-white text-xs rounded px-2 py-1`}>
        {content}
      </div>
    </div>
  );
};

export const Badge: React.FC<{
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
}> = ({ variant = 'neutral', children }) => {
  const variants = {
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};
