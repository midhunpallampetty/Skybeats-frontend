import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import DatePicker from 'react-datepicker';
import Select, { SingleValue, ActionMeta } from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import { useDispatch, useSelector } from 'react-redux';
import { setAirports, setFilteredAirports } from '@/redux/slices/airportsSlice';
import debounce from 'lodash.debounce';
import { setBookDetail } from '@/redux/slices/bookdetailSlice';
import { Flight } from '../../../interfaces/flight';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { clearSelectedSeat } from '@/redux/slices/selectedSeat';
import axiosInstance from '@/pages/api/utils/axiosInstance';
import dynamic from 'next/dynamic';
import { Airport } from '@/interfaces/Airport';
import { RootState } from '@/redux/store';
import { setFlights, clearFlights } from '@/redux/slices/flightsSlice';
import { setDate } from '@/redux/slices/bookDate';
import { setReturnDate } from '@/redux/slices/returnDate';
import { setSelectedPassengers } from '@/redux/slices/passengerCountSlice';
import { OptionType } from '@/interfaces/OptionType';
import { useRouter } from 'next/router';
import { clearSelectedReturnFlight, selectReturnFlight } from '@/redux/slices/returnFlightSlice';

const ListFlights: React.FC = () => {
  const Navbar = dynamic(() => import('../../../components/Navbar'), { ssr: true });
  const router = useRouter();
  const dispatch = useDispatch();
  const airports = useSelector((state: RootState) => state.airports.airports);
  const filteredAirports = useSelector((state: RootState) => state.airports.filteredAirports);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);
  const [showMainFlights, setShowMainFlights] = useState(true);
  const [showReturnFlights, setShowReturnFlights] = useState(false);
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [loadingReturnFlights, setLoadingReturnFlights] = useState(false);
  const [passengers, setPassengers] = useState({
    adults: 0,
    seniors: 0,
    children: 0,
    infants: 0,
  });
  const [selectedFrom, setSelectedFrom] = useState<SingleValue<OptionType>>(null);
  const [selectedTo, setSelectedTo] = useState<SingleValue<OptionType>>(null);
  const flights = useSelector((state: RootState) => state.flights.flights);
  const [sortOption, setSortOption] = useState<string>('price');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [flightsPerPage] = useState<number>(5);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const lastSearchRequest = useRef(null);

  const listingRef = useRef(null);

  useEffect(() => {
    dispatch(clearFlights());
    dispatch(clearSelectedReturnFlight());
  }, [dispatch]);

