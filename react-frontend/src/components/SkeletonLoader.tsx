import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const shimmerVariants = {
  shimmer: {
    x: ['-100%', '100%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const
    }
  }
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md'
}) => {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={`relative overflow-hidden bg-gray-200 ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width,
        height: height
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        variants={shimmerVariants}
        animate="shimmer"
      />
    </div>
  );
};

// Predefined skeleton components
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12" rounded="full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-6 w-full mb-3" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const SkeletonVendorCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4" rounded="full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="w-8 h-8" rounded="full" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3 mb-4" />
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-10" />
    </div>
  </div>
);

export const SkeletonBudgetCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-12 h-12" rounded="xl" />
      <div className="flex-1">
        <Skeleton className="h-5 w-1/2 mb-1" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton className="h-8 w-2/3 mb-2" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const SkeletonGrid: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className = ''
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonVendorGrid: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonVendorCard key={index} />
    ))}
  </div>
);

export const SkeletonBudgetGrid: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <SkeletonBudgetCard />
    <SkeletonBudgetCard />
    <SkeletonBudgetCard />
  </div>
); 