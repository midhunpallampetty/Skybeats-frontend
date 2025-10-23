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

  // Authentication refs and state
  const hasCheckedAuth = useRef(false);
  const isAuthenticating = useState(false);

  const listingRef = useRef(null);

  useEffect(() => {
    dispatch(clearFlights());
    dispatch(clearSelectedReturnFlight());
  }, [dispatch]);

  // Improved authentication check with delay and validation
  useEffect(() => {
    // Skip if already checked, server-side, or currently authenticating
    if (hasCheckedAuth.current || typeof window === 'undefined' || isAuthenticating) {
      return;
    }

    const checkAuthentication = async () => {
      try {
        // Set flag to prevent multiple checks
        isAuthenticating = true;

        // Small delay to allow cookie settlement during client-side navigation
        await new Promise(resolve => setTimeout(resolve, 150));

        const userId = Cookies.get('userId');
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');

        console.log('Auth Check:', { userId: !!userId, accessToken: !!accessToken, refreshToken: !!refreshToken });

        // If any cookie is missing, validate before clearing
        if (!userId || !accessToken || !refreshToken) {
          console.warn('Missing auth cookies, validating...');
          
          // Try to refresh token first
          const refreshed = await tryRefreshToken();
          
          if (!refreshed) {
            // Clear cookies with proper options and redirect
            clearAuthCookies();
            Swal.fire({
              icon: 'warning',
              title: 'Session Expired',
              text: 'Please log in again to continue.',
              background: '#1E3A8A',
              color: '#fff',
              confirmButtonColor: '#4F46E5',
            });
            router.push('/login'); // Redirect to login instead of home
            return;
          }
        } else {
          // Validate existing token
          const isValid = await validateToken(accessToken);
          if (!isValid) {
            clearAuthCookies();
            Swal.fire({
              icon: 'warning',
              title: 'Session Invalid',
              text: 'Your session has expired. Please log in again.',
              background: '#1E3A8A',
              color: '#fff',
              confirmButtonColor: '#4F46E5',
            });
            router.push('/login');
            return;
          }
        }

        // If we reach here, auth is valid
        hasCheckedAuth.current = true;
        console.log('Authentication validated successfully');

      } catch (error) {
        console.error('Authentication check failed:', error);
        clearAuthCookies();
        router.push('/login');
      } finally {
        isAuthenticating = false;
      }
    };

    // Only run on client-side and after component mount
    if (typeof window !== 'undefined') {
      checkAuthentication();
    }
  }, [router]); // Keep router dependency for navigation changes

  // Token validation function
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Token refresh function
  const tryRefreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) return false;

      const response = await axiosInstance.post('/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
        timeout: 5000,
      });

      if (response.status === 200) {
        const { accessToken: newAccessToken } = response.data;
        
        // Update cookies with new access token
        Cookies.set('accessToken', newAccessToken, {
          expires: 1/24, // 1 hour
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Clear auth cookies with proper options
  const clearAuthCookies = () => {
    const cookieOptions = {
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
    };

    Cookies.remove('userId', cookieOptions);
    Cookies.remove('accessToken', cookieOptions);
    Cookies.remove('refreshToken', cookieOptions);
  };

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
          color: '#fff',
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
      background: '#1E3A8A',
      color: '#fff',
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
      Swal.fire({
        icon: 'error',
        title: 'Search Failed',
        text: 'Unable to find flights. Please try again.',
        background: '#1E3A8A',
        color: '#fff',
      });
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

  // Show loading state during authentication
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Verifying your session...</p>
        </div>
      </div>
    );
  }

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
                    Passenger Details ({totalPassengers} selected)
                  </motion.button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute w-full mt-2 bg-white text-black rounded-lg shadow-xl border border-gray-100 z-50"
                      >
                        <div className="p-4 space-y-4">
                          {[
                            { label: 'Adults', type: 'adults' as const },
                            { label: 'Senior Citizens', type: 'seniors' as const },
                            { label: 'Children (2-11)', type: 'children' as const },
                            { label: 'Infants (<2)', type: 'infants' as const },
                          ].map(({ label, type }) => (
                            <motion.div
                              key={type}
                              className="flex justify-between items-center py-2"
                              whileHover={{ scale: 1.02 }}
                            >
                              <span className="font-medium text-gray-700">{label}</span>
                              <div className="flex items-center space-x-3">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => decrement(type)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                                  disabled={passengers[type] === 0}
                                >
                                  -
                                </motion.button>
                                <span className="w-8 text-center font-semibold">
                                  {passengers[type]}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => increment(type)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                                  disabled={totalPassengers >= 10}
                                >
                                  +
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-sm font-semibold text-gray-800">
                              <span>Total Passengers:</span>
                              <span>{totalPassengers}</span>
                            </div>
                          </div>
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
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                  currentFlights.map((flight, index) => (
                    <motion.div
                      key={flight.flightNumber}
                      className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all border border-gray-700"
                      whileHover={{ scale: 1.02 }} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="text-2xl font-bold text-white">
                            {flight.departureTime} - {flight.arrivalTime}
                          </div>
                          <div className="text-lg text-gray-300">
                            {flight.departureAirport} <span className="text-gray-400">→</span> {flight.arrivalAirport}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center space-x-4">
                            <span>Duration: {flight.duration}</span>
                            <span className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${flight.stops === 'Direct' ? 'bg-green-400' : 'bg-yellow-400'} mr-2`}></div>
                              {flight.stops}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Flight: {flight.flightNumber} | {flight.airline}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-3 ml-6">
                          <div className="text-3xl font-bold text-white">
                            ₹{flight.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-400 bg-green-900/20 px-2 py-1 rounded-full inline-block">
                            Save ₹750 with INTSAVER
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-full shadow-lg hover:from-green-500 hover:to-green-600 transition-all w-full sm:w-auto"
                            onClick={() => {
                              dispatch(setBookDetail(flight));
                              dispatch(setSelectedPassengers(passengers));
                              dispatch(clearSelectedSeat());
                              router.push('/user/flight/selectSeats');
                            }}
                          >
                            Book Now
                          </motion.button>
                          <div className="text-xs text-gray-400 text-center">
                            Partially refundable
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : flights.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <Image
                      src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                      alt="No Flights Available"
                      width={400}
                      height={300}
                      className="rounded-lg shadow-2xl mb-6 opacity-50"
                    />
                    <p className="text-2xl font-semibold text-white mb-2">
                      No Flights Available
                    </p>
                    <p className="text-gray-400">
                      Try adjusting your search criteria or dates
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center text-white py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading flights...</p>
                  </div>
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
                  <div className="text-center text-white py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading return flights...</p>
                  </div>
                ) : currentReturnFlights.length > 0 ? (
                  currentReturnFlights.map((flight, index) => (
                    <motion.div
                      key={flight.flightNumber}
                      className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all border border-gray-700"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="text-2xl font-bold text-white">
                            {flight.departureTime} - {flight.arrivalTime}
                          </div>
                          <div className="text-lg text-gray-300">
                            {flight.departureAirport} <span className="text-gray-400">→</span> {flight.arrivalAirport}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center space-x-4">
                            <span>Duration: {flight.duration}</span>
                            <span className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${flight.stops === 'Direct' ? 'bg-green-400' : 'bg-yellow-400'} mr-2`}></div>
                              {flight.stops}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Flight: {flight.flightNumber} | {flight.airline}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-3 ml-6">
                          <div className="text-3xl font-bold text-white">
                            ₹{flight.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-400 bg-green-900/20 px-2 py-1 rounded-full inline-block">
                            Save ₹750 with INTSAVER
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all w-full sm:w-auto"
                            onClick={() => handleSelectReturnFlight(flight)}
                          >
                            Select Return
                          </motion.button>
                          <div className="text-xs text-gray-400 text-center">
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
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <Image
                      src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                      alt="No Return Flights Available"
                      width={400}
                      height={300}
                      className="rounded-lg shadow-2xl mb-6 opacity-50"
                    />
                    <p className="text-2xl font-semibold text-white mb-2">
                      No Return Flights Available
                    </p>
                    <p className="text-gray-400">
                      Try different dates or airports
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {(currentFlights.length > 0 || currentReturnFlights.length > 0) && (
            <motion.div
              className="flex justify-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <nav className="flex space-x-2 bg-white/10 backdrop-blur-sm p-2 rounded-full">
                {Array.from(
                  { length: Math.ceil((showMainFlights ? flights.length : returnFlights.length) / flightsPerPage) },
                  (_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-full font-semibold transition-all ${
                        currentPage === i + 1
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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

          {/* Showing results info */}
          {flights.length > 0 && (
            <motion.div
              className="text-center mt-8 text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>
                Showing {showMainFlights ? flights.length : returnFlights.length} {showMainFlights ? 'outbound' : 'return'} flights
                {currentPage > 1 && ` - Page ${currentPage}`}
              </p>
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
            © 2025 Skybeats™. All Rights Reserved.
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default ListFlights;
