// Loading component (components/Loader.js)
'use client';
import React from 'react';

const Loader = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Full screen height
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Optional background
      }}
    >
      <img
        src="/images/loading.png"
        alt="Loading..."
        style={{
          width: '100px', // Adjust the size of the loader image
          animation: 'rotate 2s linear infinite', // Optional rotation animation
        }}
      />
      <style jsx>{`
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
