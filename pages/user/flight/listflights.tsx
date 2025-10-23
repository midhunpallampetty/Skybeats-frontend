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
  const [authChecked, setAuthChecked] = useState(false); // Track if auth check is complete

  // Clear flights and return flight on component mount
  useEffect(() => {
    dispatch(clearFlights());
    dispatch(clearSelectedReturnFlight());
  }, [dispatch]);

  // Improved authentication check with token refresh
// Improved authentication check with token refresh
useEffect(() => {
  const checkAuth = async () => {
    if (authChecked) return; // Prevent multiple checks

    try {
      // Debug logging - remove in production
      console.log('Auth check started - Current cookies:', {
        userId: !!Cookies.get('userId'),
        accessToken: !!Cookies.get('accessToken'),
        refreshToken: !!Cookies.get('refreshToken')
      });

      const userId = Cookies.get('userId');
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');

      // If all tokens present, assume valid session
      if (userId && accessToken && refreshToken) {
        console.log('All tokens present - proceeding');
        setAuthChecked(true);
        return;
      }

      // If refreshToken exists but accessToken is missing, attempt refresh
      if (refreshToken && userId && !accessToken) {
        console.log('Attempting token refresh...');
        try {
          // Method 1: Configure existing axiosInstance temporarily for refresh
          const originalDefaults = axiosInstance.defaults;
          try {
            // Remove auth headers temporarily for refresh request
            delete axiosInstance.defaults.headers.common['Authorization'];
            
            const response = await axiosInstance.post('/auth/refresh', {
              refreshToken,
              userId
            });

            if (response.data?.success && response.data?.tokens) {
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;
              
              // Set new tokens with proper options
              const cookieOptions = {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                // Domain handling for subdomains
                domain: process.env.NODE_ENV === 'production' 
                  ? `.${window.location.hostname.replace(/^www\./, '')}` 
                  : undefined
              };

              Cookies.set('accessToken', newAccessToken, { 
                ...cookieOptions, 
                expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
              });
              
              if (newRefreshToken) {
                Cookies.set('refreshToken', newRefreshToken, { 
                  ...cookieOptions, 
                  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                });
              }

              console.log('Token refresh successful');
              setAuthChecked(true);
              return;
            }
          } finally {
            // Restore original defaults
            axiosInstance.defaults = originalDefaults;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Continue to logout if refresh fails
        }
      }

      // If we reach here, user is not authenticated
      console.log('No valid session found - logging out');
      
      // Clear cookies with proper options
      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        domain: process.env.NODE_ENV === 'production' 
          ? `.${window.location.hostname.replace(/^www\./, '')}` 
          : undefined
      };

      Cookies.remove('userId', cookieOptions);
      Cookies.remove('accessToken', cookieOptions);
      Cookies.remove('refreshToken', cookieOptions);

      // Show user-friendly message
      Swal.fire({
        icon: 'info',
        title: 'Session Expired',
        text: 'Please log in again to continue.',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4CAF50',
      });

      router.push('/');
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthChecked(true);
    }
  };

  checkAuth();
}, [router, authChecked, axiosInstance]);


  // Initial loading state
  useEffect(() => {
    const fetchData = async () => {
      // Wait for auth check to complete
      if (!authChecked) {
        setTimeout(() => fetchData(), 100);
        return;
      }
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsLoading(false);
    };

    fetchData();
  }, [authChecked]);

  // Fetch Airports (only after auth check)
  useEffect(() => {
    const fetchAirports = async () => {
      if (hasFetched.current || !authChecked) return;

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
        console.error('Error fetching airports:', error);
        Swal.fire({
          text: 'Error Fetching Airports. Please try refreshing the page.',
          background: '#282c34',
          color: '#fff',
          confirmButtonColor: '#4CAF50',
          icon: 'error'
        });
      }
    };

    fetchAirports();
  }, [dispatch, authChecked]);

  // Passenger management functions
  const increment = (type: keyof typeof passengers) => {
    if (totalPassengers < 10) {
      if ((type === 'children' || type === 'infants') && !hasAdultOrSenior()) {
        Swal.fire({
          title: 'You must have at least one adult or senior citizen to select infants or children.',
          background: '#282c34',
          color: '#fff',
          confirmButtonColor: '#4CAF50',
          icon: 'warning'
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
        icon: 'warning'
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

  // Flight toggle and return flight fetching
  const toggleFlights = (type: 'main' | 'return') => {
    if (type === 'main') {
      setShowMainFlights(true);
      setShowReturnFlights(false);
    } else {
      setShowMainFlights(false);
      setShowReturnFlights(true);
      if (!loadingReturnFlights) {
        fetchReturnFlights();
      }
    }
  };

  const fetchReturnFlights = async () => {
    if (!returnDate || !selectedFrom || !selectedTo || loadingReturnFlights) {
      if (!returnDate || !selectedFrom || !selectedTo) {
        Swal.fire({
          title: 'Missing Information',
          text: 'Please select a return date and destinations.',
          icon: 'warning',
          background: '#282c34',
          color: '#fff',
          confirmButtonColor: '#4CAF50'
        });
      }
      return;
    }

    setLoadingReturnFlights(true);
    try {
      const response = await axiosInstance.post('/searchFlights', {
        from: selectedTo?.label.split(' ')[0].toLowerCase(),
        to: selectedFrom?.label.split(' ')[0].toLowerCase(),
        date: returnDate,
      });
      setReturnFlights(response.data || []);
    } catch (error) {
      console.error('Error fetching return flights:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to fetch return flights. Please try again.',
        icon: 'error',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4CAF50'
      });
      setReturnFlights([]);
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
      background: '#282c34',
      color: '#fff',
      confirmButtonColor: '#4CAF50',
      confirmButtonText: 'OK'
    });
  };

  // Airport selection handling
  const handleSelectChange = (
    selectedOption: SingleValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => {
    if (actionMeta.name === 'from') {
      setSelectedFrom(selectedOption);
      if (selectedTo && selectedOption?.value === selectedTo?.value) {
        setError("Departure and Destination cannot be the same.");
        setSelectedTo(null);
      } else {
        setError('');
      }
    } else if (actionMeta.name === 'to') {
      setSelectedTo(selectedOption);
      if (selectedFrom && selectedOption?.value === selectedFrom?.value) {
        setError("Departure and Destination cannot be the same.");
        setSelectedFrom(null);
      } else {
        setError('');
      }
    }
  };

  // Error handling for same departure/destination
  useEffect(() => {
    if (error !== '') {
      Swal.fire({
        icon: 'info',
        title: 'Invalid Selection',
        text: 'Departure & Arrival Should Not Be Same!',
        background: '#06093b',
        confirmButtonColor: '#3085d6',
        color: '#ffffff',
      });
    }
  }, [error]);

  // Debounced airport search
  const handleInputChange = useCallback(
    debounce((inputValue: string) => {
      setError('');
      if (!inputValue.trim()) {
        dispatch(setFilteredAirports(airports));
        return;
      }
      
      const filteredOptions = airports.filter((airport) =>
        airport.label.toLowerCase().includes(inputValue.toLowerCase())
      );
      dispatch(setFilteredAirports(filteredOptions.length > 0 ? filteredOptions : airports));
    }, 300),
    [airports, dispatch]
  );

  // Main search functionality
  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!authChecked) {
      Swal.fire({
        title: 'Please Wait',
        text: 'Authentication check in progress...',
        icon: 'info',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4CAF50'
      });
      return;
    }

    if (!selectedFrom || !selectedTo) {
      Swal.fire({
        title: 'Missing Locations',
        text: 'Please select both "From" and "To" locations.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4CAF50'
      });
      return;
    }

    if (!startDate) {
      Swal.fire({
        title: 'Missing Date',
        text: 'Please select a departure date.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4CAF50'
      });
      return;
    }

    if (totalPassengers === 0) {
      Swal.fire({
        title: "No Passengers Selected",
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
    const searchRequest = { from, to, date: startDate, passengers };

    // Prevent duplicate searches
    if (
      lastSearchRequest.current &&
      JSON.stringify(lastSearchRequest.current) === JSON.stringify(searchRequest)
    ) {
      if (listingRef.current) {
        (listingRef.current as any).scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    lastSearchRequest.current = searchRequest;

    try {
      // Show loading state
      Swal.fire({
        title: 'Searching Flights...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        background: '#282c34',
        color: '#fff'
      });

      const response = await axiosInstance.post('/searchFlights', {
        from,
        to,
        date: startDate,
        passengers: totalPassengers,
      });

      Swal.close(); // Close loading

      if (response.data?.length === 0) {
        Swal.fire({
          title: 'No Flights Found',
          text: `No flights available from ${from} to ${to} on ${startDate.toDateString()}. Try different dates or locations.`,
          icon: 'info',
          background: '#282c34',
          color: '#fff',
          confirmButtonColor: '#4CAF50'
        });
      } else {
        // Success
        dispatch(setFlights(response.data as Flight[]));
        dispatch(setDate(startDate.toDateString()));
        dispatch(setReturnDate(returnDate?.toDateString() || null));
        dispatch(setSelectedPassengers(passengers));

        if (listingRef.current) {
          (listingRef.current as any).scrollIntoView({ behavior: "smooth", block: "start" });
        }

        // Reset pagination
        setCurrentPage(1);
      }
    } catch (error: any) {
      Swal.close();
      console.error('Error searching flights:', error);
      
      let errorMessage = 'Failed to search flights. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        // Clear cookies and redirect
        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          domain: process.env.NODE_ENV === 'production' 
            ? `.${window.location.hostname.replace(/^www\./, '')}` 
            : undefined
        };
        Cookies.remove('userId', cookieOptions);
        Cookies.remove('accessToken', cookieOptions);
        Cookies.remove('refreshToken', cookieOptions);
        router.push('/');
        return;
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }

      Swal.fire({
        title: 'Search Failed',
        text: errorMessage,
        icon: 'error',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4CAF50'
      });
    }
  };

  // Flight sorting
  const sortFlights = (flights: Flight[], criteria: string) => {
    return [...flights].sort((a, b) => {
      switch (criteria) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return a.duration.localeCompare(b.duration);
        case 'departureTime':
          return a.departureTime.localeCompare(b.departureTime);
        default:
          return 0;
      }
    });
  };

  const sortedFlights = sortFlights(flights, sortOption);
  const sortedReturnFlights = sortFlights(returnFlights, sortOption);
  const indexOfLastFlight = currentPage * flightsPerPage;
  const indexOfFirstFlight = indexOfLastFlight - flightsPerPage;
  const currentFlights = sortedFlights.slice(indexOfFirstFlight, indexOfLastFlight);
  const currentReturnFlights = sortedReturnFlights.slice(indexOfFirstFlight, indexOfLastFlight);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of results
    if (listingRef.current) {
      (listingRef.current as any).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Framer Motion variants
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

  // Show loading screen while auth is being checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Checking authentication...</p>
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
                    placeholder="From where?"
                    isSearchable
                    className="react-select-container text-black"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        minHeight: '48px'
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: 'rgba(0, 0, 0, 0.6)'
                      })
                    }}
                  />
                  <Select
                    name="to"
                    options={filteredAirports}
                    value={selectedTo}
                    onChange={handleSelectChange}
                    onInputChange={handleInputChange}
                    placeholder="Going to?"
                    isSearchable
                    className="react-select-container text-black"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        minHeight: '48px'
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: 'rgba(0, 0, 0, 0.6)'
                      })
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    className="w-full p-3 rounded-lg text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholderText="Departure Date"
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                  />
                  <DatePicker
                    selected={returnDate}
                    onChange={(date: Date | null) => setReturnDate(date)}
                    className="w-full p-3 rounded-lg text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholderText="Return Date (Optional)"
                    minDate={startDate || new Date()}
                    dateFormat="MMMM d, yyyy"
                  />
                  <Select
                    name="sort"
                    options={[
                      { value: 'price', label: 'Sort by Price (Low to High)' },
                      { value: 'duration', label: 'Sort by Duration' },
                      { value: 'departureTime', label: 'Sort by Departure Time' },
                    ]}
                    value={{ value: sortOption, label: `Sort by ${sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}` }}
                    onChange={(option: SingleValue<OptionType>) => setSortOption(option?.value || 'price')}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Sort by..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        minHeight: '48px'
                      })
                    }}
                  />
                </div>

                {/* Passenger Selection */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full p-3 bg-white/90 rounded-lg font-semibold text-gray-800 hover:bg-white/100 transition-all flex items-center justify-between"
                  >
                    <span>Passengers: {totalPassengers} {totalPassengers === 1 ? 'traveler' : 'travelers'}</span>
                    <span className="text-sm text-gray-500">▼</span>
                  </motion.button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute w-full mt-2 bg-white text-black rounded-lg shadow-xl border border-gray-100 z-50 max-h-64 overflow-y-auto"
                      >
                        <div className="p-4 space-y-4">
                          {[
                            { label: 'Adults (12+)', type: 'adults' as const },
                            { label: 'Senior Citizens (65+)', type: 'seniors' as const },
                            { label: 'Children (2-11)', type: 'children' as const },
                            { label: 'Infants (<2)', type: 'infants' as const },
                          ].map(({ label, type }) => (
                            <motion.div
                              key={type}
                              className="flex justify-between items-center py-2"
                              whileHover={{ backgroundColor: '#f8fafc' }}
                              transition={{ duration: 0.1 }}
                            >
                              <span className="font-medium text-gray-700">{label}</span>
                              <div className="flex items-center space-x-3">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => decrement(type)}
                                  disabled={passengers[type] === 0}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  -
                                </motion.button>
                                <span className="w-8 text-center font-semibold text-gray-800">
                                  {passengers[type]}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => increment(type)}
                                  disabled={totalPassengers >= 10}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  +
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                          {totalPassengers > 0 && (
                            <div className="pt-2 border-t border-gray-200">
                              <div className="text-right">
                                <span className="font-semibold text-gray-800">
                                  Total: {totalPassengers} {totalPassengers === 1 ? 'traveler' : 'travelers'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!authChecked || isLoading}
                  className="w-full p-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-lg shadow-lg hover:from-green-500 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>Search Flights</span>
                  {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Flight Results Section */}
      {flights.length > 0 && (
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
                Outbound Flights ({flights.length})
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
                  disabled={loadingReturnFlights}
                >
                  {loadingReturnFlights ? 'Loading...' : `Return Flights (${returnFlights.length})`}
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
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {currentFlights.length > 0 ? (
                    currentFlights.map((flight, index) => (
                      <motion.div
                        key={flight.flightNumber}
                        className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all border border-white/10"
                        whileHover={{ scale: 1.02 }} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                          <div className="flex-1 space-y-3">
                            <div className="text-2xl font-bold text-white">
                              {flight.departureTime} - {flight.arrivalTime}
                            </div>
                            <div className="text-lg text-gray-300">
                              {flight.departureAirport} <span className="text-white">→</span> {flight.arrivalAirport}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <span>Duration: {flight.duration}</span>
                              <span>{flight.stops}</span>
                              <span>Flight: {flight.flightNumber}</span>
                            </div>
                            {flight.airline && (
                              <div className="text-sm text-gray-400">
                                Airline: {flight.airline}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right space-y-3 flex-shrink-0">
                            <div className="text-3xl font-bold text-white">
                              ₹{flight.price.toLocaleString('en-IN')}
                            </div>
                            {flight.discount && (
                              <div className="text-sm text-green-400">
                                Save ₹{flight.discount} with INTSAVER
                              </div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-full shadow-lg hover:from-green-500 hover:to-green-600 transition-all w-full lg:w-auto"
                              onClick={() => {
                                dispatch(setBookDetail({ ...flight, type: 'outbound' }));
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
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <Image
                        src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                        alt="No Flights Available"
                        width={400}
                        height={300}
                        className="rounded-lg shadow-2xl mb-6 opacity-70"
                      />
                      <p className="text-2xl font-semibold text-white mb-4">
                        No Flights Available
                      </p>
                      <p className="text-gray-400">
                        Try adjusting your search criteria or dates
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
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {loadingReturnFlights ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-white text-lg">Loading return flights...</p>
                    </div>
                  ) : currentReturnFlights.length > 0 ? (
                    currentReturnFlights.map((flight, index) => (
                      <motion.div
                        key={flight.flightNumber}
                        className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all border border-white/10"
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                          <div className="flex-1 space-y-3">
                            <div className="text-2xl font-bold text-white">
                              {flight.departureTime} - {flight.arrivalTime}
                            </div>
                            <div className="text-lg text-gray-300">
                              {flight.departureAirport} <span className="text-white">→</span> {flight.arrivalAirport}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <span>Duration: {flight.duration}</span>
                              <span>{flight.stops}</span>
                              <span>Flight: {flight.flightNumber}</span>
                            </div>
                            {flight.airline && (
                              <div className="text-sm text-gray-400">
                                Airline: {flight.airline}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right space-y-3 flex-shrink-0">
                            <div className="text-3xl font-bold text-white">
                              ₹{flight.price.toLocaleString('en-IN')}
                            </div>
                            {flight.discount && (
                              <div className="text-sm text-green-400">
                                Save ₹{flight.discount} with INTSAVER
                              </div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all w-full lg:w-auto"
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
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <Image
                        src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                        alt="No Return Flights Available"
                        width={400}
                        height={300}
                        className="rounded-lg shadow-2xl mb-6 opacity-70"
                      />
                      <p className="text-2xl font-semibold text-white mb-4">
                        No Return Flights Available
                      </p>
                      <p className="text-gray-400">
                        Try adjusting your return date or search for one-way flights
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {(showMainFlights ? currentFlights.length : currentReturnFlights.length) > 0 && (
              <motion.div
                className="flex justify-center mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <nav className="flex space-x-2 bg-white/5 backdrop-blur-lg rounded-full p-2">
                  {Array.from(
                    { 
                      length: Math.ceil(
                        (showMainFlights ? flights.length : returnFlights.length) / flightsPerPage
                      ) 
                    },
                    (_, i) => {
                      const pageNum = i + 1;
                      const isActive = currentPage === pageNum;
                      const totalPages = Math.ceil(
                        (showMainFlights ? flights.length : returnFlights.length) / flightsPerPage
                      );

                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`w-10 h-10 rounded-full transition-all ${
                            isActive
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    }
                  )}
                </nav>
                <div className="ml-6 text-sm text-gray-400 self-center">
                  Page {currentPage} of {Math.ceil(
                    (showMainFlights ? flights.length : returnFlights.length) / flightsPerPage
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Empty State when no search performed */}
      {flights.length === 0 && !isLoading && authChecked && (
        <motion.div 
          className="relative bg-gray-900 min-h-screen py-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center text-white max-w-md">
            <Image
              src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
              alt="Ready to Search"
              width={300}
              height={200}
              className="rounded-lg shadow-2xl mx-auto mb-6 opacity-50"
            />
            <h2 className="text-2xl font-bold mb-4">Ready to Find Your Flight?</h2>
            <p className="text-gray-400 mb-6">
              Enter your travel details above to discover amazing flight options tailored just for you.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-colors"
              onClick={() => {
                if (listingRef.current) {
                  (listingRef.current as any).scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              Start Searching
            </motion.button>
          </div>
        </motion.div>
      )}

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
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400 text-sm">
            © 2025 Skybeats™. All Rights Reserved. | Secure Booking Guaranteed
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default ListFlights;
