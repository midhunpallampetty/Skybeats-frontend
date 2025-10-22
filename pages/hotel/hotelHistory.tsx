'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { bookData } from '@/interfaces/bookData';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import axiosInstance from '../api/utils/axiosInstance';
import { LoadingSpinner } from '../../components/LoadingSpinner';
// Dynamic imports with loading states
const Navbar = dynamic(() => import('../../components/Navbar'), {
  loading: () => <div className="h-16 bg-blue-950/50 animate-pulse" />
});

const MapModal = dynamic(() => import('../../components/MapModal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
  </div>
});

const HotelBookingDetailsModal = dynamic(() => import('../../components/HotelBookingDetails'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="animate-pulse bg-blue-950/50 p-6 rounded-lg w-96 h-64"></div>
  </div>
});

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<bookData[]>([]);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<bookData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const userId = Cookies.get('userId');
  const accessToken = Cookies.get('accessToken');
  const refreshToken = Cookies.get('refreshToken');
  const itemsPerPage = 5;

  useEffect(() => {
    if (!accessToken || !refreshToken || !userId) {
      router.push('/');
      return;
    }
  }, [accessToken, refreshToken, userId, router]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const result = await Swal.fire({
        title: 'Cancel Booking?',
        text: 'This action cannot be undone and a refund will be initiated.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'No, keep it'
      });

      if (!result.isConfirmed) return;

      await axiosInstance.post('/cancelHotel', { bookingId });

      await Swal.fire({
        title: 'Booking Cancelled',
        text: 'Your booking has been cancelled and a refund has been initiated.',
        imageUrl: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=800',
        imageWidth: 400,
        imageHeight: 200,
        imageAlt: 'Refund confirmation'
      });

      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to cancel booking. Please try again.',
        icon: 'error'
      });
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axiosInstance.post('/getHotelBookings', 
          { userId },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const bookingsWithParsedLocation = response.data.map((booking: any) => ({
          ...booking,
          hotelLocation: booking.hotelLocation ? JSON.parse(booking.hotelLocation) : null,
        }));

        setBookings(bookingsWithParsedLocation);
      } catch (error) {
        setError('Failed to fetch bookings. Please try again later.');
        console.error('Error fetching bookings:', error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);

        }, 3000);
      }
    };

    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const currentBookings = sortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <LoadingSpinner/>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-950/90 flex items-center justify-center">
        <div className="bg-red-500/20 p-6 rounded-lg text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-white text-blue-950 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-black">
      <Navbar />

      {selectedLocation && (
        <MapModal
          open={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          latitude={selectedLocation.latitude}
          longitude={selectedLocation.longitude}
        />
      )}

      {selectedBooking && (
        <HotelBookingDetailsModal
          open={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          bookingDetails={selectedBooking}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          Your Bookings
        </h1>

        <div className="flex justify-end mb-6">
          <select 
            className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Oldest First</option>
            <option value="desc">Newest First</option>
          </select>
        </div>

        {currentBookings.length === 0 ? (
          <div className="text-center text-white py-12">
            <h2 className="text-2xl font-semibold mb-4">No Bookings Found</h2>
            <p className="text-gray-300">You haven't made any bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentBookings.map((booking, index) => (
              <div 
                key={booking.id || index}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 transition-all hover:bg-white/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {booking.guestName}
                    </h2>
                    <p className="text-gray-300">{booking.phoneNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">Booked on</p>
                    <p className="text-lg font-semibold text-white">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      booking.cancelled
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    onClick={() => !booking.cancelled && setSelectedBooking(booking)}
                    disabled={booking.cancelled}
                  >
                    View Details
                  </button>

                  {!booking.cancelled && (
                    <button
                      className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {booking.hotelLocation && (
                    <button
                      className="px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      onClick={() => {
                        setSelectedLocation(booking.hotelLocation);
                        setIsMapModalOpen(true);
                      }}
                    >
                      View Location
                    </button>
                  )}
                </div>

                {booking.cancelled && (
                  <div className="mt-4 bg-red-500/20 text-red-200 px-4 py-2 rounded-lg">
                    This booking has been cancelled
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-white flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;