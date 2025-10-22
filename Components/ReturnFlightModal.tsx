'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import axiosInstance from '../pages/api/utils/axiosInstance';
import { OptionType } from '@/interfaces/OptionType';
import { selectReturnFlight } from '@/redux/slices/returnFlightSlice';
import Swal from 'sweetalert2';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  date: string;
  rewards: number;
  value: string; // Add this based on your Redux slice expectations
  stops: number; // Add this based on your Redux slice expectations
  Date: string;  // Add this based on your Redux slice expectations (if required)
}


interface FlightModalProps {
  isVisible: boolean;
  onClose: () => void;
  returnOn: Date | null | string;
  from: OptionType | null;
  to: OptionType | null;
}

const aircraftModelCache = new Map();  // Cache for aircraft models

const FlightModal: React.FC<FlightModalProps> = ({ isVisible, onClose, returnOn, from, to }) => {
  const dispatch = useDispatch(); 
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isVisible) {
      searchFlights();
    }
  }, [isVisible, from, to, returnOn]);

  const searchFlights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/searchFlights', {
        from: to?.label.split(' ')[0].toLowerCase(),
        to: from?.label.split(' ')[0].toLowerCase(),
        date: returnOn,
      });
      setFlights(response.data);
    } catch (error) {
      console.error('Error searching flights:', error);
      setError('Failed to search for flights');
    } finally {
      setLoading(false);
    }
  };

  const fetchAircraftModel = async (airline: string) => {
    if (aircraftModelCache.has(airline)) {
      return aircraftModelCache.get(airline);
    }

    try {
      const response = await axiosInstance.post('/airRadar', { flightNumber: airline }, { headers: { 'Content-Type': 'application/json' } });
      const model = response.data?.aircraftDetails[0] !== 'Aircraft model information not available'
        ? response.data?.aircraftDetails[0]
        : 'Unknown Aircraft';
      
      aircraftModelCache.set(airline, model);
      
      return model;
    } catch (error) {
      console.error('unknown aircraft', error);
      return 'Unknown Model';
    }
  };

  if (!isVisible) return null;

  const formattedReturnOn = returnOn
    ? typeof returnOn === 'string'
      ? returnOn
      : returnOn.toLocaleDateString()
    : 'No return date';
    
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-white p-6 rounded-lg w-[1000px] h-[600px] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-2 right-2 text-xl font-bold text-gray-600" onClick={onClose}>
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Return Flights</h2>
        <div className='flex justify-center p-4 gap-4'>
          <h1 className='text-black text-sm font-sans font-extrabold'>{formattedReturnOn}</h1>
          <h1 className='text-sm font-extrabold'>{to ? to.label : 'No arrival selected'}</h1> → <h1 className='text-sm font-extrabold'>{from ? from.label : 'No departure selected'}</h1>
        </div>

        <div className="modal-body h-[500px] overflow-y-auto pr-4">
          {loading ? (
            <div className="flex justify-center items-center">
              <img src='/Animation.gif' alt="Loading..." className="w-100 h-100" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            flights.length > 0 ? (
              flights.map((flight: Flight) => (
                <FlightCard key={flight.id} flight={flight} fetchAircraftModel={fetchAircraftModel} dispatch={dispatch} />
              ))
            ) : (
              <p>No flights available</p>
            )
          )}
        </div>
        <style jsx>{`
          .modal-body::-webkit-scrollbar {
            width: 8px;
          }
          .modal-body::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .modal-body::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          .modal-body::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </div>
    </div>
  );
};

const FlightCard: React.FC<{ flight: Flight; fetchAircraftModel: (airline: string) => Promise<string>; dispatch: any }> = ({ flight, fetchAircraftModel, dispatch }) => {
  const [aircraftModel, setAircraftModel] = useState<string>('Loading...');

  useEffect(() => {
    const getAircraftModel = async () => {
      const model = await fetchAircraftModel(flight.airline);
      setAircraftModel(model);
    };
    getAircraftModel();
  }, [flight.airline, fetchAircraftModel]);

  const handleSelectReturnFlight = () => {
    dispatch(selectReturnFlight(flight));

    Swal.fire({
      title: 'Return Flight Selected!',
      text: `${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has been selected as your return flight.`,
      icon: 'success',
      confirmButtonText: 'OK'
    });
  };

  return (
    <div className="flight-card mb-4 p-4 border rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xl font-bold">{flight.flightNumber}</span>
        <span className="text-lg text-gray-600">{flight.airline}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-left">
          <p className="text-2xl text-black font-semibold">{flight.departureTime}</p>
          <p className="text-black">{flight.departureAirport}</p>
        </div>
        <div className="text-center text-black">
          <p className="text-sm text-black">{flight.duration}</p>
          <p>Non-stop</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-black">{flight.arrivalTime}</p>
          <p className=" text-black">{flight.arrivalAirport}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-green-600 font-semibold">{aircraftModel}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-indigo-600">₹{flight.price}</p>
        </div>
      </div>
      <button onClick={handleSelectReturnFlight} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500">
        Select Flight
      </button>
    </div>
  );
};

export default FlightModal;
