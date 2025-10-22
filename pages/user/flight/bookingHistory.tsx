'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '@/pages/_components/Navbar';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import Modal from 'react-modal';
import axiosInstance from '@/pages/api/utils/axiosInstance';
// Set the app element for accessibility
Modal.setAppElement('#__next');

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedTicketUrl, setSelectedTicketUrl] = useState<string | null>(null);
  const itemsPerPage = 5;
  const router = useRouter();
  const userId = Cookies.get('userId');

 
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

  useEffect(() => {
    const userId = Cookies.get('userId');

    const fetchData = async () => {
      try {
        const response = await axiosInstance.post('/getBookingById', {
          userId: userId, 
        });
        console.log(response.data, 'congratulations.........');
        setBookings(response?.data);
      } catch (error) {
        console.log('An error occurred', error);
      }
    };
    fetchData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = bookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const openModal = (ticketUrl: string) => {
    setSelectedTicketUrl(ticketUrl);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedTicketUrl(null);
  };
  useEffect(()=>{
    console.log(userId)
    if(!userId){
      router.push('/')
    }
    },[userId])
  return (
    <>
      <Navbar />
      <div className="bg-dark-blue min-h-screen p-8 text-white">
        <h1 className="text-3xl font-bold mb-8 text-center">View Booked Tickets</h1>

        {currentBookings.map((booking, index) => (
          <div key={index} className="bg-blue-950/50 border border-gray-800 p-6 rounded-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">{booking.passengerName}</h2>
                <p className="text-sm">{booking.passengerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Total Passengers: {booking.totalPassengers}</p>
                <p className="text-lg font-bold">Total: ₹{booking?.FarePaid}</p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-transparent border border-white/5 p-4 rounded-lg mb-4">
              <div>
                <p className="text-sm">{booking.departureTime}</p>
                <p className="text-sm">{booking.departureCode}</p>
                <p className="text-sm">Flight Duration: {booking.flightDuration}</p>
              </div>
              <div>
                <p className="text-sm">{booking.arrivalTime}</p>
                <p className="text-sm">{booking.arrivalCode}</p>
                <p className="text-sm">Arrival Time</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openModal(booking.ticketUrl)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  View Ticket
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center space-x-4 mt-8">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

        {/* Modal for displaying the ticket */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Ticket Modal"
          className="bg-dark-blue text-white p-6 rounded-lg max-w-lg mx-auto mt-16"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <h2 className="text-2xl font-bold mb-4">Your Ticket</h2>
          {selectedTicketUrl ? (
            <>
              <iframe
                src={selectedTicketUrl}
                width="100%"
                height="600"
                className="border-none"
                title="Ticket"
              ></iframe>
              <a
                href={selectedTicketUrl}
                download={`ticket_${new Date().toLocaleDateString()}.pdf`}  // Dynamic file name for download
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 inline-block"
              >
                Download Ticket
              </a>
            </>
          ) : (
            <p>No ticket available</p>
          )}
          <button
            onClick={closeModal}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
          >
            Close
          </button>
        </Modal>
      </div>
    </>
  );
};

export default BookingHistory;
