'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingSummaryModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
}) => {
  const bookdata = useSelector((state: RootState) => state.hotelGuestData.selectedUser);

  if (!isOpen) return null;
  
  if (!bookdata) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Booking Summary</h2>
          <p>No booking data available.</p>
          <div className="flex justify-end">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Booking Summary</h2>
        
        <div className="mb-4">
          <strong>Check-in:</strong> <span>{bookdata.checkin}</span>
        </div>
        <div className="mb-4">
          <strong>Check-out:</strong> <span>{bookdata.checkout}</span>
        </div>
        <div className="mb-4">
          <strong>Guests:</strong> <span>{bookdata.guests}</span>
        </div>
        <div className="mb-4">
          <strong>Rooms:</strong> <span>{bookdata.rooms}</span>
        </div>
        <div className="mb-4">
          <strong>Bed Type:</strong> <span>{bookdata.bedType}</span>
        </div>
        <div className="mb-4">
          <strong>Total Amount:</strong> <span>₹{bookdata.amount}</span>
        </div>

        <div className="flex justify-end">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSummaryModal;