useEffect(() => {
  const timer = setTimeout(() => {
    const userId = Cookies.get('userId');
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    if (!userId || !accessToken || !refreshToken) {
      router.push('/');
    }
  }, 300); // give time for cookies to update
  return () => clearTimeout(timer);
}, [router]);


  useEffect(() => {
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Fetch Airports
  useEffect(() => {
    const fetchAirports = async () => {
      if (hasFetched.current) return;

      try {
        hasFetched.current = true;
        const response = await axiosInstance.get('/getAirports');
        const airportsData: Airport[] = response.data;

        const airportOptions = airportsData.map((airport) => ({
          value: airport.code,
          label: `${airport.city} (${airport.code}) ${airport.country}`,
        }));

        dispatch(setAirports(airportOptions));
        dispatch(setFilteredAirports(airportOptions));
      } catch (error) {
        Swal.fire({
          text: 'Error Fetching Airports',
          background: 'dark',
        });
        console.error('Error fetching airports:', error);
      }
    };

    fetchAirports();
  }, [dispatch]);

  const increment = (type: keyof typeof passengers) => {
    if (totalPassengers < 10) {
      if ((type === 'children' || type === 'infants') && !hasAdultOrSenior()) {
        Swal.fire({
          title: 'You must have at least one adult or senior citizen to select infants or children.',
          background: '#282c34',
          color: '#fff',
          confirmButtonColor: '#4CAF50',
        });
      } else {
        setPassengers((prev) => ({
          ...prev,
          [type]: prev[type] + 1,
        }));
      }
    } else {
      Swal.fire({
        title: 'Maximum 10 passengers allowed.',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4CAF50',
      });
    }
  };

  const decrement = (type: keyof typeof passengers) => {
    if (passengers[type] > 0) {
      setPassengers((prev) => ({
        ...prev,
        [type]: prev[type] - 1,
      }));
    }
  };

  const totalPassengers = passengers.adults + passengers.seniors + passengers.children + passengers.infants;
  const hasAdultOrSenior = () => passengers.adults + passengers.seniors > 0;

  const toggleFlights = (type: 'main' | 'return') => {
    if (type === 'main') {
      setShowMainFlights(true);
      setShowReturnFlights(false);
    } else {
      setShowMainFlights(false);
      setShowReturnFlights(true);
      fetchReturnFlights();
    }
  };

  const fetchReturnFlights = async () => {
    if (!returnDate || !selectedFrom || !selectedTo) {
      Swal.fire('Please select a return date and destinations.');
      return;
    }

    setLoadingReturnFlights(true);
    try {
      const response = await axiosInstance.post('/searchFlights', {
        from: selectedTo?.label.split(' ')[0].toLowerCase(),
        to: selectedFrom?.label.split(' ')[0].toLowerCase(),
        date: returnDate,
      });
      setReturnFlights(response.data);
    } catch (error) {
      console.error('Error fetching return flights:', error);
      Swal.fire('Failed to fetch return flights.');
    } finally {
      setLoadingReturnFlights(false);
    }
  };

  const handleSelectReturnFlight = (flight: Flight) => {
    dispatch(selectReturnFlight(flight));
    Swal.fire({
      title: 'Return Flight Selected!',
      text: `${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has been selected as your return flight.`,
      icon: 'success',
      confirmButtonText: 'OK',
    });
  };

  const handleSelectChange = (
    selectedOption: SingleValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => {
    if (actionMeta.name === 'from') {
      setSelectedFrom(selectedOption);
      if (selectedTo && selectedOption?.value === selectedTo?.value) {
        setError("Departure and Destination cannot be the same.");
      } else {
        setError('');
      }
    } else if (actionMeta.name === 'to') {
      setSelectedTo(selectedOption);
      if (selectedFrom && selectedOption?.value === selectedFrom?.value) {
        setError("Departure and Destination cannot be the same.");
      } else {
        setError('');
      }
    }
  };

  useEffect(() => {
    if (error !== '') {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'Departure & Arrival Should Not Be Same!',
        background: '#06093b',
        confirmButtonColor: '#3085d6',
        color: '#ffffff',
      });
      setSelectedTo(null);
    }
  }, [error]);

  const handleInputChange = useCallback(
    debounce((inputValue: string) => {
      setError('');
      const filteredOptions = airports.filter((airport) =>
        airport.label.toLowerCase().includes(inputValue.toLowerCase())
      );
      dispatch(setFilteredAirports(filteredOptions));
    }, 300),
    [airports, dispatch]
  );

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFrom || !selectedTo) {
      Swal.fire('Please select both "From" and "To" locations.');
      return;
    }

    if (!startDate) {
      Swal.fire('Please select a departure date.');
      return;
    }

    if (totalPassengers === 0) {
      Swal.fire({
        title: "Warning",
        text: "Please select at least one passenger.",
        icon: "warning",
        background: "#1E3A8A",
        color: "#fff",
        confirmButtonColor: "#4F46E5",
        customClass: {
          popup: "small-alert",
        }
      });
      return;
    }

    const from = selectedFrom.label.split(' ')[0].toLowerCase();
    const to = selectedTo.label.split(' ')[0].toLowerCase();
    const searchRequest = { from, to, date: startDate };

    if (
      lastSearchRequest.current &&
      JSON.stringify(lastSearchRequest.current) === JSON.stringify(searchRequest)
    ) {
      return;
    }

    lastSearchRequest.current = searchRequest;

    try {
      const response = await axiosInstance.post('/searchFlights', {
        from,
        to,
        date: startDate,
      });

      if (response) {
        if (listingRef.current) {
          (listingRef.current as any).scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      dispatch(setFlights(response.data as Flight[]));
      dispatch(setDate(startDate.toDateString()));
      dispatch(setReturnDate(returnDate?.toDateString() || null));
    } catch (error: any) {
      console.error('Error searching flights:', error.message);
    }
  };

  const sortFlights = (flights: Flight[], criteria: string) => {
    switch (criteria) {
      case 'price':
        return [...flights].sort((a, b) => a.price - b.price);
      case 'duration':
        return [...flights].sort((a, b) => a.duration.localeCompare(b.duration));
      case 'departureTime':
        return [...flights].sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      default:
        return flights;
    }
  };

  const sortedFlights = sortFlights(flights, sortOption);
  const sortedReturnFlights = sortFlights(returnFlights, sortOption);
  const indexOfLastFlight = currentPage * flightsPerPage;
  const indexOfFirstFlight = indexOfLastFlight - flightsPerPage;
  const currentFlights = sortedFlights.slice(indexOfFirstFlight, indexOfLastFlight);
  const currentReturnFlights = sortedReturnFlights.slice(indexOfFirstFlight, indexOfLastFlight);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Navbar />
      
      {/* Hero Section with Search Form */}
      <motion.div 
        className="relative min-h-screen bg-gradient-to-br mt-16 from-blue-900 to-indigo-900"
        variants={fadeIn}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pexels-yurix-sardinelly-504228832-16141006.jpg')] bg-cover bg-center opacity-20"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div 
            className="max-w-4xl mx-auto bg-white/30 backdrop-blur-lg p-8 rounded-2xl shadow-2xl"
            variants={itemVariants}
          >
            <h1 className="text-4xl font-bold text-white text-center mb-8">Find Your Perfect Flight</h1>
            
            {isLoading ? (
              <div className="animate-pulse flex flex-col space-y-4">
                <div className="flex space-x-4">
                  <div className="bg-gray-300 rounded-lg h-12 w-48"></div>
                  <div className="bg-gray-300 rounded-lg h-12 w-48"></div>
                </div>
                <div className="flex space-x-4 w-full justify-between">
                  <div className="bg-gray-300 rounded-lg h-12 w-full"></div>
                  <div className="bg-gray-300 rounded-lg h-12 w-full"></div>
                  <div className="bg-gray-300 rounded-lg h-12 w-full"></div>
                </div>
                <div className="relative mb-4">
                  <div className="bg-gray-300 rounded-lg h-12 w-64"></div>
                </div>
                <div className="flex justify-center mt-4">
                  <div className="bg-green-400 rounded-lg h-12 lg:w-[180px]"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    name="from"
                    options={filteredAirports}
                    value={selectedFrom}
                    onChange={handleSelectChange}
                    onInputChange={handleInputChange}
                    placeholder="From"
                    className="react-select-container text-black"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      })
                    }}
                  />
                  <Select
                    name="to"
                    options={filteredAirports}
                    value={selectedTo}
                    onChange={handleSelectChange}
                    onInputChange={handleInputChange}
                    placeholder="To"
                    className="react-select-container text-black"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      })
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    className="w-full p-3 rounded-lg text-black bg-white/90 border-none"
                    placeholderText="Departure Date"
                    minDate={new Date()}
                  />
                  <DatePicker
                    selected={returnDate}
                    onChange={(date: Date | null) => setReturnDate(date)}
                    className="w-full p-3 rounded-lg text-black bg-white/90 border-none"
                    placeholderText="Return Date"
                    minDate={startDate || new Date()}
                  />
                  <Select
                    name="sort"
                    options={[
                      { value: 'price', label: 'Sort by Price' },
                      { value: 'duration', label: 'Sort by Duration' },
                      { value: 'departureTime', label: 'Sort by Departure' },
                    ]}
                    value={{ value: sortOption, label: `Sort by ${sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}` }}
                    onChange={(option: SingleValue<OptionType>) => setSortOption(option?.value || 'price')}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      })
                    }}
                  />
                </div>

                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full p-3 bg-white/90 rounded-lg font-semibold text-gray-800 hover:bg-white/100 transition-all"
                  >
                    Passenger Details
                  </motion.button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute w-full mt-2 bg-white  text-black rounded-lg shadow-xl border border-gray-100 z-50"
                      >
                        <div className="p-4 space-y-4">
                          {[
                            { label: 'Adults', type: 'adults' },
                            { label: 'Senior Citizens', type: 'seniors' },
                            { label: 'Children', type: 'children' },
                            { label: 'Infants', type: 'infants' },
                          ].map(({ label, type }) => (
                            <motion.div
                              key={type}
                              className="flex justify-between items-center"
                              whileHover={{ scale: 1.02 }}
                            >
                              <span className="font-medium">{label}</span>
                              <div className="flex items-center space-x-3">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => decrement(type as keyof typeof passengers)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full"
                                >
                                  -
                                </motion.button>
                                <span className="w-8 text-center">
                                  {passengers[type as keyof typeof passengers]}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => increment(type as keyof typeof passengers)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full"
                                >
                                  +
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full p-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-lg shadow-lg hover:from-green-500 hover:to-green-600 transition-all"
                >
                  Search Flights
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Flight Results Section */}
      <motion.div 
        className="relative bg-gray-900 min-h-screen py-20"
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          {/* Flight Type Toggle */}
          <motion.div 
            className="flex justify-center mb-8 space-x-4"
            variants={itemVariants}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                showMainFlights 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => toggleFlights('main')}
              ref={listingRef}
            >
              Outbound Flights
            </motion.button>
            {returnDate && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  showReturnFlights
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300'
                }`}
                onClick={() => toggleFlights('return')}
              >
                Return Flights
              </motion.button>
            )}
          </motion.div>

          {/* Flight Cards */}
          <AnimatePresence mode="wait">
            {showMainFlights && (
              <motion.div
                key="main-flights" 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {currentFlights.length > 0 ? (
                  currentFlights.map((flight) => (
                    <motion.div
                      key={flight.flightNumber}
                      className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all"
                      whileHover={{ scale: 1.02 }} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-white">
                            {flight.departureTime} - {flight.arrivalTime}
                          </div>
                          <div className="text-lg text-gray-300">
                            {flight.departureAirport} → {flight.arrivalAirport}
                          </div>
                          <div className="text-sm text-gray-400">
                            Duration: {flight.duration} | {flight.stops}
                          </div>
                          <div className="text-sm text-gray-400">
                            Flight: {flight.flightNumber}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-3">
                          <div className="text-3xl font-bold text-white">
                            ₹{flight.price}
                          </div>
                          <div className="text-sm text-green-400">
                            Save ₹750 with INTSAVER
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-full shadow-lg hover:from-green-500 hover:to-green-600"
                            onClick={() => {
                              dispatch(setBookDetail(flight));
                              dispatch(setSelectedPassengers(passengers));
                              dispatch(clearSelectedSeat());
                              router.push('/user/flight/selectSeats');
                            }}
                          >
                            Book Now
                          </motion.button>
                          <div className="text-sm text-gray-400">
                            Partially refundable
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <Image
                      src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                      alt="No Flights Available"
                      width={700}
                      height={400}
                      className="rounded-lg shadow-2xl"
                    />
                    <p className="text-2xl font-semibold text-white mt-8">
                      No Flights Available
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {showReturnFlights && (
              <motion.div
                key="return-flights"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {loadingReturnFlights ? (
                  <div className="text-center text-white">Loading return flights...</div>
                ) : currentReturnFlights.length > 0 ? (
                  currentReturnFlights.map((flight) => (
                    <motion.div
                      key={flight.flightNumber}
                      className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-white">
                            {flight.departureTime} - {flight.arrivalTime}
                          </div>
                          <div className="text-lg text-gray-300">
                            {flight.departureAirport} → {flight.arrivalAirport}
                          </div>
                          <div className="text-sm text-gray-400">
                            Duration: {flight.duration} | {flight.stops}
                          </div>
                          <div className="text-sm text-gray-400">
                            Flight: {flight.flightNumber}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-3">
                          <div className="text-3xl font-bold text-white">
                            ₹{flight.price}
                          </div>
                          <div className="text-sm text-green-400">
                            Save ₹750 with INTSAVER
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-full shadow-lg hover:from-green-500 hover:to-green-600"
                            onClick={() => handleSelectReturnFlight(flight)}
                          >
                            Select Return Flight
                          </motion.button>
                          <div className="text-sm text-gray-400">
                            Partially refundable
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <Image
                      src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                      alt="No Return Flights Available"
                      width={700}
                      height={400}
                      className="rounded-lg shadow-2xl"
                    />
                    <p className="text-2xl font-semibold text-white mt-8">
                      No Return Flights Available
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {(currentFlights.length > 0 || currentReturnFlights.length > 0) && (
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <nav className="flex space-x-2">
                {Array.from(
                  { length: Math.ceil((showMainFlights ? flights.length : returnFlights.length) / flightsPerPage) },
                  (_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-full ${
                        currentPage === i + 1
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                      onClick={() => paginate(i + 1)}
                    >
                      {i + 1}
                    </motion.button>
                  )
                )}
              </nav>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-900 border-t border-gray-800"
      >
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <img src="/logo_airline.png" className="h-10" alt="Skybeats Logo" />
            </div>
            <div className="flex flex-wrap justify-center space-x-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            © 2024 Skybeats™. All Rights Reserved.
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default ListFlights;