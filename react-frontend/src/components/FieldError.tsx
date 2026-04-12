import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-1 text-red-500 text-sm mt-1 ${className}`}>
      <AlertCircle className="w-3 h-3" />
      <span>{error}</span>
    </div>
  );
};

export default FieldError;
