'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
interface OtpModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
}

const OtpModal: React.FC<OtpModalProps> = ({ email, isOpen, onClose }) => {
  const [otp, setOtp] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleVerify = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/verifyOtp', { email, otp });
      const {accessToken,refreshToken}=response.data;
      const userId=response.data.user.id;
      Cookies.set('accessToken', accessToken, { expires: 1 }); // Expires in 1 day
      Cookies.set('refreshToken', refreshToken, { expires: 30 }); // Expires in 30 days
      Cookies.set('userId', userId, { expires: 30 });
      console.log('OTP Verified Successfully:', response.data);
      router.push('/');
    } catch (err: any) {
      console.error('Error during OTP verification:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setOtp('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="otp-modal-title"
      aria-describedby="otp-modal-description"
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2
          id="otp-modal-title"
          className="text-xl font-bold mb-4 text-blue-950"
        >
          Enter OTP
        </h2>
        <p
          id="otp-modal-description"
          className="mb-4 text-black"
        >
          We have sent an OTP to your email: <span className="font-semibold">{email}</span>
        </p>
        <div className="relative">
          <input
            ref={inputRef}
            type={isVisible ? 'text' : 'password'}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-2 border text-black border-gray-300 rounded-lg mb-4"
            placeholder="Enter OTP"
            aria-label="Enter OTP"
          />
          <button
            onClick={toggleVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            aria-label={isVisible ? 'Hide OTP' : 'Show OTP'}
          >
            <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye} size="lg" />
          </button>
        </div>
        {error && <p className="text-red-500 mb-4">Error: {error}</p>}
        <button
          onClick={handleVerify}
          className={`w-full py-2.5 px-5 text-sm text-white rounded-lg font-extrabold ${
            otp.trim()
              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={loading || !otp.trim()}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 px-5 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 font-extrabold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OtpModal;
