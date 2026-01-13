import React from 'react';
import { X } from 'lucide-react';
import { Role } from '../types';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`card ${className}`}>
    {(title || action) && (
      <div className="card-header">
        {title && <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="card-body">
      {children}
    </div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', isLoading, ...props }) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };

  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' }> = ({ children, color = 'gray' }) => {
  const colors = {
    blue: 'badge-primary',
    green: 'badge-success',
    red: 'badge-danger',
    yellow: 'badge-warning',
    gray: 'badge-neutral',
  };
  return <span className={colors[color]}>{children}</span>;
};

export const RaciChip: React.FC<{ role: Role; className?: string }> = ({ role, className = '' }) => {
  const styles = {
    R: 'badge-raci-r',
    A: 'badge-raci-a',
    C: 'badge-raci-c',
    I: 'badge-raci-i',
  };
  return (
    <span className={`${styles[role]} inline-flex items-center justify-center w-8 h-8 ${className}`}>
      {role}
    </span>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  fullScreenOnMobile?: boolean;
}> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', fullScreenOnMobile = false }) => {
  if (!isOpen) return null;
  const containerClasses = fullScreenOnMobile
    ? `${maxWidth} w-full h-screen sm:h-auto sm:my-8`
    : `${maxWidth} w-full`;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center">
        <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <div className={`relative bg-white rounded-lg text-left overflow-hidden shadow-lg transform transition-all ${containerClasses}`}>
          <div className="bg-white px-6 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base leading-6 font-bold text-slate-800" id="modal-title">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input
      className={`input-base ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select
      className={`input-base ${className}`}
      {...props}
    >
      {children}
    </select>
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