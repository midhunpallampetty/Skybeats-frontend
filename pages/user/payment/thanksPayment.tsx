import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { clearSelectedReturnFlight } from '@/redux/slices/returnFlightSlice';
import { useDispatch, useSelector } from 'react-redux';
import LoadingSpinner from '@/Components/LoadingSpinner';
import Cookies from 'js-cookie';
export default function ThanksPayment() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const dispatch=useDispatch()
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      dispatch(clearSelectedReturnFlight())
    }, 30000); // 1 minute in milliseconds
  
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, []);

  useEffect(() => {
    const userId = Cookies.get('userId');
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    if (!userId || !accessToken || !refreshToken) {
      Cookies.remove('userId');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      router.push('/');  // Redirect to home or login page
    }
  }, [router]);
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      {loading ? (
        
        <div className="flex flex-col items-center">
          
          
          <LoadingSpinner/>
          <p className="text-xl font-semibold text-blue-600 mt-36">Processing your booking...</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg overflow-hidden text-center p-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">Thank You!</h1>
          <p className="text-xl text-gray-700 mb-6">
            Your booking has been confirmed.
          </p>
          <button className="text-white bg-blue-900 p-3 py-2 font-extrabold rounded-lg" onClick={() => router.push('/')}>
            Home
          </button>
          <p className="text-gray-600 mt-4">
            We appreciate your trust in us and look forward to providing you with a great travel experience.
          </p>
        </div>
      )}

      {/* Spinner Styles */}
      <style jsx>{`
        .spinner {
          border: 6px solid rgba(0, 0, 255, 0.2);
          border-top: 6px solid #1E3A8A;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
