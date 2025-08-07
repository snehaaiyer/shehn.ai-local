import React from 'react';

interface ThemeCardProps {
  theme: string;
  title: string;
  description: string;
  image: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  title,
  description,
  image,
  isSelected = false,
  onClick
}) => {
  return (
    <div 
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 
        hover:scale-105 hover:shadow-xl
        ${isSelected ? 'ring-4 ring-pink-500 ring-offset-2' : ''}
      `}
      onClick={onClick}
    >
      {/* Background Image */}
      <div 
        className="w-full h-64 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${image})`
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-gray-200">{description}</p>
        </div>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}; 