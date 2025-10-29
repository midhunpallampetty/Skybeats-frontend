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
  const fontSize = small ? 'text-sm' : 'text-lg';
  
  return (
    <div className="flex justify-center items-center space-x-2">
      <div 
        className={`animate-spin rounded-full border-4 border-solid border-current border-r-transparent ${small ? 'border-2' : ''}`} 
        style={{ 
          width: `${spinnerSize}px`, 
          height: `${spinnerSize}px`, 
          borderColor: color,
          borderRightColor: 'transparent'
        }}
      ></div>
      {!small && <span className={`text-white ${fontSize} font-medium`}>Loading...</span>}
    </div>
  );
};

// Custom SVG airplane loader for SSR and client-side
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
          <path 
            d="M60 20 L75 80 L60 70 L45 80 Z" 
            fill="#4F46E5" 
          />
          <rect 
            x="57" 
            y="70" 
            width="6" 
            height="30" 
            rx="3" 
            fill="#3B82F6" 
          />
        </svg>
      </div>
    </div>
  );
}

const ListFlights: React.FC = () => {
  const Navbar = dynamic(() => import('../../../components/Navbar'), { ssr: true });
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Redux selectors
  const airports = useSelector((state: RootState) => state.airports.airports);
  const filteredAirports = useSelector((state: RootState) => state.airports.filteredAirports);
  const flights = useSelector((state: RootState) => state.flights.flights);

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
    adults: 0,
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
  const [searchError, setSearchError] = useState<string | null>(null); // Separate error state for search
  const listingRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('=== FLIGHTS DEBUG ===');
    console.log('Redux flights:', flights);
    console.log('Redux flights length:', flights.length);
    console.log('loadingFlights:', loadingFlights);
    console.log('searchPerformed:', searchPerformed);
    console.log('searchError:', searchError);
    console.log('selectedFrom:', selectedFrom);
    console.log('selectedTo:', selectedTo);
    console.log('startDate:', startDate);
    console.log('===================');
  }, [flights, loadingFlights, searchPerformed, searchError, selectedFrom, selectedTo, startDate]);

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

  // Fetch Airports
  useEffect(() => {
    const fetchAirports = async () => {
      if (hasFetched.current) return;

      try {
        hasFetched.current = true;
        console.log('Fetching airports...');
        const response = await axiosInstance.get('/getAirports');
        console.log('Airports response:', response);
        
        const airportsData: Airport[] = response.data;
        console.log('Airports fetched:', airportsData.length);

        const airportOptions = airportsData.map((airport) => ({
          value: airport.code,
          label: `${airport.city} (${airport.code}) ${airport.country}`,
        }));

        dispatch(setAirports(airportOptions));
        dispatch(setFilteredAirports(airportOptions));
        console.log('Airports dispatched to Redux');
      } catch (error) {
        console.error('Error fetching airports:', error);
        Swal.fire({
          text: 'Error Fetching Airports',
          background: '#282c34',
          color: '#fff',
          confirmButtonColor: '#4CAF50',
        });
      }
    };

    fetchAirports();
  }, [dispatch]);

  // Passenger count functions
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

  // Toggle flight types
  const toggleFlights = (type: 'main' | 'return') => {
    if (type === 'main') {
      setShowMainFlights(true);
      setShowReturnFlights(false);
      setCurrentPage(1);
    } else {
      setShowMainFlights(false);
      setShowReturnFlights(true);
      setCurrentPage(1);
      if (returnDate && selectedFrom && selectedTo) {
        fetchReturnFlights();
      }
    }
  };

  // Fetch return flights
  const fetchReturnFlights = async () => {
    if (!returnDate || !selectedFrom || !selectedTo) {
      Swal.fire('Please select a return date and destinations.');
      return;
    }

    setLoadingReturnFlights(true);
    try {
      const fromCity = selectedTo?.label.split(' ')[0].toLowerCase();
      const toCity = selectedFrom?.label.split(' ')[0].toLowerCase();
      
      console.log('=== RETURN FLIGHTS DEBUG ===');
      console.log('Fetching return flights:', { fromCity, toCity, returnDate });
      
      const response = await axiosInstance.post('/searchFlights', {
        from: fromCity,
        to: toCity,
        date: returnDate,
      });

      console.log('Return flights response status:', response.status);
      console.log('Return flights response data:', response.data);
      
      const flightData = Array.isArray(response.data) ? response.data : [];
      console.log('Return flights processed:', flightData.length);
      
      setReturnFlights(flightData);
    } catch (error: any) {
      console.error('=== RETURN FLIGHTS ERROR ===');
      console.error('Return flight error:', error);
      console.error('Return flight error response:', error.response);
      setReturnFlights([]);
      Swal.fire({
        title: 'Return Flights Error',
        text: 'Failed to fetch return flights. You can still proceed with a one-way ticket.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
      });
    } finally {
      setLoadingReturnFlights(false);
    }
  };

  // Handle return flight selection
  const handleSelectReturnFlight = (flight: Flight) => {
    dispatch(selectReturnFlight(flight));
    Swal.fire({
      title: 'Return Flight Selected!',
      text: `${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has been selected as your return flight.`,
      icon: 'success',
      confirmButtonText: 'OK',
      background: '#282c34',
      color: '#fff',
    });
  };

  // Handle select change
  const handleSelectChange = (
    selectedOption: SingleValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => {
    setSearchError(null); // Clear any previous search errors
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
      setTimeout(() => setError(''), 3000);
    }
  }, [error]);

  // Debounced input change for airport search
  const handleInputChange = useCallback(
    debounce((inputValue: string) => {
      setError('');
      setSearchError(null);
      if (!inputValue.trim()) {
        dispatch(setFilteredAirports(airports));
        return;
      }
      const filteredOptions = airports.filter((airport) =>
        airport.label.toLowerCase().includes(inputValue.toLowerCase())
      );
      dispatch(setFilteredAirports(filteredOptions));
    }, 300),
    [airports, dispatch]
  );

  // Main search handler - FIXED ERROR HANDLING
  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Clear previous state
    setSearchError(null);
    setSearchPerformed(false);
    dispatch(clearFlights());
    
    console.log('=== SEARCH DEBUG START ===');
    console.log('Search initiated with:');
    console.log('- selectedFrom:', selectedFrom);
    console.log('- selectedTo:', selectedTo);
    console.log('- startDate:', startDate);
    console.log('- totalPassengers:', totalPassengers);
    console.log('- passengers:', passengers);

    setLoadingFlights(true);

    // Validation
    if (!selectedFrom || !selectedTo) {
      Swal.fire({
        title: 'Missing Locations',
        text: 'Please select both "From" and "To" locations.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
      });
      setLoadingFlights(false);
      return;
    }

    if (!startDate) {
      Swal.fire({
        title: 'Missing Date',
        text: 'Please select a departure date.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
      });
      setLoadingFlights(false);
      return;
    }

    if (totalPassengers === 0) {
      Swal.fire({
        title: 'Missing Passengers',
        text: 'Please select at least one passenger.',
        icon: 'warning',
        background: '#1E3A8A',
        color: '#fff',
        confirmButtonColor: '#4F46E5',
      });
      setLoadingFlights(false);
      return;
    }

    const from = selectedFrom.label.split(' ')[0].toLowerCase();
    const to = selectedTo.label.split(' ')[0].toLowerCase();
    const searchRequest = { from, to, date: startDate };

    console.log('Search request payload:', searchRequest);

    // Prevent duplicate searches
    if (
      lastSearchRequest.current &&
      JSON.stringify(lastSearchRequest.current) === JSON.stringify(searchRequest)
    ) {
      console.log('Duplicate search detected, using cached results');
      setLoadingFlights(false);
      setSearchPerformed(true);
      return;
    }

    lastSearchRequest.current = searchRequest;

    console.log('Making API call to /searchFlights...');

    // Show loading message
    Swal.fire({
      title: 'Searching Flights...',
      text: 'Please wait while we find the best options for you.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
      background: '#282c34',
      color: '#fff',
    });

    let searchSuccess = false;
    let flightData: Flight[] = [];

    try {
      console.log('API Request details:');
      console.log('- URL: /searchFlights');
      console.log('- Method: POST');
      console.log('- Data:', searchRequest);
      console.log('- Headers:', axiosInstance.defaults.headers.common);

      const response = await axiosInstance.post('/searchFlights', searchRequest);
      
      console.log('=== API RESPONSE SUCCESS ===');
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', response.headers);
      console.log('Raw response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is response data array:', Array.isArray(response.data));

      // Handle different response formats
      if (response.status === 200) {
        // Success case
        searchSuccess = true;
        
        if (Array.isArray(response.data)) {
          flightData = response.data;
          console.log('Flights found in array:', flightData.length);
        } else if (response.data && response.data.flights && Array.isArray(response.data.flights)) {
          flightData = response.data.flights;
          console.log('Flights found in response.flights:', flightData.length);
        } else if (response.data && Array.isArray(response.data.data)) {
          flightData = response.data.data;
          console.log('Flights found in response.data:', flightData.length);
        } else {
          // Empty response or unexpected format
          flightData = [];
          console.log('No flights found in response, treating as empty array');
        }

        console.log('Final flight data:', flightData);
        console.log('First flight sample:', flightData[0]);

        // Close loading
        Swal.close();

        // Smooth scroll to results
        setTimeout(() => {
          if (listingRef.current) {
            listingRef.current.scrollIntoView({ 
              behavior: "smooth", 
              block: "start" 
            });
          }
        }, 100);

        // Update state
        setSearchPerformed(true);
        setLoadingFlights(false);

        // Dispatch to Redux
        console.log('Dispatching', flightData.length, 'flights to Redux...');
        dispatch(setFlights(flightData));
        
        // Set dates
        dispatch(setDate(startDate.toDateString()));
        dispatch(setReturnDate(returnDate?.toDateString() || null));

        // Show results message
        if (flightData.length > 0) {
          setTimeout(() => {
            Swal.fire({
              title: `Found ${flightData.length} flight${flightData.length !== 1 ? 's' : ''}!`,
              text: 'Great options available for your trip.',
              icon: 'success',
              timer: 2500,
              showConfirmButton: false,
              background: '#282c34',
              color: '#fff',
              toast: true,
              position: 'top-end',
            });
          }, 500);
        } else {
          setTimeout(() => {
            Swal.fire({
              title: 'No Flights Available',
              text: 'We couldn\'t find flights for your selected criteria. Try adjusting your search.',
              icon: 'info',
              background: '#282c34',
              color: '#fff',
            });
          }, 500);
        }

      } else {
        // Non-200 status but no exception thrown
        throw new Error(`Unexpected status code: ${response.status}`);
      }

    } catch (error: any) {
      console.log('=== API RESPONSE ERROR ===');
      console.error('Full error object:', error);
      
      // Close loading
      Swal.close();
      
      searchSuccess = false;
      setLoadingFlights(false);
      
      // More detailed error handling
      let errorMessage = 'An unexpected error occurred while searching for flights.';
      
      if (error.response) {
        // Server responded with error status
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        const status = error.response.status;
        if (status === 400) {
          errorMessage = 'Invalid search criteria. Please check your selection.';
        } else if (status === 404) {
          errorMessage = 'Flight search service not found.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server error (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        console.error('Network error - no response received');
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        console.error('Request setup error:', error.message);
        errorMessage = error.message || 'An unknown error occurred.';
      }
      
      console.error('Final error message:', errorMessage);
      setSearchError(errorMessage);
      
      // Show error but don't clear the search performed state
      setSearchPerformed(true);
      
      Swal.fire({
        title: 'Search Error',
        text: errorMessage,
        icon: 'error',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4F46E5',
      });

    } finally {
      console.log('Search operation completed');
      console.log('Final state - searchSuccess:', searchSuccess);
      console.log('Final state - flightData length:', flightData.length);
      console.log('Final state - loadingFlights:', false);
      console.log('=== SEARCH DEBUG END ===');
    }
  };

  // Sort flights function
  const sortFlights = (flights: Flight[], criteria: string) => {
    if (!flights || flights.length === 0) {
      console.log('No flights to sort');
      return [];
    }
    
    console.log('Sorting', flights.length, 'flights by:', criteria);
    const sorted = [...flights];
    
    switch (criteria) {
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB;
        });
      case 'duration':
        return sorted.sort((a, b) => {
          const durationA = a.duration || '';
          const durationB = b.duration || '';
          return durationA.localeCompare(durationB);
        });
      case 'departureTime':
        return sorted.sort((a, b) => {
          const timeA = a.departureTime || '';
          const timeB = b.departureTime || '';
          return timeA.localeCompare(timeB);
        });
      default:
        return sorted;
    }
  };

  // Determine if we should show results
  const shouldShowResults = searchPerformed && !loadingFlights;
  const hasFlights = flights && flights.length > 0;
  const hasError = searchError !== null;
  
  // Only sort and paginate if we have valid data
  const sortedFlights = hasFlights && shouldShowResults 
    ? sortFlights(flights, sortOption) 
    : [];
    
  const sortedReturnFlights = shouldShowResults 
    ? sortFlights(returnFlights, sortOption) 
    : [];
  
  const indexOfLastFlight = currentPage * flightsPerPage;
  const indexOfFirstFlight = indexOfLastFlight - flightsPerPage;
  const currentFlights = sortedFlights.slice(indexOfFirstFlight, indexOfLastFlight);
  const currentReturnFlights = sortedReturnFlights.slice(indexOfFirstFlight, indexOfLastFlight);

  console.log('=== RENDER DEBUG ===');
  console.log('shouldShowResults:', shouldShowResults);
  console.log('hasFlights:', hasFlights);
  console.log('hasError:', hasError);
  console.log('flights.length:', flights.length);
  console.log('currentFlights.length:', currentFlights.length);
  console.log('===================');

  // Pagination
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset pagination when switching tabs or sorting
  useEffect(() => {
    setCurrentPage(1);
  }, [showMainFlights, showReturnFlights, sortOption]);

  // Animation variants
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

  // Show results section based on search state
  const showResultsSection = searchPerformed;

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
                    className="react-select-container text-black"
                    classNamePrefix="react-select"
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: selectedFrom ? '1px solid #4F46E5' : '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'none',
                        minHeight: '48px'
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: 'rgba(0, 0, 0, 0.6)'
                      }),
                      indicatorSeparator: (base) => ({
                        ...base,
                        backgroundColor: 'transparent'
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
                    className="react-select-container text-black"
                    classNamePrefix="react-select"
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: selectedTo ? '1px solid #4F46E5' : '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'none',
                        minHeight: '48px'
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: 'rgba(0, 0, 0, 0.6)'
                      }),
                      indicatorSeparator: (base) => ({
                        ...base,
                        backgroundColor: 'transparent'
                      })
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => {
                        setStartDate(date);
                        setSearchError(null);
                      }}
                      className="w-full p-3 rounded-lg text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholderText="Departure Date"
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy"
                      required
                    />
                  </div>
                  <div>
                    <DatePicker
                      selected={returnDate}
                      onChange={(date: Date | null) => {
                        setReturnDate(date);
                        setSearchError(null);
                      }}
                      className="w-full p-3 rounded-lg text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholderText="Return Date (Optional)"
                      minDate={startDate || new Date()}
                      dateFormat="MMMM d, yyyy"
                    />
                  </div>
                  <Select
                    name="sort"
                    options={[
                      { value: 'price', label: 'Sort by Price (Low to High)' },
                      { value: 'duration', label: 'Sort by Duration (Shortest First)' },
                      { value: 'departureTime', label: 'Sort by Departure Time (Earliest First)' },
                    ]}
                    value={{ 
                      value: sortOption, 
                      label: `Sort by ${sortOption === 'price' ? 'Price' : sortOption === 'duration' ? 'Duration' : 'Departure Time'}`
                    }}
                    onChange={(option: SingleValue<OptionType>) => {
                      setSortOption(option?.value || 'price');
                      setSearchError(null);
                    }}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isSearchable={false}
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'none',
                        minHeight: '48px'
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: 'rgba(0, 0, 0, 0.6)'
                      }),
                      indicatorSeparator: (base) => ({
                        ...base,
                        backgroundColor: 'transparent'
                      })
                    }}
                  />
                </div>

                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    type="button"
                    className="w-full p-3 bg-white/90 rounded-lg font-semibold text-gray-800 hover:bg-white/100 transition-all border border-gray-300 flex items-center justify-between"
                  >
                    <span>Passenger Details</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      totalPassengers === 0 
                        ? 'bg-red-500 text-white' 
                        : totalPassengers < 6 
                        ? 'bg-green-500 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {totalPassengers}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute w-full mt-2 bg-white text-black rounded-lg shadow-xl border border-gray-100 z-50"
                      >
                        <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                          {[
                            { label: 'Adults (18+)', type: 'adults' as const },
                            { label: 'Senior Citizens (65+)', type: 'seniors' as const },
                            { label: 'Children (2-12)', type: 'children' as const },
                            { label: 'Infants (<2)', type: 'infants' as const },
                          ].map(({ label, type }, index) => (
                            <motion.div
                              key={type}
                              className="flex justify-between items-center py-2"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <span className="font-medium text-gray-700">{label}</span>
                              <div className="flex items-center space-x-3">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={() => decrement(type)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                                  disabled={passengers[type] === 0}
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
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                                  disabled={totalPassengers >= 10}
                                >
                                  +
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                          {totalPassengers > 0 && (
                            <motion.div 
                              className="pt-3 border-t border-gray-200"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <p className="text-sm font-semibold text-gray-800">
                                Total: <span className={`font-bold ${totalPassengers <= 6 ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {totalPassengers}
                                </span> passenger{totalPassengers !== 1 ? 's' : ''}
                              </p>
                              {totalPassengers > 6 && (
                                <p className="text-xs text-yellow-600 mt-1">
                                  Note: Large groups may have limited availability
                                </p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Error Display */}
                {searchError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{searchError}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className="text-red-200 hover:text-red-100 text-sm mt-2 underline"
                      onClick={() => {
                        setSearchError(null);
                        setSearchPerformed(false);
                        dispatch(clearFlights());
                      }}
                    >
                      Clear Error and Try Again
                    </motion.button>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className={`w-full p-4 rounded-lg shadow-lg transition-all flex items-center justify-center space-x-2 text-lg font-bold ${
                    loadingFlights || !selectedFrom || !selectedTo || !startDate || totalPassengers === 0
                      ? 'bg-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white'
                  }`}
                  disabled={loadingFlights || !selectedFrom || !selectedTo || !startDate || totalPassengers === 0}
                >
                  {loadingFlights ? (
                    <>
                      <LoadingSpinner size={20} color="#fff" small />
                      <span>Searching Flights...</span>
                    </>
                  ) : (
                    <>
                      <span>✈️</span>
                      <span>Find Flights</span>
                    </>
                  )}
                </motion.button>

                {/* Form Requirements Info */}
                <div className="text-xs text-white/70 text-center space-y-1">
                  <p>✓ Select departure and arrival airports</p>
                  <p>✓ Choose your travel date{totalPassengers > 0 && ` for ${totalPassengers} passenger${totalPassengers !== 1 ? 's' : ''}`}</p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Flight Results Section */}
      {showResultsSection && (
        <motion.div 
          ref={listingRef}
          className="relative bg-gray-900 min-h-screen py-12"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-4">
            {/* Results Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                {hasError ? 'Search Results' : 'Your Flight Results'}
              </h2>
              {hasError ? (
                <p className="text-red-400">Search completed with issues - see details below</p>
              ) : (
                <p className="text-gray-300">
                  {showMainFlights 
                    ? `${flights.length} option${flights.length !== 1 ? 's' : ''} found for your trip`
                    : `${returnFlights.length} return option${returnFlights.length !== 1 ? 's' : ''} available`
                  }
                </p>
              )}
            </motion.div>

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
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
                onClick={() => toggleFlights('main')}
              >
                Outbound ({flights.length})
              </motion.button>
              {returnDate && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    showReturnFlights
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                  onClick={() => toggleFlights('return')}
                >
                  Return ({returnFlights.length})
                </motion.button>
              )}
            </motion.div>

            {/* Main Flights Display */}
            {showMainFlights && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="main-flights"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Loading State */}
                  {loadingFlights && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-24 space-y-4"
                    >
                      <LoadingSpinner size={80} color="#4F46E5" />
                      <p className="text-white text-lg">Still searching for the best flights...</p>
                      <p className="text-gray-400 text-sm">Please wait</p>
                    </motion.div>
                  )}

                  {/* Success with Flights */}
                  {!loadingFlights && hasFlights && !hasError && (
                    <>
                      <motion.div
                        className="bg-green-500/20 border border-green-500/30 text-green-100 p-4 rounded-lg mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">
                            Successfully found {flights.length} flight{flights.length !== 1 ? 's' : ''}!
                          </span>
                        </div>
                      </motion.div>

                      {currentFlights.map((flight, index) => (
                        <motion.div
                          key={`${flight.flightNumber}-${index}`}
                          className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all border border-white/10"
                          whileHover={{ scale: 1.02 }} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                            <div className="space-y-3 flex-1">
                              <div className="text-2xl font-bold text-white">
                                {flight.departureTime} - {flight.arrivalTime}
                              </div>
                              <div className="text-lg text-gray-300">
                                <span className="text-blue-300">{flight.departureAirport}</span>
                                <span className="mx-2 text-white">→</span> 
                                <span className="text-blue-300">{flight.arrivalAirport}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  {flight.duration}
                                </span>
                                <span>•</span>
                                <span className={flight.stops === '0' ? 'text-green-400' : 'text-gray-400'}>
                                  {flight.stops === '0' ? 'Direct Flight' : `${flight.stops} stop${flight.stops !== '1' ? 's' : ''}`}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                  {flight.flightNumber}
                                </span>
                                <span>•</span>
                                <span className="text-gray-300">{flight.airline || 'Various Airlines'}</span>
                              </div>
                            </div>
                            <div className="text-right space-y-3 min-w-fit">
                              <div className="text-3xl font-bold text-white">
                                ₹{(flight.price || 0).toLocaleString()}
                              </div>
                              <div className="text-sm text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded">
                                Save ₹750 with INTSAVER
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-full shadow-lg hover:from-green-500 hover:to-green-600 transition-all w-full sm:w-auto text-sm tracking-wide"
                                onClick={() => {
                                  console.log('=== BOOKING DEBUG ===');
                                  console.log('Booking flight:', flight);
                                  console.log('Passengers:', passengers);
                                  dispatch(setBookDetail(flight));
                                  dispatch(setSelectedPassengers(passengers));
                                  dispatch(clearSelectedSeat());
                                  router.push('/user/flight/selectSeats');
                                }}
                              >
                                Book Now
                              </motion.button>
                              <div className="text-xs text-gray-400">
                                Partially refundable
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* All flights shown message */}
                      {flights.length > 0 && flights.length <= flightsPerPage && (
                        <motion.div
                          className="text-center py-8 bg-white/5 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-gray-300">
                            ✅ Showing all {flights.length} available flight{flights.length !== 1 ? 's' : ''}
                          </p>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* Error State with Flights */}
                  {!loadingFlights && hasError && hasFlights && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <motion.div
                        className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-100 p-6 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h3 className="text-lg font-semibold">Partial Results</h3>
                            <p className="text-sm">We encountered an issue but still found {flights.length} flight{flights.length !== 1 ? 's' : ''}.</p>
                            <p className="text-xs mt-1">{searchError}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Show available flights */}
                      {currentFlights.map((flight, index) => (
                        <motion.div
                          key={`${flight.flightNumber}-${index}`}
                          className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all border border-yellow-500/20"
                          whileHover={{ scale: 1.02 }} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          {/* Same flight card structure as above */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                            <div className="space-y-3 flex-1">
                              <div className="text-2xl font-bold text-white">
                                {flight.departureTime} - {flight.arrivalTime}
                              </div>
                              <div className="text-lg text-gray-300">
                                <span className="text-blue-300">{flight.departureAirport}</span>
                                <span className="mx-2 text-white">→</span> 
                                <span className="text-blue-300">{flight.arrivalAirport}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  {flight.duration}
                                </span>
                                <span>•</span>
                                <span className={flight.stops === '0' ? 'text-green-400' : 'text-gray-400'}>
                                  {flight.stops === '0' ? 'Direct Flight' : `${flight.stops} stop${flight.stops !== '1' ? 's' : ''}`}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                  {flight.flightNumber}
                                </span>
                                <span>•</span>
                                <span className="text-gray-300">{flight.airline || 'Various Airlines'}</span>
                              </div>
                            </div>
                            <div className="text-right space-y-3 min-w-fit">
                              <div className="text-3xl font-bold text-white">
                                ₹{(flight.price || 0).toLocaleString()}
                              </div>
                              <div className="text-sm text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded">
                                Save ₹750 with INTSAVER
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-full shadow-lg hover:from-green-500 hover:to-green-600 transition-all w-full sm:w-auto text-sm tracking-wide"
                                onClick={() => {
                                  dispatch(setBookDetail(flight));
                                  dispatch(setSelectedPassengers(passengers));
                                  dispatch(clearSelectedSeat());
                                  router.push('/user/flight/selectSeats');
                                }}
                              >
                                Book Now
                              </motion.button>
                              <div className="text-xs text-gray-400">
                                Partially refundable
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* No Flights */}
                  {!loadingFlights && !hasFlights && !hasError && searchPerformed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                    >
                      <div className="w-64 h-48 bg-white/10 rounded-lg shadow-2xl flex items-center justify-center mb-6">
                        <span className="text-6xl">✈️</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">
                          No Flights Available
                        </h3>
                        <p className="text-gray-400 max-w-md mb-6">
                          We couldn't find any flights matching your criteria for{' '}
                          <span className="font-semibold text-white">{selectedFrom?.label} to {selectedTo?.label}</span> on{' '}
                          <span className="font-semibold text-white">{startDate?.toLocaleDateString()}</span>.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSearchPerformed(false);
                            setSearchError(null);
                            setSelectedFrom(null);
                            setSelectedTo(null);
                            setStartDate(null);
                            setReturnDate(null);
                            setPassengers({ adults: 0, seniors: 0, children: 0, infants: 0 });
                            dispatch(clearFlights());
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-8 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all"
                        >
                          Modify Search
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Pure Error State */}
                  {!loadingFlights && !hasFlights && hasError && searchPerformed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                    >
                      <div className="w-64 h-48 bg-red-500/10 rounded-lg border-2 border-red-500/20 shadow-2xl flex items-center justify-center mb-6">
                        <svg className="w-16 h-16 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-red-300 mb-2">Search Failed</h3>
                        <p className="text-gray-400 max-w-md mb-6">
                          We encountered an issue while searching for flights. No results were returned.
                        </p>
                        <p className="text-red-300 font-medium mb-4 max-w-md">
                          {searchError}
                        </p>
                        <div className="space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSearchError(null);
                              setSearchPerformed(false);
                              dispatch(clearFlights());
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all"
                          >
                            Try New Search
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-500 transition-all"
                          >
                            Refresh Page
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Return Flights Display */}
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
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <PlaneLoader />
                    <p className="text-white text-lg">Loading return flight options...</p>
                  </div>
                ) : returnFlights.length > 0 ? (
                  returnFlights.map((flight, index) => (
                    <motion.div
                      key={`${flight.flightNumber}-${index}`}
                      className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl hover:bg-white/10 transition-all border border-white/10"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      {/* Similar structure to main flights but with return styling */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div className="space-y-3 flex-1">
                          <div className="text-2xl font-bold text-white">
                            {flight.departureTime} - {flight.arrivalTime}
                          </div>
                          <div className="text-lg text-gray-300">
                            <span className="text-purple-300">{flight.departureAirport}</span>
                            <span className="mx-2 text-white">→</span> 
                            <span className="text-purple-300">{flight.arrivalAirport}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              {flight.duration}
                            </span>
                            <span>•</span>
                            <span className={flight.stops === '0' ? 'text-green-400' : 'text-gray-400'}>
                              {flight.stops === '0' ? 'Direct Flight' : `${flight.stops} stop${flight.stops !== '1' ? 's' : ''}`}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                              {flight.flightNumber}
                            </span>
                            <span>•</span>
                            <span className="text-gray-300">{flight.airline || 'Various Airlines'}</span>
                          </div>
                        </div>
                        <div className="text-right space-y-3 min-w-fit">
                          <div className="text-3xl font-bold text-white">
                            ₹{(flight.price || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded">
                            Save ₹750 with INTSAVER
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-bold rounded-full shadow-lg hover:from-purple-500 hover:to-purple-600 transition-all w-full sm:w-auto text-sm tracking-wide"
                            onClick={() => handleSelectReturnFlight(flight)}
                          >
                            Select Return
                          </motion.button>
                          <div className="text-xs text-gray-400">
                            Partially refundable
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : !loadingReturnFlights && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-64 h-48 bg-white/10 rounded-lg shadow-2xl flex items-center justify-center mb-6">
                      <span className="text-6xl">↩️</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      No Return Flights Available
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      We couldn't find any return flights for your selected dates. 
                      You can still book a one-way ticket or adjust your return date.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pagination */}
            {((showMainFlights && hasFlights && flights.length > flightsPerPage) || 
              (showReturnFlights && returnFlights.length > flightsPerPage)) && 
              !loadingFlights && !hasError && (
              <motion.div
                className="flex justify-center mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <nav className="flex space-x-2 bg-white/5 rounded-full p-2 backdrop-blur-sm border border-white/10">
                  {Array.from(
                    { 
                      length: Math.max(
                        1, 
                        Math.ceil(
                          (showMainFlights ? flights.length : returnFlights.length) / flightsPerPage
                        )
                      ) 
                    },
                    (_, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center font-medium ${
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

            {/* Results Info */}
            {shouldShowResults && !loadingFlights && (
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {hasFlights && !hasError && (
                  <p className="text-gray-400 text-sm">
                    Showing {currentFlights.length} of {flights.length} results 
                    <span className="ml-2 text-blue-400">
                      {showMainFlights ? `• ${selectedFrom?.label || ''} → ${selectedTo?.label || ''}` : ''}
                    </span>
                  </p>
                )}
                {hasError && !hasFlights && (
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ {searchError}
                  </p>
                )}
              </motion.div>
            )}
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
