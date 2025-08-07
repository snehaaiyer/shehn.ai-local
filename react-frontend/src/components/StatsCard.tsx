import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient?: boolean;
  trend?: string;
  trendDirection?: 'up' | 'down';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient = false,
  trend,
  trendDirection
}) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
        gradient 
          ? 'bg-salmon-pink text-white' 
          : 'bg-white border border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`
          p-3 rounded-xl 
          ${gradient 
            ? 'bg-salmon-pink text-white' 
            : 'bg-pink-100 text-pink-600'
          }
        `}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trendDirection === 'up' ? 'text-purple-600' : 'text-pink-600'
          }`}>
            <span>{trend}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gold-accent">{subtitle}</p>
        )}
      </div>
    </div>
  );
}; 