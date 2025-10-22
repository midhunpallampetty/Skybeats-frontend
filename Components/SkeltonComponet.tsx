'use client';
import React from 'react';

const Skeleton: React.FC<{ width?: string; height?: string }> = ({
  width = '100%',
  height = '20px',
}) => {
  return (
    <div
      className="animate-pulse bg-gray-300 rounded"
      style={{ width, height }}
    />
  );
};

export default Skeleton;
