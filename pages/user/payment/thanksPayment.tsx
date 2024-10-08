import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Navbar from '@/pages/components/Navbar';
import { useReactToPrint } from 'react-to-print';

const ThanksPayment: React.FC = () => {
  const selectedFlight = useSelector((state: RootState) => state.bookdetail.selectedFlight);
  const passengerDetails = useSelector((state: RootState) => state.bookdetail.passengerDetails);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownloadTicket = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: 'E-Ticket',
    onAfterPrint: () => alert('Ticket downloaded successfully!'),
  });

  return (
    <>
      <Navbar />
      <div
        className="ticket-container bg-transparent  text-white p-8 mt-20 max-w-4xl mx-auto rounded-lg"
        ref={ticketRef}
      >
        <header className="text-center mb-8 mt-[250px]">
          <h1 className="text-5xl font-semibold text-white">Thank You for Your Booking</h1>
          <p className="text-lg text-white">Your booking is confirmed!</p>
        </header>

        <div className="p-4 ml-28 rounded-lg flex justify-between mb-8">
          <div className="w-1/3">
            <h2 className="text-lg font-semibold mb-4">Flight Details</h2>
            <p className="mb-2">
              {selectedFlight?.departureAirport} → {selectedFlight?.arrivalAirport}
            </p>
            <p className="mb-2">
              {selectedFlight?.departureTime} {selectedFlight?.departureAirport} - {selectedFlight?.arrivalTime}{' '}
              {selectedFlight?.arrivalAirport}
            </p>
            <p className="mb-2">Flight Number: {selectedFlight?.flightNumber}</p>
            <p>Stop: Non-Stop</p>
          </div>
          <div className="w-1/3">
            <h2 className="text-lg font-semibold mb-4">Passenger Details</h2>
            <p className="mb-2">
              Name: {passengerDetails[0]?.firstName} {passengerDetails[0]?.lastName}
            </p>
            <p className="mb-2">Email: {passengerDetails[0]?.email}</p>
            <p>Phone: {passengerDetails[0]?.phoneNumber}</p>
          </div>
          <div className="w-1/3">
            <h2 className="text-lg font-semibold mb-4">Fare Details</h2>
            <p className="mb-2">Total Passengers: 1</p>
            <p>Total Fare: {selectedFlight?.price}</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleDownloadTicket}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download E-Ticket
          </button>
        </div>
      </div>
    </>
  );
};

export default ThanksPayment;
