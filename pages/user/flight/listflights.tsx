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

// Custom CSS-based spinner for SSR compatibility
const LoadingSpinner: React.FC<{ size?: number; color?: string; small?: boolean }> = ({ 
  size = 80, 
  color = '#4F46E5',
  small = false
}) => {
  const spinnerSize = small ? 20 : size;
  
  return (
    <div 
      className={`animate-spin rounded-full border-4 border-solid border-current border-r-transparent ${small ? 'border-2' : ''}`} 
      style={{ 
        width: `${spinnerSize}px`, 
        height: `${spinnerSize}px`, 
        borderColor: color,
        borderRightColor: 'transparent'
      }}
    />
  );
};

// Custom SVG airplane loader
function PlaneLoader() {
  return (
    <div className="flex justify-center py-24">
      <div className="relative">
        <svg 
          width="120" 
          height="120" 
          viewBox="0 0 120 120" 
          fill="none"
          className="animate-spin"
        >
          <path d="M60 20 L75 80 L60 70 L45 80 Z" fill="#4F46E5" />
          <rect x="57" y="70" width="6" height="30" rx="3" fill="#3B82F6" />
        </svg>
      </div>
    </div>
  );
}

const ListFlights: React.FC = () => {
  const Navbar = dynamic(() => import('../../../components/Navbar'), { ssr: true });
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Redux selectors with safe access
  const airports = useSelector((state: RootState) => state.airports?.airports || []);
  const filteredAirports = useSelector((state: RootState) => state.airports?.filteredAirports || []);
  const flights = useSelector((state: RootState) => state.flights?.flights || []);

  // State variables
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
    adults: 1, // Default to 1 adult
    seniors: 0,
    children: 0,
    infants: 0,
  });
  const [selectedFrom, setSelectedFrom] = useState<SingleValue<OptionType>>(null);
  const [selectedTo, setSelectedTo] = useState<SingleValue<OptionType>>(null);
  const [sortOption, setSortOption] = useState<string>('price');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [flightsPerPage] = useState<number>(5);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const lastSearchRequest = useRef<any>(null);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showSearchError, setShowSearchError] = useState(false); // Control error modal visibility
  const [searchErrorMessage, setSearchErrorMessage] = useState<string>('');
  const listingRef = useRef<HTMLDivElement>(null);
  const [flightData, setFlightData] = useState<Flight[]>([]); // Local backup of flight data

  // Safe passenger calculations
  const totalPassengers = React.useMemo(() => 
    passengers.adults + passengers.seniors + passengers.children + passengers.infants, 
    [passengers]
  );
  
  const hasAdultOrSenior = () => passengers.adults + passengers.seniors > 0;

  // Clear flights on component mount
  useEffect(() => {
    dispatch(clearFlights());
    dispatch(clearSelectedReturnFlight());
  }, [dispatch]);

  // Authentication check
  useEffect(() => {
    const userId = Cookies.get('userId');
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    if (!userId || !accessToken || !refreshToken) {
      Cookies.remove('userId');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      router.push('/');
      return;
    }
  }, [router]);

  // Initial loading
  useEffect(() => {
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Fetch Airports with better error handling
  useEffect(() => {
    const fetchAirports = async () => {
      if (hasFetched.current) return;

      try {
        hasFetched.current = true;
        const response = await axiosInstance.get('/getAirports');
        const airportsData: Airport[] = Array.isArray(response.data) ? response.data : [];

        const airportOptions = airportsData.map((airport) => ({
          value: airport.code,
          label: `${airport.city} (${airport.code}) ${airport.country}`,
        }));

        dispatch(setAirports(airportOptions));
        dispatch(setFilteredAirports(airportOptions));
      } catch (error) {
        console.error('Error fetching airports:', error);
        // Don't show error for airports - fallback to empty list
        dispatch(setAirports([]));
        dispatch(setFilteredAirports([]));
      }
    };

    fetchAirports();
  }, [dispatch]);

  // Passenger count functions
  const increment = useCallback((type: keyof typeof passengers) => {
    if (totalPassengers < 10) {
      if ((type === 'children' || type === 'infants') && !hasAdultOrSenior()) {
        Swal.fire({
          title: 'Add an Adult First',
          text: 'You must have at least one adult or senior citizen to select children or infants.',
          icon: 'info',
          background: '#282c34',
          color: '#fff',
          confirmButtonColor: '#4F46E5',
        });
        return;
      }
      
      setPassengers((prev) => ({
        ...prev,
        [type]: Math.min(prev[type] + 1, 9), // Cap at 9 to allow +1
      }));
    } else {
      Swal.fire({
        title: 'Group Limit Reached',
        text: 'Maximum 10 passengers allowed per booking.',
        icon: 'info',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4F46E5',
      });
    }
  }, [totalPassengers]);

  const decrement = useCallback((type: keyof typeof passengers) => {
    setPassengers((prev) => ({
      ...prev,
      [type]: Math.max(prev[type] - 1, 0),
    }));
  }, []);

  // Toggle flight types
  const toggleFlights = (type: 'main' | 'return') => {
    setShowMainFlights(type === 'main');
    setShowReturnFlights(type === 'return');
    setCurrentPage(1);
    
    if (type === 'return' && returnDate && selectedFrom && selectedTo) {
      fetchReturnFlights();
    }
  };

  // Fetch return flights
  const fetchReturnFlights = async () => {
    if (!returnDate || !selectedFrom || !selectedTo) {
      return;
    }

    setLoadingReturnFlights(true);
    try {
      const fromCity = selectedTo?.label.split(' ')[0]?.toLowerCase() || '';
      const toCity = selectedFrom?.label.split(' ')[0]?.toLowerCase() || '';
      
      const response = await axiosInstance.post('/searchFlights', {
        from: fromCity,
        to: toCity,
        date: returnDate,
      });

      const data = Array.isArray(response.data) ? response.data : [];
      setReturnFlights(data);
    } catch (error) {
      console.error('Return flights error:', error);
      setReturnFlights([]);
    } finally {
      setLoadingReturnFlights(false);
    }
  };

  // Handle return flight selection
  const handleSelectReturnFlight = useCallback((flight: Flight) => {
    try {
      dispatch(selectReturnFlight(flight));
      Swal.fire({
        title: 'Return Flight Selected!',
        text: `${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#282c34',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error selecting return flight:', error);
    }
  }, [dispatch]);

  // Handle select change with better validation
  const handleSelectChange = useCallback((
    selectedOption: SingleValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => {
    setShowSearchError(false);
    
    if (actionMeta.name === 'from') {
      setSelectedFrom(selectedOption);
      // Clear "to" if same as new "from"
      if (selectedTo?.value === selectedOption?.value) {
        setSelectedTo(null);
      }
    } else if (actionMeta.name === 'to') {
      setSelectedTo(selectedOption);
      // Clear "from" if same as new "to"
      if (selectedFrom?.value === selectedOption?.value) {
        setSelectedFrom(null);
      }
    }
  }, [selectedFrom, selectedTo]);

  // Debounced input change
  const handleInputChange = useCallback(
    debounce((inputValue: string) => {
      if (!inputValue.trim()) {
        dispatch(setFilteredAirports(airports));
        return;
      }
      
      const filtered = airports.filter((airport) =>
        airport.label.toLowerCase().includes(inputValue.toLowerCase())
      );
      dispatch(setFilteredAirports(filtered));
    }, 300),
    [airports, dispatch]
  );

  // FIXED Search handler - The main issue was in the async flow and Redux dispatch
// FIXED Search handler with automatic retry logic
const handleSearch = useCallback(async (event: React.FormEvent) => {
  event.preventDefault();
  
  // Reset all states first
  setShowSearchError(false);
  setSearchErrorMessage('');
  setSearchPerformed(false);
  setFlightData([]);
  
  // Validation (unchanged)
  if (!selectedFrom || !selectedTo) {
    Swal.fire({
      title: 'Complete Your Search',
      text: 'Please select both departure and arrival cities.',
      icon: 'warning',
      background: '#282c34',
      color: '#fff',
    });
    return;
  }
  if (!startDate) {
    Swal.fire({
      title: 'Select Travel Date',
      text: 'Please choose your departure date.',
      icon: 'warning',
      background: '#282c34',
      color: '#fff',
    });
    return;
  }
  if (totalPassengers === 0) {
    Swal.fire({
      title: 'Add Passengers',
      text: 'Please select at least one passenger.',
      icon: 'warning',
      background: '#1E3A8A',
      color: '#fff',
    });
    return;
  }

  setLoadingFlights(true);
  const searchPayload = {
    from: selectedFrom.label.split(' ')[0].toLowerCase(),
    to: selectedTo.label.split(' ')[0].toLowerCase(),
    date: startDate,
    passengers: totalPassengers,
  };

  // Show loading (unchanged)
  const loadingSwal = Swal.fire({
    title: 'Searching Flights...',
    html: 'Finding the best options for your trip',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    },
    background: '#282c34',
    color: '#fff',
  });

  try {
    console.log('Starting flight search with payload:', searchPayload);
    
    // Clear Redux flights first
    dispatch(clearFlights());
    
    // Retry logic: Up to 10 attempts for transient errors
    let lastError: any = null;
    let successResponse: any = null;
    const maxRetries = 10;
    let retryCount = 0;

    while (retryCount < maxRetries && !successResponse) {
      retryCount++;
      
      try {
        // Make API call
        const response = await axiosInstance.post('searchFlights', searchPayload);
        
        console.log(`API Response received (attempt ${retryCount}):`, {
          status: response.status,
          statusText: response.statusText,
          dataLength: Array.isArray(response.data) ? response.data.length : 'Not array',
          dataSample: Array.isArray(response.data) ? response.data[0] : response.data,
        });
        
        // If we get here, it's a success - break the loop
        successResponse = response;
        break;
        
      } catch (attemptError: any) {
        console.log(`Attempt ${retryCount} failed:`, {
          message: attemptError.message,
          status: attemptError.response?.status,
          code: attemptError.code,
        });
        
        lastError = attemptError;
        
        // Only retry on transient server/network errors (5xx or connection issues)
        // Do NOT retry on 4xx (client errors) or other non-recoverable issues
        const shouldRetry = 
          attemptError.response?.status >= 500 ||  // Server errors (500-599)
          attemptError.code === 'ECONNABORTED' ||   // Timeout
          attemptError.code === 'ENOTFOUND' ||      // Network error
          !attemptError.response;                   // No response (network failure)
        
        if (!shouldRetry || retryCount === maxRetries) {
          // Final failure - throw the last error to outer catch
          throw lastError;
        }
        
        // Exponential backoff: Wait 500ms * 2^(retryCount-1), max 5s
        const delay = Math.min(500 * Math.pow(2, retryCount - 1), 5000);
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Close loading
    loadingSwal.close();
    
    // Process successful response data (unchanged)
    let processedFlights: Flight[] = [];
    if (Array.isArray(successResponse.data)) {
      processedFlights = successResponse.data;
    } else if (successResponse.data && Array.isArray(successResponse.data.flights)) {
      processedFlights = successResponse.data.flights;
    } else if (successResponse.data && Array.isArray(successResponse.data.data)) {
      processedFlights = successResponse.data.data;
    }
    
    // Validate each flight object
    const validFlights = processedFlights.filter(flight => 
      typeof flight === 'object' &&
      flight.flightNumber &&
      flight.price !== undefined &&
      flight.price !== null
    );
    
    console.log('Processed flights:', {
      originalCount: processedFlights.length,
      validCount: validFlights.length,
      sampleFlight: validFlights[0],
    });
    
    // Store in local state first
    setFlightData(validFlights);
    
    // Update Redux state with error handling
    try {
      // Clear again to ensure clean state
      dispatch(clearFlights());
      // Set the flights with a small delay to prevent race conditions
      setTimeout(() => {
        dispatch(setFlights(validFlights));
        console.log('Redux flights updated successfully');
      }, 0);
    } catch (reduxError) {
      console.error('Redux dispatch error:', reduxError);
      // Even if Redux fails, we still have local state
      setSearchPerformed(true);
      // Show warning but don't block user
      Swal.fire({
        title: 'Flights Found!',
        text: `We found ${validFlights.length} flights!`,
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
      });
    }
    
    // Set search state
    setSearchPerformed(true);
    
    // Update dates in Redux
    dispatch(setDate(startDate.toDateString()));
    dispatch(setReturnDate(returnDate?.toDateString() || null));
    
    // Success feedback - ONLY show if data found (no error notifications for retries)
    if (validFlights.length > 0) {
      Swal.fire({
        title: `Found ${validFlights.length} Option${validFlights.length !== 1 ? 's' : ''}!`,
        text: 'Scroll down to view your flights',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#282c34',
        color: '#fff',
        toast: true,
        position: 'top-right',
      });
    } else {
      Swal.fire({
        title: 'No Flights Available',
        text: 'Try adjusting your travel dates or destinations for more options.',
        icon: 'info',
        background: '#282c34',
        color: '#fff',
      });
    }
    
    // Scroll to results
    setTimeout(() => {
      if (listingRef.current) {
        listingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);

  } catch (apiError: any) {
    // Close loading
    loadingSwal.close();
    
    console.error('API Error Details:', {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
      config: apiError.config,
    });
    
    let userMessage = 'Unable to complete your search. Please try again.';
    if (apiError.response?.status === 400) {
      userMessage = 'Invalid search parameters. Please check your selection.';
    } else if (apiError.response?.status === 404) {
      userMessage = 'Flight service not available. Please try again later.';
    } else if (apiError.response?.status >= 500) {
      // For final 5xx after retries, show generic message without "team notified"
      userMessage = 'Search temporarily unavailable. Please try again shortly.';
    } else if (apiError.code === 'ECONNABORTED') {
      userMessage = 'Search timed out. Please try a narrower date range.';
    } else if (!navigator.onLine) {
      userMessage = 'No internet connection. Please check your network.';
    }
    
    setSearchErrorMessage(userMessage);
    setShowSearchError(true);
    setSearchPerformed(true);
    setLoadingFlights(false);
    
    Swal.fire({
      title: 'Search Issue',
      text: userMessage,
      icon: 'error',
      background: '#282c34',
      color: '#fff',
      confirmButtonColor: '#4F46E5',
    });
  } finally {
    setLoadingFlights(false);
  }
}, [dispatch, selectedFrom, selectedTo, startDate, returnDate, totalPassengers, passengers]);

  // Sort flights safely
  const sortFlights = useCallback((flights: Flight[], criteria: string) => {
    if (!Array.isArray(flights) || flights.length === 0) {
      return [];
    }

    return [...flights].sort((a, b) => {
      try {
        switch (criteria) {
          case 'price':
            return (a.price || 0) - (b.price || 0);
          case 'duration':
            return (a.duration || '').localeCompare(b.duration || '');
          case 'departureTime':
            return (a.departureTime || '').localeCompare(b.departureTime || '');
          default:
            return 0;
        }
      } catch (error) {
        console.error('Sort error:', error);
        return 0;
      }
    });
  }, []);

  // Get current flights to display
  const getCurrentFlights = useCallback(() => {
    const displayFlights = flightData.length > 0 ? flightData : flights;
    
    if (!Array.isArray(displayFlights) || displayFlights.length === 0) {
      return [];
    }

    const sorted = sortFlights(displayFlights, sortOption);
    const indexOfLast = currentPage * flightsPerPage;
    const indexOfFirst = indexOfLast - flightsPerPage;
    
    return sorted.slice(Math.max(0, indexOfFirst), indexOfLast);
  }, [flightData, flights, sortOption, currentPage, flightsPerPage, sortFlights]);

  const currentFlights = getCurrentFlights();
  const totalFlights = flightData.length > 0 ? flightData.length : flights.length;
  const hasFlights = totalFlights > 0;
  const isSearching = loadingFlights && !searchPerformed;
  const hasSearchResults = searchPerformed && !isSearching;
  const shouldShowError = showSearchError && searchPerformed;

  // Pagination
  const totalPages = Math.ceil(totalFlights / flightsPerPage);
  const paginate = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Reset pagination on sort or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption, showMainFlights, showReturnFlights]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <Navbar />

      {/* Hero Section */}
      <motion.div 
        className="relative min-h-screen bg-gradient-to-br mt-16 from-blue-900 to-indigo-900"
        variants={fadeIn}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pexels-yurix-sardinelly-504228832-16141006.jpg')] bg-cover bg-center opacity-20"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div 
            className="max-w-4xl mx-auto bg-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10"
            variants={itemVariants}
          >
            <motion.h1 
              className="text-4xl font-bold text-white text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Find Your Perfect Flight
            </motion.h1>

            {isLoading ? (
              <div className="animate-pulse flex flex-col space-y-6">
                <div className="flex space-x-4">
                  <div className="bg-white/20 rounded-lg h-12 w-48"></div>
                  <div className="bg-white/20 rounded-lg h-12 w-48"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/20 rounded-lg h-12"></div>
                  <div className="bg-white/20 rounded-lg h-12"></div>
                  <div className="bg-white/20 rounded-lg h-12"></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/20 rounded-lg h-12"></div>
                  <div className="bg-green-400/50 rounded-lg h-12"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Airport Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    name="from"
                    options={filteredAirports}
                    value={selectedFrom}
                    onChange={handleSelectChange}
                    onInputChange={handleInputChange}
                    placeholder="From where?"
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.75rem',
                        border: state.isFocused 
                          ? '2px solid #4F46E5' 
                          : selectedFrom 
                          ? '2px solid #4F46E5' 
                          : '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: state.isFocused ? '0 0 0 1px #4F46E5' : 'none',
                        minHeight: '52px',
                        color: '#1f2937',
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontSize: '16px',
                      }),
                      option: (base, state) => ({
                        ...base,
                        background: state.isSelected 
                          ? '#4F46E5' 
                          : state.isFocused 
                          ? 'rgba(79, 70, 229, 0.1)' 
                          : 'white',
                        color: state.isSelected ? 'white' : '#1f2937',
                        padding: '12px 16px',
                        fontSize: '15px',
                      }),
                    }}
                  />
                  <Select
                    name="to"
                    options={filteredAirports}
                    value={selectedTo}
                    onChange={handleSelectChange}
                    onInputChange={handleInputChange}
                    placeholder="Going to?"
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.75rem',
                        border: state.isFocused 
                          ? '2px solid #4F46E5' 
                          : selectedTo 
                          ? '2px solid #4F46E5' 
                          : '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: state.isFocused ? '0 0 0 1px #4F46E5' : 'none',
                        minHeight: '52px',
                        color: '#1f2937',
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontSize: '16px',
                      }),
                      option: (base, state) => ({
                        ...base,
                        background: state.isSelected 
                          ? '#4F46E5' 
                          : state.isFocused 
                          ? 'rgba(79, 70, 229, 0.1)' 
                          : 'white',
                        color: state.isSelected ? 'white' : '#1f2937',
                        padding: '12px 16px',
                        fontSize: '15px',
                      }),
                    }}
                  />
                </div>

                {/* Date and Sort Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      className="w-full p-4 rounded-lg text-black bg-white/95 border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholderText="Departure Date"
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy"
                      required
                      showPopperArrow={false}
                    />
                  </div>
                  <div>
                    <DatePicker
                      selected={returnDate}
                      onChange={(date) => setReturnDate(date)}
                      className="w-full p-4 rounded-lg text-black bg-white/95 border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      placeholderText="Return Date (Optional)"
                      minDate={startDate || new Date()}
                      dateFormat="MMMM d, yyyy"
                      showPopperArrow={false}
                    />
                  </div>
                  <Select
                    name="sort"
                    options={[
                      { value: 'price', label: 'Sort by Price (Low to High)' },
                      { value: 'duration', label: 'Sort by Duration (Shortest First)' },
                      { value: 'departureTime', label: 'Sort by Departure Time' },
                    ]}
                    value={{ value: sortOption, label: `Sort by ${sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}` }}
                    onChange={(option) => setSortOption(option?.value || 'price')}
                    classNamePrefix="react-select"
                    isSearchable={false}
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: 'none',
                        minHeight: '52px',
                      }),
                      placeholder: (base) => ({ ...base, color: 'rgba(0, 0, 0, 0.6)' }),
                    }}
                  />
                </div>

                {/* Passenger Selection */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full p-4 bg-white/90 rounded-lg font-semibold text-gray-800 hover:bg-white/100 transition-all border border-gray-300 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">👥</span>
                      <span>Passengers</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      totalPassengers === 0 ? 'bg-red-500 text-white' : 
                      totalPassengers <= 4 ? 'bg-green-500 text-white' : 
                      'bg-yellow-500 text-white'
                    }`}>
                      {totalPassengers}
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                      >
                        <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                          {[
                            { label: 'Adults (12+)', type: 'adults' as const },
                            { label: 'Children (2-11)', type: 'children' as const },
                            { label: 'Infants (0-2)', type: 'infants' as const },
                          ].map(({ label, type }, index) => (
                            <motion.div
                              key={type}
                              className="flex justify-between items-center py-2 px-2 rounded"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <span className="font-medium text-gray-700">{label}</span>
                              <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => decrement(type)}
                                  className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={passengers[type] === 0 || (type === 'infants' && !hasAdultOrSenior())}
                                >
                                  <span className="text-gray-600 text-sm">-</span>
                                </button>
                                <span className="w-8 text-center font-semibold text-gray-800 min-w-[32px]">
                                  {passengers[type]}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => increment(type)}
                                  className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={totalPassengers >= 9 || (type === 'infants' && !hasAdultOrSenior())}
                                >
                                  <span className="text-gray-600 text-sm">+</span>
                                </button>
                              </div>
                            </motion.div>
                          ))}
                          
                          {totalPassengers > 0 && (
                            <motion.div 
                              className="pt-3 border-t border-gray-200 bg-gray-50 rounded-lg p-3"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-800">Total:</span>
                                <span className={`font-bold text-lg ${
                                  totalPassengers <= 4 ? 'text-green-600' : 
                                  totalPassengers <= 6 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {totalPassengers} Passenger{totalPassengers !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {totalPassengers > 6 && (
                                <p className="text-xs text-red-600 mt-1">Large groups may have limited availability</p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loadingFlights || !selectedFrom || !selectedTo || !startDate || totalPassengers === 0}
                  className={`w-full p-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-3 ${
                    loadingFlights || !selectedFrom || !selectedTo || !startDate || totalPassengers === 0
                      ? 'bg-gray-500/50 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25'
                  }`}
                >
                  {loadingFlights ? (
                    <>
                      <LoadingSpinner size={20} color="white" small />
                      <span>Searching for flights...</span>
                    </>
                  ) : (
                    <>
                      <span>✈️</span>
                      <span>Find {totalPassengers} Flight{totalPassengers !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </motion.button>

                {/* Search Requirements */}
                {!loadingFlights && (
                  <div className="text-xs text-white/60 text-center space-y-1 pt-4 border-t border-white/10">
                    <p>• Select cities and date</p>
                    <p>• Choose {totalPassengers > 0 ? `${totalPassengers} passenger${totalPassengers !== 1 ? 's' : ''}` : 'passengers'}</p>
                  </div>
                )}
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Results Section */}
      {searchPerformed && (
        <motion.div 
          ref={listingRef}
          className="relative bg-gray-900/95 min-h-screen py-16"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-4">
            {/* Results Header */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h2 
                className="text-4xl font-bold text-white mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Your Flight Results
              </motion.h2>
              
              {hasSearchResults && !shouldShowError && (
                <motion.p 
                  className="text-xl text-blue-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Found {totalFlights} option{totalFlights !== 1 ? 's' : ''} for your trip from{' '}
                  <span className="font-semibold">{selectedFrom?.label}</span> to{' '}
                  <span className="font-semibold">{selectedTo?.label}</span>
                </motion.p>
              )}
            </motion.div>

            {/* Flight Type Toggle */}
            <motion.div 
              className="flex justify-center mb-10 space-x-4 max-w-md mx-auto"
              variants={itemVariants}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all shadow-lg ${
                  showMainFlights
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
                    : 'bg-white/10 text-gray-300 border-2 border-white/20 hover:bg-white/20'
                }`}
                onClick={() => toggleFlights('main')}
              >
                <span className="mr-2">→</span>
                Outbound ({totalFlights})
              </motion.button>
              
              {returnDate && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all shadow-lg ${
                    showReturnFlights
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-purple-500/25'
                      : 'bg-white/10 text-gray-300 border-2 border-white/20 hover:bg-white/20'
                  }`}
                  onClick={() => toggleFlights('return')}
                >
                  <span className="mr-2">↩️</span>
                  Return ({returnFlights.length})
                </motion.button>
              )}
            </motion.div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto">
              {/* Loading State */}
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
                >
                  <LoadingSpinner size={64} color="#4F46E5" />
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Searching Flights</h3>
                    <p className="text-gray-400">Finding the best options for your {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''} trip</p>
                  </div>
                </motion.div>
              )}

              {/* Success with Flights */}
              {hasSearchResults && hasFlights && !shouldShowError && showMainFlights && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Success Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-green-100 font-semibold">
                        Excellent! Found {totalFlights} great flight option{totalFlights !== 1 ? 's' : ''} for your trip
                      </span>
                    </div>
                  </motion.div>

                  {/* Flight Cards */}
                  <AnimatePresence>
                    {currentFlights.map((flight, index) => (
                      <motion.div
                        key={`${flight.flightNumber}-${index}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all shadow-xl"
                        whileHover={{ 
                          scale: 1.02, 
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)" 
                        }}
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                          
                          {/* Flight Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="text-3xl font-bold text-white">
                                {flight.departureTime}
                              </div>
                              <div className="text-2xl text-gray-300">→</div>
                              <div className="text-3xl font-bold text-white">
                                {flight.arrivalTime}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-300">
                              <div className="flex items-center space-x-2">
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                                  {flight.departureAirport}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{flight.arrivalAirport}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{flight.duration}</span>
                              </div>
                              <div className={`flex items-center space-x-1 ${
                                flight.stops === '0' ? 'text-green-400' : 'text-gray-400'
                              }`}>
                                <span>{flight.stops === '0' ? 'Direct' : `${flight.stops} Stop${flight.stops !== '1' ? 's' : ''}`}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
                                {flight.flightNumber}
                              </span>
                              <span className="text-gray-300">{flight.airline || 'Multiple Airlines'}</span>
                            </div>
                          </div>

                          {/* Price and Book */}
                          <div className="text-right space-y-4 min-w-fit">
                            <div className="text-4xl font-bold text-green-400">
                              ₹{(flight.price || 0).toLocaleString('en-IN')}
                            </div>
                            
                            <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                              Save ₹750 with INTSAVER
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all tracking-wide text-sm"
                              onClick={() => {
                                try {
                                  dispatch(setBookDetail(flight));
                                  dispatch(setSelectedPassengers(passengers));
                                  dispatch(clearSelectedSeat());
                                  router.push('/user/flight/selectSeats');
                                } catch (error) {
                                  console.error('Booking error:', error);
                                  Swal.fire({
                                    title: 'Booking Error',
                                    text: 'Unable to proceed with booking. Please try again.',
                                    icon: 'error',
                                    background: '#282c34',
                                    color: '#fff',
                                  });
                                }
                              }}
                            >
                              Book Flight
                            </motion.button>

                            <div className="text-xs text-gray-400 text-center">
                              Partially refundable
                            </div>
                          </div>
                        </div>

                        {/* Baggage Info */}
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-400">
                          <span>🧳 20kg baggage included</span>
                          <span>⚡ Free meal on board</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* All flights shown */}
                  {hasFlights && totalFlights <= flightsPerPage && (
                    <motion.div
                      className="text-center py-8 bg-white/5 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-green-400 font-semibold">
                        ✅ Showing all {totalFlights} available flight{totalFlights !== 1 ? 's' : ''}
                      </p>
                    </motion.div>
                  )}

                  {/* Pagination */}
                  {hasFlights && totalPages > 1 && (
                    <motion.div
                      className="flex justify-center mt-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex space-x-2 bg-white/5 rounded-full p-2 backdrop-blur-sm border border-white/10">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-10 h-10 rounded-full transition-all flex items-center justify-center font-semibold ${
                              currentPage === i + 1
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                            onClick={() => paginate(i + 1)}
                          >
                            {i + 1}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Results Footer */}
                  {hasFlights && (
                    <motion.div
                      className="text-center mt-8 p-4 bg-white/5 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-gray-400 text-sm">
                        Showing {currentFlights.length} of {totalFlights} results for{' '}
                        <span className="text-blue-300">{selectedFrom?.label} → {selectedTo?.label}</span> on{' '}
                        <span className="text-blue-300">{startDate?.toLocaleDateString('en-IN')}</span>
                        {totalPassengers > 1 && ` for ${totalPassengers} passengers`}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* No Results */}
              {hasSearchResults && !hasFlights && !shouldShowError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center space-y-6 max-w-2xl mx-auto"
                >
                  <div className="w-48 h-48 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-6xl">✈️</span>
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-4">No Flights Available</h3>
                    <p className="text-gray-400 text-lg mb-6 max-w-md">
                      We couldn't find flights for <strong>{selectedFrom?.label} to {selectedTo?.label}</strong> on{' '}
                      <strong>{startDate?.toLocaleDateString('en-IN')}</strong>.
                    </p>
                    
                    {totalPassengers > 1 && (
                      <p className="text-yellow-400 text-sm mb-6">
                        Tip: Large groups ({totalPassengers} passengers) may have limited availability. Try searching for fewer passengers.
                      </p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchPerformed(false);
                      setSelectedFrom(null);
                      setSelectedTo(null);
                      setStartDate(null);
                      setReturnDate(null);
                      setPassengers({ adults: 1, seniors: 0, children: 0, infants: 0 });
                      dispatch(clearFlights());
                      setFlightData([]);
                    }}
                    className="px-8 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg"
                  >
                    🔄 Modify Search
                  </motion.button>
                </motion.div>
              )}

              {/* Error State */}
              {shouldShowError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-red-100 mb-2">Search Failed</h3>
                      <p className="text-red-200 mb-4 max-w-md mx-auto leading-relaxed">
                        {searchErrorMessage || "We couldn't complete your flight search due to a technical issue."}
                      </p>
                      <p className="text-red-300 text-sm">Don't worry, this is on our end - please try again!</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSearch}
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all"
                      >
                        🔄 Try Again
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSearchPerformed(false);
                          setShowSearchError(false);
                          setSelectedFrom(null);
                          setSelectedTo(null);
                          setStartDate(null);
                          setReturnDate(null);
                          setPassengers({ adults: 1, seniors: 0, children: 0, infants: 0 });
                          dispatch(clearFlights());
                          setFlightData([]);
                        }}
                        className="px-6 py-3 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-500 transition-all"
                      >
                        🏠 New Search
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Return Flights Section */}
              {showReturnFlights && returnDate && hasSearchResults && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-12"
                >
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Return Flight Options
                  </h3>
                  
                  {loadingReturnFlights ? (
                    <div className="flex justify-center py-12">
                      <PlaneLoader />
                    </div>
                  ) : returnFlights.length > 0 ? (
                    <div className="space-y-4">
                      {returnFlights.slice(0, 5).map((flight, index) => (
                        <motion.div
                          key={`${flight.flightNumber}-${index}`}
                          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                          whileHover={{ scale: 1.02 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="text-xl font-semibold text-purple-300">
                                {flight.departureTime} - {flight.arrivalTime}
                              </div>
                              <div className="text-gray-300">
                                {flight.departureAirport} → {flight.arrivalAirport}
                              </div>
                              <div className="text-sm text-gray-400">
                                {flight.duration} • {flight.stops === '0' ? 'Direct' : `${flight.stops} stop`}
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <div className="text-2xl font-bold text-white">
                                ₹{(flight.price || 0).toLocaleString()}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                                onClick={() => handleSelectReturnFlight(flight)}
                              >
                                Select Return
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">↩️</span>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-300 mb-2">
                        No Return Flights Available
                      </h4>
                      <p className="text-gray-500">
                        You can book a one-way ticket or try different return dates.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/95 border-t border-white/10 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img src="/logo_airline.png" className="h-10" alt="Skybeats Logo" />
              <span className="text-white font-semibold">Skybeats</span>
            </div>
            <div className="flex space-x-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
            © 2024 Skybeats. All rights reserved. Your journey, our promise.
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default ListFlights;
