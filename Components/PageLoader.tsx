'use client';
import React, { useEffect, useState } from 'react';

const PageLoader: React.FC = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 300);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100">
      {/* Your Logo */}
      <img
        src="/your-logo.png"
        alt="Your Logo"
        className="w-32 h-32 mb-8"
      />

      {/* Progress Bar */}
      <div className="w-3/4 sm:w-1/2 h-2 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
          style={{ width: `${loadingProgress}%` }}
        />
      </div>
    </div>
  );
};

export default PageLoader;
