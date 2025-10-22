'use client';

import React, { useState, useEffect } from 'react';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true); 
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);

      setShowMessage(true);

      if (navigator.onLine) {
        setTimeout(() => {
          setShowMessage(false);
        }, 3000);
      }
    };

    setIsOnline(navigator.onLine);

    if (!navigator.onLine) {
      setShowMessage(true);
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <>
      {showMessage && (
        <div
          className={`fixed bottom-0 left-0 w-full text-center py-2 z-50 transition-opacity duration-300 ease-in-out ${isOnline ? 'bg-blue-500/30 text-white' : 'bg-red-600/25 text-white'
            }`}
        >
          {isOnline ? 'You are Connected!' : 'You are Offline!'}
        </div>
      )}
    </>
  );
};

export default NetworkStatus;
