'use client'

import { useState, useEffect } from 'react'
import { Plane, Clock, Calendar, CreditCard } from 'lucide-react'
import axios from 'axios';
import Swal from 'sweetalert2'

interface Passenger {
  age: string
  disability: string
  firstName: string
  lastName: string
  middleName: string
  passportNumber: string
}

interface BookingDetails {
  arrivalAirport: string
  arrivalTime: string
  DateofJourney: string
  departureAirport: string
  departureTime: string
  email: string
  FarePaid: number
  flightDuration: string
  flightModel: string | null
  flightNumber: string
  id: string
  passengerName: Passenger[]
  ticketUrls: string[]
  cancelled?: boolean
}

interface BookingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  booking: BookingDetails | null // Accept a single booking or null
}

export default function BookingDetailsModal({ isOpen, onClose, booking }: BookingDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [bookingState, setBookingState] = useState<BookingDetails | null>(booking); // Local state for booking
  
  // If the booking prop changes (i.e., when the modal opens), update the booking state
  useEffect(() => {
    setBookingState(booking);
  }, [booking]);

  if (!isOpen || !bookingState) {
    return null;
  }

  const handleCancelFlight = async (bookingId: string) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to cancel this flight? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'No, keep it'
      });
  
      if (result.isConfirmed) {
        const response = await axios.post(
          '/api/cancelFlights',
          { bookingId },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
  
        await Swal.fire({
          title: "Canceled!",
          text: "Your ticket is canceled. Refund has been initiated to your wallet.",
          imageUrl: "https://data2.nssmag.com/images/galleries/39862/New-Project-57.jpg",
          imageWidth: 400,
          imageHeight: 200,
          imageAlt: "Custom image"
        });
  
        console.log('Cancellation successful:', response.data);
  
        setBookingState((prevBooking) => 
          prevBooking ? { ...prevBooking, cancelled: true } : prevBooking
        );
  
        setSelectedImage(null); 
        onClose(); 
      } else {
        console.log('Cancellation aborted by user');
      }
    } catch (error) {
      console.error('Error cancelling flight:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Booking Details</h2>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mb-4 border-b">
          <button
            className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Flight Details
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'tickets' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            Tickets
          </button>
        </div>

        {activeTab === 'details' && (
          <div className="overflow-y-auto h-96">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Flight Information</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Plane className="h-5 w-5 mr-2" />
                  <div>
                    <p className="font-medium">Flight Number: {bookingState.flightNumber}</p>
                    <p className="text-gray-500">{bookingState.departureAirport} → {bookingState.arrivalAirport}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <div>
                    <p className="font-medium">Departure: {bookingState.departureTime}</p>
                    <p className="font-medium">Arrival: {bookingState.arrivalTime}</p>
                    <p className="text-gray-500">Duration: {bookingState.flightDuration}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <p className="font-medium">Date: {bookingState.DateofJourney}</p>
                </div>

                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <p className="font-medium">Fare Paid: ${bookingState.FarePaid}</p>
                </div>

                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <p className="font-medium">Cancel Booking:</p>
                  {!bookingState.cancelled ? (
                    <button
                      className="text-white bg-red-600 p-1.5 rounded-lg font-extrabold"
                      onClick={() => handleCancelFlight(bookingState.id)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      className="text-gray-400 bg-gray-300 p-1.5 rounded-lg font-extrabold cursor-not-allowed"
                      disabled
                    >
                      Cancelled
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Passenger Information */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Passenger Information</h3>
              {bookingState.passengerName.map((passenger, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold">Passenger {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p className="text-gray-700">Name: {`${passenger.firstName} ${passenger.middleName} ${passenger.lastName}`}</p>
                    <p className="text-gray-700">Age: {passenger.age}</p>
                    <p className="text-gray-700">Passport: {passenger.passportNumber}</p>
                    <p className="text-gray-700">Disability: {passenger.disability}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

{activeTab === 'tickets' && (
  <div className="overflow-y-auto h-96">
    {bookingState.cancelled ? (
      <div className="text-center text-red-600 font-bold">
        This booking has been canceled. Tickets are no longer available.
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {bookingState.ticketUrls.map((url, index) => (
          <div key={index} className="relative cursor-pointer">
            <img
              src={url}
              alt={`Ticket for ${bookingState.passengerName[index].firstName} ${bookingState.passengerName[index].lastName}`}
              className="w-full h-48 object-cover rounded-lg"
              onClick={() => setSelectedImage(url)}
            />
            <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded">
              <p>Ticket for {bookingState.passengerName[index].firstName} {bookingState.passengerName[index].lastName}</p>
            </div>
          </div>
        ))}
      </div>
    )}

    {selectedImage && (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-75">
        <div className="relative">
          <img src={selectedImage} alt="Ticket" className="max-h-screen object-contain rounded-lg" />
          <button
            className="absolute top-2 right-2 text-white bg-black bg-opacity-50 p-2 rounded-full"
            onClick={() => setSelectedImage(null)}
          >
            Close
          </button>
        </div>
      </div>
    )}
  </div>
)}

      </div>
    </div>
  )
}
