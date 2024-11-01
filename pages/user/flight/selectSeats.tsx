import Navbar from '@/pages/components/Navbar';
import Image from 'next/image';
import Cookies from 'js-cookie';
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { setSeats } from '@/redux/slices/seatSlice';
import { useRouter } from 'next/router';
import { setAircraftModel } from '@/redux/slices/aircraftModelSlice';
import { setSelectedSeat, clearSelectedSeat, clearSpecificSeat } from '@/redux/slices/selectedSeat';
import axios from 'axios';

const SelectSeats: React.FC = () => {
    const userId = Cookies.get('userId');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const passengerCount = useSelector((state: RootState) => state.passengerCount.selectedPassenger);
    const dispatch = useDispatch<AppDispatch>();
    const seats = useSelector((state: RootState) => state.seats.seats);
    const [aircraftModel, setaircraftModel] = useState('');
    const selectedFlight = useSelector((state: RootState) => state.bookdetail.selectedFlight);
    const selectedSeats = useSelector((state: RootState) => state.selectedSeats.selectedSeats);
    const [localSelectedSeats, setLocalSelectedSeats] = useState<any[]>([]);

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 5000);
    }, []);

    useEffect(() => {
        if (!selectedFlight || !selectedSeats || !seats) {
            router.push('/user/flight/listflights');
        }
    }, [selectedFlight, selectedSeats, seats, router]);

    if (!selectedFlight || !selectedSeats || !seats) return null;

    const totalPassengers = passengerCount!.adults + passengerCount!.seniors + passengerCount!.children + passengerCount!.infants;

    useEffect(() => {
        const fetchAircraftModel = async () => {
            try {
                const response: any = await axios.post('/api/airRadar', {
                    flightNumber: selectedFlight?.flightNumber,
                    airline: selectedFlight?.airline,
                });
                const aircraftModel = response.data?.aircraftDetails[0] || '';
                setaircraftModel(aircraftModel);
                if (aircraftModel) dispatch(setAircraftModel(aircraftModel));
            } catch (error) {
                console.error('Failed to fetch aircraft model:', error);
            }
        };

        fetchAircraftModel();
    }, [selectedFlight?.airline, dispatch]);

    useEffect(() => {
        dispatch(clearSelectedSeat());
        setLocalSelectedSeats([]);
    }, [dispatch]);

    useEffect(() => {
        const fetchSeats = async () => {
            if (!aircraftModel) return;
            try {
                const response = await fetch('/api/getSeats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ flightNumber: selectedFlight?.flightNumber, flightModel: aircraftModel }),
                });
                const data = await response.json();
                dispatch(setSeats(data || []));
            } catch (error: any) {
                console.error('Error fetching seats:', error.message);
            }
        };

        if (selectedFlight?.flightNumber && aircraftModel) fetchSeats();
    }, [dispatch, selectedFlight?.flightNumber, aircraftModel]);
    const getPriceByClass = (seatClass) => {
        switch (seatClass) {
            case 'Business Class':
                return 1099;
            case 'First Class':
                return 899;
            default:
                return 499; // Economy
        }
    };
    const handleSeatClick = (seat:any) => {
        const alreadySelected = localSelectedSeats.find(s => s._id === seat._id);
        const seatPrice = getPriceByClass(seat.class);
    
        if (alreadySelected) {
            // Deselect seat: remove seat from list
            const updatedSeats = localSelectedSeats.filter(s => s._id !== seat._id);
            setLocalSelectedSeats(updatedSeats);
            dispatch(clearSpecificSeat(seat._id));
        } else if (localSelectedSeats.length < totalPassengers) {
            // Select seat: add seat with price to list
            const seatWithPrice = { ...seat, price: seatPrice };
            setLocalSelectedSeats([...localSelectedSeats, seatWithPrice]);
            dispatch(setSelectedSeat(seatWithPrice));
        } else {
            console.log('Cannot select more than the allowed number of seats.');
        }
    };
    

    const handleContinueWithSelectedSeat = async () => {
        if (localSelectedSeats.length > 0) {
            try {
                router.push('/user/flight/bookingdetails');
            } catch (error) {
                console.error('Error while holding seats:', error);
            }
        } else {
            console.log('No seats selected.');
        }
    };

    const handleSkipSelection = () => {
        setLocalSelectedSeats([]);
        dispatch(clearSelectedSeat());
        router.push('/user/flight/bookingdetails');
    };

    return (
        <>
            {isLoading ? (
                <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
                    <div className="text-center">
                        <Image src="/logo_airline.png" alt="Logo" width={100} height={100} />
                        <p>Launching Seat Layout Based On Aircraft...</p>
                    </div>
                </div>
            ) : (
                <>
                    <Navbar />
                   
                    <div className="flex justify-center items-center mt-20">
                      

                        <div className="flex  flex-col items-center">
                        <div className="p-4 w-[350px] min-h-40 bg-blue-900/55 ml-10 text-white rounded  mr-8">
                            <h3 className="text-xl font-extrabold">Selected Seats Details:</h3>
                            {localSelectedSeats.length > 0 ? (
                                localSelectedSeats.map((seat, index) => (
                                    <p key={index} className="font-semibold text-lg">
                                        Seat Number: {seat.row}{seat.col} - Class: {seat.class}
                                    </p>
                                ))
                            ) : (
                                <p>No Seats Selected</p>
                            )}
                        </div>
                            <button onClick={handleContinueWithSelectedSeat} className="mb-4 px-4 py-2 bg-blue-500 text-white font-extrabold rounded mt-4">Continue</button>
                            {/* <button onClick={handleSkipSelection} className="px-4 py-2 bg-red-500 text-white font-extrabold rounded">Skip Selection</button> */}
                            <h2 className="text-2xl font-bold mb-4 text-white">Flight Seat Selection <span>{aircraftModel}</span></h2>
                            <div className="grid grid-cols-6 gap-4">
    {seats.length > 0 ? (
        seats.map((seat, index) => (
            <div
                key={index}
                className={`relative p-2 rounded ${
                    seat.isBooked
                        ? 'bg-gray-400 cursor-not-allowed'
                        : localSelectedSeats.some(s => s._id === seat._id)
                        ? 'bg-blue-500 cursor-pointer'
                        : 'bg-gray-800 cursor-pointer'
                }`}
                onClick={() => handleSeatClick(seat)}
            >
                <div className="w-8 h-12  text-white font-extrabold">
                    {seat.row}{seat.col}
            
                </div>

                {/* Hover card with seat number and image */}
                <div className="absolute top-[-10px] p-4 bg-transparent text-white text-sm rounded shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
  <div className="relative flex min-w-32 items-center gap-2">
    {/* Image with Seat Number at the Top and Price at the Bottom */}
    <div className="relative w-60 h-12 rounded overflow-hidden">
      <img
        src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/al-soot-q9-rkEJfIG4-unsplash-scaled.jpg"
        alt={`Seat ${seat.row}${seat.col}`}
        className="w-40 h-full object-cover"
      />
      {/* Seat Number on Top of the Image */}
      <span className="absolute top-0 left-0 bg-black bg-opacity-50 text-white text-sm font-extrabold p-1">
        Seat: {seat.row}{seat.col}
      </span>
      {/* Price at the Bottom of the Image */}
      <span className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-[8px] font-semibold p-1">
  Price: ₹{seat.class === 'Business Class' ? 1099 : seat.class === 'First Class' ? 899 : 499}
</span>

    </div>
  </div>
</div>

            </div>
        ))
    ) : (
        <p>No seats available</p>
    )}
</div>

                            
                        </div>
                      
                    </div>
                </>
            )}
        </>
    );
};

export default SelectSeats;
