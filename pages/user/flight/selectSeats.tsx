import Navbar from '@/pages/components/Navbar';
import Image from 'next/image';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { setSeats } from '@/redux/slices/seatSlice';
import { useRouter } from 'next/router';
import { setAircraftModel } from '@/redux/slices/aircraftModelSlice';
import { setSelectedSeat, clearSelectedSeat, clearSpecificSeat } from '@/redux/slices/selectedSeat';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SelectSeats: React.FC = () => {
    const userId = Cookies.get('userId');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const passengerCount = useSelector((state: RootState) => state.passengerCount.selectedPassenger);
    const dispatch = useDispatch<AppDispatch>();
    const seats = useSelector((state: RootState) => state.seats.seats);
    const [aircraftModel, setAircraftModelLocal] = useState('');
    const selectedFlight = useSelector((state: RootState) => state.bookdetail.selectedFlight);
    const selectedSeats = useSelector((state: RootState) => state.selectedSeats.selectedSeats);
    const [localSelectedSeats, setLocalSelectedSeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const totalPassengers = passengerCount?.adults + passengerCount?.seniors + passengerCount?.children + passengerCount?.infants;
    useEffect(() => {
        // Simulating data fetch delay
        setTimeout(() => {
            setLoading(false);
        }, 2000); // Adjust delay as needed or set loading to false when seats are fetched
    }, [seats]);
    useEffect(() => {
        setTimeout(() => setIsLoading(false), 5000);
    }, []);

    useEffect(() => {
        if (!selectedFlight || !selectedSeats || !seats) {
            router.push('/user/flight/listflights');
        }
    }, [selectedFlight, selectedSeats, seats, router]);

    useEffect(() => {
        const fetchAircraftModel = async () => {
            try {
                const response: any = await axios.post('/api/airRadar', {
                    flightNumber: selectedFlight?.flightNumber,
                    airline: selectedFlight?.airline,
                });
                const model = response.data?.aircraftDetails[0] || '';
                setAircraftModelLocal(model);
                if (model) dispatch(setAircraftModel(model));
            } catch (error) {
                console.error('Failed to fetch aircraft model:', error);
            }
        };

        if (selectedFlight?.flightNumber) {
            fetchAircraftModel();
        }
    }, [selectedFlight?.flightNumber, selectedFlight?.airline, dispatch]);

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
                console.log(data,'seats')
                dispatch(setSeats(data || []));
            } catch (error: any) {
                console.error('Error fetching seats:', error.message);
            }
        };

        if (aircraftModel && selectedFlight?.flightNumber) {
            fetchSeats();
        }
    }, [dispatch, aircraftModel, selectedFlight?.flightNumber]);

    const getPriceByClass = (seatClass: string) => {
        switch (seatClass) {
            case 'Business Class':
                return 1099;
            case 'First Class':
                return 899;
            default:
                return 499; // Economy
        }
    };

    const handleSeatClick = (seat: any) => {
        const alreadySelected = localSelectedSeats.find(s => s._id === seat._id);
        const seatPrice = getPriceByClass(seat.class);

        if (localSelectedSeats.length >= totalPassengers && !alreadySelected) {
            toast.error(`You can select exactly ${totalPassengers} seats.`, {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
            });
            return;
        }

        if (alreadySelected) {
            const updatedSeats = localSelectedSeats.filter(s => s._id !== seat._id);
            setLocalSelectedSeats(updatedSeats);
            dispatch(clearSpecificSeat(seat._id));
        } else {
            const seatWithPrice = { ...seat, price: seatPrice };
            setLocalSelectedSeats([...localSelectedSeats, seatWithPrice]);
            dispatch(setSelectedSeat(seatWithPrice));
        }
    };

    const handleContinueWithSelectedSeat = () => {
        if (localSelectedSeats.length === totalPassengers) {
            router.push('/user/flight/bookingdetails');
        } else {
            toast.error(`Please select exactly ${totalPassengers} seats.`, {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
            });
        }
    };

    return (
        <>
            <ToastContainer />
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
                        <div className="flex flex-col items-center">
                            <div className="p-4 w-[350px] min-h-40 bg-blue-900/55 ml-10 text-white rounded mr-8">
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
                            <h2 className="text-2xl font-bold mb-4 text-white">Flight Seat Selection <span>{aircraftModel}</span></h2>
                            <div className="grid grid-cols-6 gap-4">
            {loading ? (
                // Render skeleton loaders while data is being fetched
                Array.from({ length: 12 }).map((_, index) => (
                    <div
                        key={index}
                        className="relative p-2 rounded bg-gray-300 animate-pulse"
                    >
                        <div className="w-8 h-12 bg-gray-400 rounded"></div>
                    </div>
                ))
            ) : seats.length > 0 ? (
                // Render seat grid when data is available
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
                        <div className="w-8 h-12 text-white font-extrabold">
                            {seat.row}{seat.col}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 rounded-md flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <img
                                src="https://planelyalex.com/wp-content/uploads/2023/03/al-soot-q9-rkEJfIG4-unsplash-scaled.jpg"
                                alt="Seat Image"
                                className="w-8 h-8 mb-2"
                            />
                            <p className="text-white text-[10px] font-semibold">
                                {seat.class}
                            </p>
                            <p className="text-white text-[10px]">
                                Price: ₹
                                {seat.class === 'First Class'
                                    ? '899'
                                    : seat.class === 'Business Class'
                                    ? '1099'
                                    : '499'}
                            </p>
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
