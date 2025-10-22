'use client';
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider } from '@mui/material';

interface BookingDetailModalProps {
  open: boolean;
  onClose: () => void;
  bookingDetails: {
    guestName: string;
    phoneNumber: string;
    checkin: string;
    checkout: string;
    roomType: string;
    amount: number;
  } | null;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ open, onClose, bookingDetails }) => {
  if (!bookingDetails) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth className='rounded-lg'>
      <DialogTitle sx={{ backgroundColor: '#1e293b', color: '#ffffff' }}className='shadow-inner shadow-white/30 rounded-lg'>Booking Details</DialogTitle>
      <DialogContent sx={{ padding: '20px', backgroundColor: '#1e293b'}} className='text-white font-extrabold font-sans' >
        <div style={{ marginBottom: '20px' }} >
          <Typography variant="h6" gutterBottom>
            Guest Information
          </Typography>
          <Divider />
          <Typography variant="body1" sx={{ marginTop: '10px' }}>
            <strong>Name:</strong> {bookingDetails.guestName}
          </Typography>
          <Typography variant="body1">
            <strong>Phone:</strong> {bookingDetails.phoneNumber}
          </Typography>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Typography variant="h6" gutterBottom>
            Stay Details
          </Typography>
          <Divider />
          <Typography variant="body1" sx={{ marginTop: '10px' }}>
            <strong>Check-in:</strong> {bookingDetails.checkin}
          </Typography>
          <Typography variant="body1">
            <strong>Check-out:</strong> {bookingDetails.checkout}
          </Typography>
          <Typography variant="body1">
            <strong>Room Type:</strong> {bookingDetails.roomType}
          </Typography>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Typography variant="h6" gutterBottom>
            Payment Information
          </Typography>
          <Divider />
          <Typography variant="body1" sx={{ marginTop: '18px' }}className='text-3xl'>
            <strong>Price:</strong> ₹{bookingDetails.amount}
          </Typography>
        </div>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#1e293b', padding: '16px' }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDetailModal;
