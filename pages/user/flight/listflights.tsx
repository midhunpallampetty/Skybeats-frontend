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

// Custom retry utility function
const createRetryStrategy = (maxRetries = 3, baseDelay = 1000) => {
  return async <T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error?: Error) => void
  ): Promise<{ data: T; attempts: number; wasRetried: boolean }> => {
    let lastError: Error | null = null;
    let attempts = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} for operation`);
        const result = await operation();
        
        console.log(`✅ Success on attempt ${attempt}`);
        return { 
          data: result, 
          attempts, 
          wasRetried: attempt > 1 
        };
      } catch (error: any) {
        attempts = attempt;
        lastError = error;
        
        // Log retry info
        console.warn(`⚠️  Attempt ${attempt} failed:`, {
          message: error.message,
          status: error.response?.status,
          code: error.code,
          timestamp: new Date().toISOString(),
        });

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Determine if we should retry
        const shouldRetry = shouldRetryRequest(error, attempt, maxRetries);
        
        if (!shouldRetry || attempt === maxRetries) {
          console.log(`❌ Max retries reached or non-retryable error`);
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = calculateRetryDelay(attempt, baseDelay, error);
        console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}...`);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Re-throw the last error if all attempts failed
    throw lastError || new Error('Unknown retry failure');
  };
};

// Determine if a request should be retried
const shouldRetryRequest = (error: any, attempt: number, maxRetries: number): boolean => {
  // Don't retry on first attempt if it's clearly unrecoverable
  if (attempt === 1) {
    // Client errors (4xx) - don't retry validation errors
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const status = error.response.status;
      // Don't retry bad requests, unauthorized, or not found
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        return false;
      }
      // Retry other 4xx errors (maybe temporary validation issues)
      return true;
    }
  }

  // Retry on server errors (5xx)
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  // Retry on network errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || !error.response) {
    return true;
  }

  // Retry on rate limiting (429)
  if (error.response?.status === 429) {
    return true;
  }

  // Don't retry on other errors
  return false;
};

// Calculate delay with exponential backoff and jitter
const calculateRetryDelay = (attempt: number, baseDelay: number, error?: any): number => {
  // Base exponential backoff: baseDelay * 2^(attempt-1)
  let delay = baseDelay * Math.pow(2, attempt - 1);
  
  // Maximum delay cap (e.g., 30 seconds)
  const maxDelay = 30000;
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.5 * delay; // 0-50% jitter
  
  // For rate limiting (429), use Retry-After header if available
  if (error?.response?.status === 429 && error.response.headers['retry-after']) {
    const retryAfter = parseInt(error.response.headers['retry-after'], 10) * 1000;
    delay = Math.max(delay, retryAfter);
  }
  
  // For server errors (5xx), add more conservative delays
  if (error?.response?.status >= 500) {
    delay = Math.min(delay * 1.5, maxDelay); // Increase by 50% for server issues
  }

  return Math.min(delay + jitter, maxDelay);
};

// Enhanced axios instance with retry logic
const createApiWithRetry = (axiosInstance: any) => {
  const apiWithRetry = axiosInstance;
  
  // Store retry strategy
  apiWithRetry.retryStrategy = createRetryStrategy(3, 1000);
  
  // Override post method with retry logic
  const originalPost = apiWithRetry.post.bind(apiWithRetry);
  
  apiWithRetry.post = async function(url: string, data?: any, config?: any) {
    return apiWithRetry.retryStrategy(
      async () => {
        const response = await originalPost(url, data, {
          ...config,
          timeout: 30000, // 30 second timeout
          validateStatus: function (status: number) {
            // Don't throw for 2xx or 3xx status codes
            return status >= 200 && status < 400;
          },
        });
        
        // Manually throw for 4xx/5xx if validateStatus didn't catch it
        if (response.status >= 400) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as any).response = response;
          (error as any).status = response.status;
          throw error;
        }
        
        return response;
      },
      (attempt, error) => {
        // Update loading message on retry
        if (attempt > 1 && typeof window !== 'undefined') {
          Swal.update({
            title: `Searching Flights... (Retry ${attempt})`,
            text: error?.response?.status >= 500 
              ? 'Server is temporarily busy, trying again...' 
              : 'Optimizing search, one moment...',
          });
        }
      }
    );
  };

  return apiWithRetry;
};

// Create retry-enabled axios instance
const apiWithRetry = createApiWithRetry(axiosInstance);

// Custom CSS-based spinner
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

const PlaneLoader = () => (
  <div className="flex justify-center py-24">
    <svg width="80" height="80" viewBox="0 0 120 120" className="animate-spin">
      <path d="M60 20 L75 80 L60 70 L45 80 Z" fill="#4F46E5" />
      <rect x="57" y="70" width="6" height="30" rx="3" fill="#3B82F6" />
    </svg>
  </div>
);

const ListFlights: React.FC = () => {
  const Navbar = dynamic(() => import('../../../components/Navbar'), { ssr: true });
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Safe Redux selectors
  const airports = useSelector((state: RootState) => state.airports?.airports || []);
  const filteredAirports = useSelector((state: RootState) => state.airports?.filteredAirports || []);
  const reduxFlights = useSelector((state: RootState) => state.flights?.flights || []);

  // Enhanced state with retry tracking
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
    adults: 1,
    seniors: 0,
    children: 0,
    infants: 0,
  });
  const [selectedFrom, setSelectedFrom] = useState<SingleValue<OptionType>>(null);
  const [selectedTo, setSelectedTo] = useState<SingleValue<OptionType>>(null);
  const [sortOption, setSortOption] = useState<'price' | 'duration' | 'departureTime'>('price');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [flightsPerPage] = useState<number>(6);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const lastSearchRequest = useRef<any>(null);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [maxRetriesReached, setMaxRetriesReached] = useState(false);
  const [flightData, setFlightData] = useState<Flight[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'retrying' | 'success' | 'error'>('idle');
  const listingRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalPassengers = React.useMemo(() => 
    passengers.adults + passengers.seniors + passengers.children + passengers.infants, 
    [passengers]
  );

  const hasAdultOrSenior = () => passengers.adults + passengers.seniors > 0;

  // Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Clear flights on mount
  useEffect(() => {
    dispatch(clearFlights());
    dispatch(clearSelectedReturnFlight());
  }, [dispatch]);

  // Authentication
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

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Fetch airports with retry
  useEffect(() => {
    const fetchAirports = async () => {
      if (hasFetched.current) return;
      
      try {
        hasFetched.current = true;
        const response = await apiWithRetry.get('/getAirports');
        const airportsData = Array.isArray(response.data) ? response.data : [];
        
        const airportOptions = airportsData.map((airport: Airport) => ({
          value: airport.code,
          label: `${airport.city} (${airport.code}) ${airport.country}`,
        }));

        dispatch(setAirports(airportOptions));
        dispatch(setFilteredAirports(airportOptions));
      } catch (error: any) {
        console.error('Airport fetch failed after retries:', error);
        // Set empty arrays as fallback
        dispatch(setAirports([]));
        dispatch(setFilteredAirports([]));
        
        // Show user-friendly message
        Swal.fire({
          title: 'Loading Issue',
          text: 'Couldn\'t load airport data. You can still search with manual entry.',
          icon: 'warning',
          timer: 3000,
          showConfirmButton: false,
          background: '#282c34',
          color: '#fff',
        });
      }
    };

    if (isOnline) {
      fetchAirports();
    }
  }, [dispatch, isOnline]);

  // Passenger handlers
  const incrementPassenger = useCallback((type: keyof typeof passengers) => {
    if (totalPassengers >= 10) {
      Swal.fire({
        title: 'Group Limit',
        text: 'Maximum 10 passengers per booking.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false,
        background: '#282c34',
        color: '#fff',
      });
      return;
    }

    if ((type === 'children' || type === 'infants') && !hasAdultOrSenior()) {
      Swal.fire({
        title: 'Adult Required',
        text: 'Please add at least one adult before adding children or infants.',
        icon: 'info',
        timer: 2500,
        showConfirmButton: false,
        background: '#282c34',
        color: '#fff',
      });
      return;
    }

    setPassengers(prev => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  }, [totalPassengers, hasAdultOrSenior]);

  const decrementPassenger = useCallback((type: keyof typeof passengers) => {
    setPassengers(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  }, []);

  // Toggle flights
  const toggleFlights = useCallback((type: 'main' | 'return') => {
    setShowMainFlights(type === 'main');
    setShowReturnFlights(type === 'return');
    setCurrentPage(1);
    
    if (type === 'return' && returnDate && selectedFrom && selectedTo && isOnline) {
      fetchReturnFlights();
    }
  }, [returnDate, selectedFrom, selectedTo, isOnline]);

  // Enhanced return flights with retry
  const fetchReturnFlights = useCallback(async () => {
    if (!returnDate || !selectedFrom || !selectedTo || !isOnline) {
      return;
    }

    setLoadingReturnFlights(true);
    setSearchStatus('searching');
    
    const loadingSwal = Swal.fire({
      title: 'Loading Return Options...',
      text: 'Finding flights for your return journey',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => Swal.showLoading(),
      background: '#282c34',
      color: '#fff',
    });

    try {
      const fromCity = selectedTo.label.split(' ')[0].toLowerCase();
      const toCity = selectedFrom.label.split(' ')[0].toLowerCase();
      
      const response = await apiWithRetry.post('/searchFlights', {
        from: fromCity,
        to: toCity,
        date: returnDate,
        passengers: totalPassengers,
      });

      const data = Array.isArray(response.data) ? response.data : 
                   response.data?.flights || response.data?.data || [];
      setReturnFlights(data);
      
      loadingSwal.close();
      
      if (data.length === 0) {
        Swal.fire({
          title: 'No Return Flights',
          text: 'We couldn\'t find return flights for your dates. You can still book one-way or try different dates.',
          icon: 'info',
          background: '#282c34',
          color: '#fff',
          timer: 4000,
        });
      }
    } catch (error: any) {
      console.error('Return flights failed:', error);
      setReturnFlights([]);
      
      loadingSwal.close();
      Swal.fire({
        title: 'Return Flights Unavailable',
        text: 'We couldn\'t load return options. You can proceed with a one-way ticket.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
        timer: 3000,
      });
    } finally {
      setLoadingReturnFlights(false);
      setSearchStatus('idle');
    }
  }, [returnDate, selectedFrom, selectedTo, totalPassengers, isOnline]);

  // Handle return flight selection
  const handleSelectReturnFlight = useCallback((flight: Flight) => {
    try {
      dispatch(selectReturnFlight(flight));
      
      Swal.fire({
        title: 'Return Flight Selected!',
        html: `
          <div class="text-left">
            <p><strong>${flight.flightNumber}</strong></p>
            <p>${flight.departureAirport} → ${flight.arrivalAirport}</p>
            <p>${flight.departureTime} - ${flight.arrivalTime}</p>
          </div>
        `,
        icon: 'success',
        showConfirmButton: true,
        confirmButtonText: 'Continue Booking',
        background: '#282c34',
        color: '#fff',
        confirmButtonColor: '#4F46E5',
      }).then((result) => {
        if (result.isConfirmed) {
          // Proceed to booking
          router.push('/user/flight/selectSeats');
        }
      });
    } catch (error) {
      console.error('Return flight selection error:', error);
      Swal.fire({
        title: 'Selection Issue',
        text: 'Couldn\'t save your return flight. Please try selecting again.',
        icon: 'error',
        background: '#282c34',
        color: '#fff',
      });
    }
  }, [dispatch, router]);

  // Enhanced airport selection
  const handleSelectChange = useCallback((
    selectedOption: SingleValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => {
    setSearchError(null);
    setShowSearchError(false);
    
    if (actionMeta.name === 'from') {
      setSelectedFrom(selectedOption);
      if (selectedTo?.value === selectedOption?.value) {
        setSelectedTo(null);
      }
    } else if (actionMeta.name === 'to') {
      setSelectedTo(selectedOption);
      if (selectedFrom?.value === selectedOption?.value) {
        setSelectedFrom(null);
      }
    }
  }, [selectedFrom, selectedTo]);

  // Enhanced search with comprehensive retry logic
  const handleSearch = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Abort previous search if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear previous states
    setSearchError(null);
    setShowSearchError(false);
    setSearchPerformed(false);
    setMaxRetriesReached(false);
    setRetryAttempts(0);
    setSearchStatus('searching');
    setFlightData([]);
    
    // Validation
    if (!isOnline) {
      Swal.fire({
        title: 'No Internet Connection',
        text: 'Please check your connection and try again.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
      });
      return;
    }

    if (!selectedFrom || !selectedTo) {
      Swal.fire({
        title: 'Select Destinations',
        text: 'Please choose both departure and arrival cities.',
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

    // Prepare search payload
    const searchPayload = {
      from: selectedFrom.label.split(' ')[0].toLowerCase(),
      to: selectedTo.label.split(' ')[0].toLowerCase(),
      date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      passengers: totalPassengers,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      // Add cache busting
      _t: Date.now(),
    };

    console.log('🚀 Starting flight search:', {
      payload: searchPayload,
      timestamp: new Date().toISOString(),
    });

    // Set loading state
    setLoadingFlights(true);
    
    // Create abort controller for timeout
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Set up timeout (45 seconds max)
    searchTimeoutRef.current = setTimeout(() => {
      abortController.abort();
      setSearchStatus('error');
      setLoadingFlights(false);
      Swal.fire({
        title: 'Search Timeout',
        text: 'The search took too long. Please try a narrower date range or fewer passengers.',
        icon: 'warning',
        background: '#282c34',
        color: '#fff',
      });
    }, 45000);

    // Main search operation with retries
    try {
      const result = await apiWithRetry.post('/searchFlights', searchPayload, {
        signal: abortController.signal,
        // Retry configuration
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Clear timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      console.log('✅ Search completed:', {
        attempts: result.attempts,
        wasRetried: result.wasRetried,
        status: result.data.status,
        flightsCount: Array.isArray(result.data.data) ? result.data.data.length : 'unknown',
      });

      setSearchStatus('success');
      setLoadingFlights(false);

      // Process flight data
      let processedFlights: Flight[] = [];
      
      // Handle different API response structures
      const responseData = result.data.data || result.data.flights || result.data || result.data.results;
      
      if (Array.isArray(responseData)) {
        processedFlights = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Try to extract flights from nested structure
        const possibleKeys = ['flights', 'data', 'results', 'items'];
        for (const key of possibleKeys) {
          if (responseData[key] && Array.isArray(responseData[key])) {
            processedFlights = responseData[key];
            break;
          }
        }
      }

      // Validate and filter flights
      const validFlights = processedFlights.filter((flight): flight is Flight => {
        return flight && 
               typeof flight === 'object' && 
               flight.flightNumber && 
               typeof flight.departureTime === 'string' &&
               typeof flight.arrivalTime === 'string' &&
               (flight.price === null || typeof flight.price === 'number') &&
               typeof flight.departureAirport === 'string' &&
               typeof flight.arrivalAirport === 'string';
      });

      console.log('✈️ Valid flights found:', validFlights.length);

      // Store in local state
      setFlightData(validFlights);

      // Update Redux (with error handling)
      try {
        dispatch(clearFlights());
        if (validFlights.length > 0) {
          // Batch dispatch to prevent multiple re-renders
          setTimeout(() => {
            dispatch(setFlights(validFlights));
          }, 0);
        }
      } catch (reduxError) {
        console.warn('Redux update failed, using local state:', reduxError);
        // Continue with local state
      }

      // Set search completed
      setSearchPerformed(true);
      setRetryAttempts(result.attempts);
      
      // Update dates in Redux
      dispatch(setDate(startDate.toDateString()));
      if (returnDate) {
        dispatch(setReturnDate(returnDate.toDateString()));
      }

      // Success feedback
      if (validFlights.length > 0) {
        const successMessage = result.wasRetried 
          ? `Found ${validFlights.length} flight${validFlights.length !== 1 ? 's' : ''} after ${result.attempts} attempt${result.attempts !== 1 ? 's' : ''}!`
          : `Found ${validFlights.length} great flight option${validFlights.length !== 1 ? 's' : ''}!`;

        Swal.fire({
          title: 'Success!',
          text: successMessage,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false,
          background: '#282c34',
          color: '#fff',
          toast: true,
          position: 'top-right',
          customClass: {
            popup: 'swal2-toast',
          },
        });

        // Auto-scroll to results
        setTimeout(() => {
          listingRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 500);

      } else {
        Swal.fire({
          title: 'No Flights Found',
          text: 'We searched everywhere but couldn\'t find flights for your criteria. Try adjusting your dates or destinations.',
          icon: 'info',
          background: '#282c34',
          color: '#fff',
          showCancelButton: true,
          cancelButtonText: 'Modify Search',
          confirmButtonText: 'Try Different Dates',
          confirmButtonColor: '#4F46E5',
        }).then((result) => {
          if (result.isConfirmed) {
            // Suggest nearby dates
            const tomorrow = new Date(startDate!);
            tomorrow.setDate(tomorrow.getDate() + 1);
            setStartDate(tomorrow);
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            setSearchPerformed(false);
            setFlightData([]);
          }
        });
      }

    } catch (error: any) {
      // Clear timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      console.error('❌ Final search failure after retries:', {
        message: error.message,
        status: error.response?.status,
        code: error.code,
        attempts: retryAttempts + 1,
        maxRetriesReached: true,
      });

      setLoadingFlights(false);
      setSearchStatus('error');
      setMaxRetriesReached(true);
      setSearchPerformed(true);
      setSearchError(error.message || 'Search failed after multiple attempts');

      // Enhanced error message based on error type
      let userError = 'We apologize, but we couldn\'t complete your flight search after multiple attempts.';
      let icon = 'error';
      let showRetry = true;

      if (error.code === 'ERR_CANCELED' || error.code === 'AbortError') {
        userError = 'Search was cancelled. Please try again.';
        icon = 'info';
      } else if (error.response?.status === 429) {
        userError = 'Too many requests. Please wait a moment and try again.';
        showRetry = false;
      } else if (error.response?.status >= 500) {
        userError = 'Our flight service is temporarily unavailable. Please try again in a few minutes.';
        showRetry = true;
      } else if (error.response?.status === 503) {
        userError = 'Flight service is busy. Please try again shortly.';
        showRetry = true;
      } else if (!isOnline) {
        userError = 'No internet connection. Please check your network and try again.';
        showRetry = false;
      } else if (error.code === 'ECONNABORTED') {
        userError = 'Search timed out. Please try a narrower search or fewer passengers.';
        showRetry = true;
      }

      Swal.fire({
        title: 'Search Issue',
        text: userError,
        icon: icon as any,
        background: '#282c34',
        color: '#fff',
        showCancelButton: showRetry,
        cancelButtonText: 'Try Again',
        confirmButtonText: 'New Search',
        confirmButtonColor: '#4F46E5',
        footer: maxRetriesReached ? '<small>We tried 3 times. Please check your connection or try later.</small>' : '',
      }).then((result) => {
        if (result.isConfirmed || result.dismiss === Swal.DismissReason.cancel) {
          setSearchPerformed(false);
          setFlightData([]);
          dispatch(clearFlights());
          if (result.isConfirmed) {
            // Retry with slight modification
            const retryDate = new Date(startDate!);
            retryDate.setHours(0, 0, 0, 0);
            setStartDate(retryDate);
          }
        }
      });
    }
  }, [dispatch, selectedFrom, selectedTo, startDate, returnDate, totalPassengers, passengers, isOnline, retryAttempts, maxRetriesReached]);

  // Safe sort function
  const sortFlights = useCallback((flights: Flight[], criteria: string) => {
    if (!Array.isArray(flights) || flights.length === 0) return [];
    
    try {
      return [...flights].sort((a, b) => {
        switch (criteria) {
          case 'price':
            return (a.price || 0) - (b.price || 0);
          case 'duration':
            const durationA = parseFlightDuration(a.duration || '0h 0m');
            const durationB = parseFlightDuration(b.duration || '0h 0m');
            return durationA - durationB;
          case 'departureTime':
            return (a.departureTime || '00:00').localeCompare(b.departureTime || '00:00');
          default:
            return 0;
        }
      });
    } catch (error) {
      console.error('Sort error:', error);
      return flights;
    }
  }, []);

  // Parse flight duration to minutes for sorting
  const parseFlightDuration = (duration: string): number => {
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)m/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    
    return hours * 60 + minutes;
  };

  // Get display flights (prefer local state if available)
  const displayFlights = useMemo(() => 
    flightData.length > 0 ? flightData : reduxFlights, 
    [flightData, reduxFlights]
  );

  const sortedFlights = useMemo(() => 
    sortFlights(displayFlights, sortOption), 
    [displayFlights, sortOption, sortFlights]
  );

  const currentFlights = useMemo(() => {
    const indexOfLast = currentPage * flightsPerPage;
    const indexOfFirst = indexOfLast - flightsPerPage;
    return sortedFlights.slice(Math.max(0, indexOfFirst), indexOfLast);
  }, [sortedFlights, currentPage, flightsPerPage]);

  const totalFlightsCount = displayFlights.length;
  const totalPages = Math.ceil(totalFlightsCount / flightsPerPage);
  const hasFlights = totalFlightsCount > 0;
  const isSearching = searchStatus === 'searching' || searchStatus === 'retrying';
  const hasSearchResults = searchPerformed && !isSearching && !maxRetriesReached;

  // Pagination handler
  const paginate = useCallback((pageNumber: number) => {
    const safePage = Math.max(1, Math.min(pageNumber, totalPages));
    setCurrentPage(safePage);
    
    // Smooth scroll to top of results
    if (listingRef.current) {
      listingRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [totalPages]);

  // Reset pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption, showMainFlights, showReturnFlights]);

  // Auto-retry on network recovery
  useEffect(() => {
    if (!isOnline && searchStatus === 'error' && !maxRetriesReached) {
      const timer = setTimeout(() => {
        if (isOnline && selectedFrom && selectedTo && startDate) {
          console.log('🌐 Network recovered, auto-retrying search...');
          handleSearch({ preventDefault: () => {} } as any);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, searchStatus, maxRetriesReached, selectedFrom, selectedTo, startDate, handleSearch]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 } 
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <Navbar />

      {/* Search Form */}
      <motion.section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/pexels-yurix-sardinelly-504228832-16141006.jpg')] bg-cover bg-center opacity-10"></div>
          {isOnline ? (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-purple-900/30"></div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/50 via-red-900/30 to-red-900/20 animate-pulse"></div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-8">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-white text-center mb-2 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Find Flights
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-300 text-center mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {isOnline ? 'Search millions of flights worldwide' : 'Please connect to continue'}
            </motion.p>

            {/* Network Status */}
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 mb-6 text-center"
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-200 font-medium">No Internet Connection</span>
                </div>
                <p className="text-red-300 text-sm">Please check your connection and refresh the page</p>
              </motion.div>
            )}

            {/* Form */}
            {isLoading ? (
              <motion.div 
                className="animate-pulse space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-14 bg-white/10 rounded-xl"></div>
                  <div className="h-14 bg-white/10 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-14 bg-white/10 rounded-xl"></div>
                  <div className="h-14 bg-white/10 rounded-xl"></div>
                  <div className="h-14 bg-white/10 rounded-xl"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-12 bg-white/10 rounded-xl"></div>
                  <div className="h-14 bg-white/10 rounded-xl"></div>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleSearch}
                className="space-y-6 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {/* Airport Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    name="from"
                    options={filteredAirports}
                    value={selectedFrom}
                    onChange={handleSelectChange}
                    onInputChange={handleInputChange}
                    placeholder="From where?"
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "Type to search airports"}
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '1rem',
                        border: state.isFocused ? '2px solid #4F46E5' : 
                                selectedFrom ? '2px solid #4F46E5' : 
                                '1px solid rgba(255,255,255,0.3)',
                        boxShadow: state.isFocused ? '0 0 0 3px rgba(79,70,229,0.1)' : 'none',
                        minHeight: '56px',
                        color: '#1f2937',
                      }),
                      input: (base) => ({ ...base, color: '#1f2937' }),
                      placeholder: (base) => ({ ...base, color: 'rgba(0,0,0,0.5)', fontSize: '16px' }),
                      option: (base, state) => ({
                        ...base,
                        background: state.isSelected ? '#4F46E5' : 
                                   state.isFocused ? 'rgba(79,70,229,0.15)' : 'white',
                        color: state.isSelected ? 'white' : '#1f2937',
                        padding: '14px 16px',
                        fontSize: '15px',
                        borderRadius: '8px',
                        margin: '4px 0',
                        '&:hover': { background: state.isSelected ? '#4F46E5' : 'rgba(79,70,229,0.1)' },
                      }),
                      menu: (base) => ({ ...base, borderRadius: '12px', border: '1px solid rgba(79,70,229,0.2)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }),
                      singleValue: (base) => ({ ...base, color: '#1f2937', fontSize: '16px', fontWeight: '500' }),
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
                    noOptionsMessage={() => "Type to search destinations"}
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '1rem',
                        border: state.isFocused ? '2px solid #8B5CF6' : 
                                selectedTo ? '2px solid #8B5CF6' : 
                                '1px solid rgba(255,255,255,0.3)',
                        boxShadow: state.isFocused ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
                        minHeight: '56px',
                        color: '#1f2937',
                      }),
                      input: (base) => ({ ...base, color: '#1f2937' }),
                      placeholder: (base) => ({ ...base, color: 'rgba(0,0,0,0.5)', fontSize: '16px' }),
                      option: (base, state) => ({
                        ...base,
                        background: state.isSelected ? '#8B5CF6' : 
                                   state.isFocused ? 'rgba(139,92,246,0.15)' : 'white',
                        color: state.isSelected ? 'white' : '#1f2937',
                        padding: '14px 16px',
                        fontSize: '15px',
                        borderRadius: '8px',
                        margin: '4px 0',
                      }),
                      menu: (base) => ({ ...base, borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }),
                      singleValue: (base) => ({ ...base, color: '#1f2937', fontSize: '16px', fontWeight: '500' }),
                    }}
                  />
                </div>

                {/* Date & Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Departure Date</label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      className="w-full p-4 rounded-xl text-black bg-white/95 border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                      placeholderText="Choose departure date"
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy"
                      required
                      showPopperArrow={false}
                      calendarClassName="bg-white rounded-xl shadow-2xl border-0"
                      dayClassName={() => "text-gray-800 hover:bg-blue-100 border-0 rounded"}
                      wrapperClassName="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Return Date <span className="text-gray-500">(Optional)</span>
                    </label>
                    <DatePicker
                      selected={returnDate}
                      onChange={(date) => setReturnDate(date)}
                      className="w-full p-4 rounded-xl text-black bg-white/95 border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                      placeholderText="Return date"
                      minDate={startDate || new Date()}
                      dateFormat="MMMM d, yyyy"
                      showPopperArrow={false}
                      calendarClassName="bg-white rounded-xl shadow-2xl border-0"
                      dayClassName={() => "text-gray-800 hover:bg-purple-100 border-0 rounded"}
                      wrapperClassName="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sort Results</label>
                    <Select
                      name="sort"
                      options={[
                        { value: 'price', label: 'Price (Low to High) 🚀' },
                        { value: 'duration', label: 'Duration (Fastest First) ⚡' },
                        { value: 'departureTime', label: 'Departure Time (Earliest) ⏰' },
                      ]}
                      value={{ 
                        value: sortOption, 
                        label: `Sort by ${sortOption === 'price' ? 'Price' : sortOption === 'duration' ? 'Duration' : 'Departure Time'}`
                      }}
                      onChange={(option) => setSortOption(option?.value as any || 'price')}
                      classNamePrefix="react-select"
                      isSearchable={false}
                      styles={{
                        control: (base) => ({
                          ...base,
                          background: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '1rem',
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: 'none',
                          minHeight: '56px',
                        }),
                        placeholder: (base) => ({ ...base, color: 'rgba(0,0,0,0.5)' }),
                        valueContainer: (base) => ({ ...base, padding: '2px 8px' }),
                      }}
                    />
                  </div>
                </div>

                {/* Passengers */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full p-4 bg-white/90 rounded-xl font-semibold text-gray-800 hover:bg-white transition-all border border-gray-300 flex items-center justify-between shadow-sm group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">👥</span>
                      <span className="text-lg">Passengers ({totalPassengers})</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
                      totalPassengers === 0 ? 'bg-red-500 text-white' : 
                      totalPassengers <= 4 ? 'bg-green-500 text-white' : 
                      totalPassengers <= 8 ? 'bg-yellow-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {totalPassengers}
                    </div>
                  </motion.button>

                  {/* Passenger Dropdown */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, type: 'spring' }}
                        className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                      >
                        <div className="p-6 space-y-4 max-h-72 overflow-y-auto">
                          {/* Adults */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <h4 className="font-semibold text-gray-800">Adults (12+)</h4>
                              <p className="text-sm text-gray-600">Full fare passengers</p>
                            </div>
                            <div className="flex items-center space-x-3 bg-white p-2 rounded-lg">
                              <button
                                type="button"
                                onClick={() => decrementPassenger('adults')}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50"
                                disabled={passengers.adults === 0}
                              >
                                <span className="text-gray-600 font-semibold">-</span>
                              </button>
                              <span className="w-8 text-center text-lg font-bold text-gray-800">
                                {passengers.adults}
                              </span>
                              <button
                                type="button"
                                onClick={() => incrementPassenger('adults')}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                                disabled={totalPassengers >= 10}
                              >
                                <span className="text-gray-600 font-semibold">+</span>
                              </button>
                            </div>
                          </div>

                          {/* Children */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <h4 className="font-semibold text-gray-800">Children (2-11)</h4>
                              <p className="text-sm text-gray-600">Reduced fare</p>
                            </div>
                            <div className="flex items-center space-x-3 bg-white p-2 rounded-lg">
                              <button
                                type="button"
                                onClick={() => decrementPassenger('children')}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50"
                                disabled={passengers.children === 0 || !hasAdultOrSenior()}
                              >
                                <span className="text-gray-600 font-semibold">-</span>
                              </button>
                              <span className="w-8 text-center text-lg font-bold text-gray-800">
                                {passengers.children}
                              </span>
                              <button
                                type="button"
                                onClick={() => incrementPassenger('children')}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50"
                                disabled={totalPassengers >= 10 || !hasAdultOrSenior()}
                              >
                                <span className="text-gray-600 font-semibold">+</span>
                              </button>
                            </div>
                          </div>

                          {/* Infants */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <h4 className="font-semibold text-gray-800">Infants (0-2)</h4>
                              <p className="text-sm text-gray-600">Lap child fare</p>
                            </div>
                            <div className="flex items-center space-x-3 bg-white p-2 rounded-lg">
                              <button
                                type="button"
                                onClick={() => decrementPassenger('infants')}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50"
                                disabled={passengers.infants === 0 || !hasAdultOrSenior()}
                              >
                                <span className="text-gray-600 font-semibold">-</span>
                              </button>
                              <span className="w-8 text-center text-lg font-bold text-gray-800">
                                {passengers.infants}
                              </span>
                              <button
                                type="button"
                                onClick={() => incrementPassenger('infants')}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50"
                                disabled={totalPassengers >= 10 || !hasAdultOrSenior()}
                              >
                                <span className="text-gray-600 font-semibold">+</span>
                              </button>
                            </div>
                          </div>

                          {/* Summary */}
                          {totalPassengers > 0 && (
                            <div className="pt-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-800">Total Passengers:</span>
                                <span className={`text-2xl font-bold ${
                                  totalPassengers <= 4 ? 'text-green-600' : 
                                  totalPassengers <= 8 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {totalPassengers}
                                </span>
                              </div>
                              
                              {totalPassengers > 4 && (
                                <p className={`text-sm mt-2 ${
                                  totalPassengers <= 8 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {totalPassengers <= 8 
                                    ? 'Note: Larger groups may have limited availability' 
                                    : 'Maximum group size reached'
                                  }
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Button with Status */}
                <motion.div className="relative">
                  <motion.button
                    whileHover={!loadingFlights ? { scale: 1.02 } : {}}
                    whileTap={!loadingFlights ? { scale: 0.98 } : {}}
                    type="submit"
                    disabled={loadingFlights || !selectedFrom || !selectedTo || !startDate || totalPassengers === 0 || !isOnline}
                    className={`group relative w-full p-5 rounded-2xl font-bold text-lg shadow-2xl transition-all flex items-center justify-center space-x-3 overflow-hidden ${
                      loadingFlights || !selectedFrom || !selectedTo || !startDate || totalPassengers === 0 || !isOnline
                        ? 'bg-gray-500/30 cursor-not-allowed opacity-70 border border-gray-500/50'
                        : 'bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white border border-green-500/50 shadow-green-500/25 hover:shadow-green-500/40'
                    }`}
                  >
                    {loadingFlights ? (
                      <>
                        <LoadingSpinner size={20} color="white" small />
                        <span className="tracking-wide">
                          {searchStatus === 'retrying' ? `Retrying... (${retryAttempts + 1}/3)` : 'Searching Flights'}
                        </span>
                        {searchStatus === 'retrying' && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full blur opacity-30 animate-tick"></div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-xl">✈️</span>
                        <span className="tracking-wide">Search {totalPassengers} Flight{totalPassengers !== 1 ? 's' : ''}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                          totalPassengers === 1 ? 'bg-blue-500' : 
                          totalPassengers <= 4 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                          {totalPassengers}
                        </span>
                      </>
                    )}
                  </motion.button>

                  {/* Loading animation overlay */}
                  {loadingFlights && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl blur animate-pulse"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}

                  {/* Disabled state indicator */}
                  {(!selectedFrom || !selectedTo || !startDate || totalPassengers === 0) && !loadingFlights && (
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-2xl blur pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.div>

                {/* Requirements */}
                <div className="grid grid-cols-3 gap-4 text-center text-xs text-white/60 pt-4">
                  <div className={`p-2 rounded ${selectedFrom && selectedTo ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20'}`}>
                    <div className="font-semibold mb-1">Destinations</div>
                    <div className={`text-xs ${selectedFrom && selectedTo ? 'text-green-400' : ''}`}>
                      {selectedFrom && selectedTo ? '✓ Selected' : 'Select cities'}
                    </div>
                  </div>
                  <div className={`p-2 rounded ${startDate ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20'}`}>
                    <div className="font-semibold mb-1">Travel Date</div>
                    <div className={`text-xs ${startDate ? 'text-green-400' : ''}`}>
                      {startDate ? '✓ Selected' : 'Choose date'}
                    </div>
                  </div>
                  <div className={`p-2 rounded ${totalPassengers > 0 ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20'}`}>
                    <div className="font-semibold mb-1">Passengers</div>
                    <div className={`text-xs ${totalPassengers > 0 ? 'text-green-400' : ''}`}>
                      {totalPassengers > 0 ? `✓ ${totalPassengers}` : 'Add passengers'}
                    </div>
                  </div>
                </div>

                {/* Network & Retry Status */}
                {(searchStatus === 'error' || maxRetriesReached) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-200 font-medium">
                          {maxRetriesReached ? 'Max retries reached' : 'Search interrupted'}
                        </span>
                      </div>
                      {!maxRetriesReached && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          className="text-blue-300 hover:text-blue-200 text-sm font-semibold"
                          onClick={handleSearch}
                        >
                          Retry Now
                        </motion.button>
                      )}
                    </div>
                    {searchError && (
                      <p className="text-red-300 text-sm mt-1">{searchError}</p>
                    )}
                  </motion.div>
                )}
              </motion.form>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Results Section */}
      {searchPerformed && (
        <motion.section 
          ref={listingRef}
          className="relative bg-gray-900/95 min-h-screen"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Results Header */}
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <motion.h2 
                className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Your Flight Results
              </motion.h2>
              
              {isSearching ? (
                <motion.p className="text-xl text-blue-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  🔍 {searchStatus === 'retrying' ? `Retrying search... (${retryAttempts + 1}/3)` : 'Searching for the best flights...'}
                </motion.p>
              ) : hasFlights ? (
                <motion.p 
                  className="text-xl text-green-300" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                >
                  ✅ Found {totalFlightsCount} great option{totalFlightsCount !== 1 ? 's' : ''}!
                  {retryAttempts > 1 && (
                    <span className="text-yellow-300 ml-2">({retryAttempts} attempts)</span>
                  )}
                </motion.p>
              ) : searchError ? (
                <motion.p className="text-xl text-red-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  ❌ Search failed after {retryAttempts} attempts
                </motion.p>
              ) : (
                <motion.p className="text-xl text-gray-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  No flights available for your search
                </motion.p>
              )}
            </motion.div>

            {/* Toggle Buttons */}
            {!isSearching && searchPerformed && (
              <motion.div className="flex justify-center mb-10 max-w-md mx-auto" variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 py-4 px-8 rounded-full font-bold transition-all shadow-lg ${
                    showMainFlights
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
                      : 'bg-white/10 text-gray-300 border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                  onClick={() => toggleFlights('main')}
                >
                  <span className="mr-2">→</span>
                  Outbound ({totalFlightsCount})
                </motion.button>
                
                {returnDate && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 py-4 px-8 rounded-full font-bold transition-all shadow-lg ml-4 ${
                      showReturnFlights
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-purple-500/25'
                        : 'bg-white/10 text-gray-300 border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                    }`}
                    onClick={() => toggleFlights('return')}
                  >
                    <span className="mr-2">↩️</span>
                    Return ({returnFlights.length})
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Main Content */}
            <div className="space-y-8">
              {/* Loading State */}
              {isSearching && (
                <motion.div
                  className="flex flex-col items-center justify-center py-24 text-center space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="relative">
                    <PlaneLoader />
                    {searchStatus === 'retrying' && (
                      <motion.div
                        className="absolute -inset-8 bg-yellow-500/20 rounded-full blur animate-ping"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white">
                      {searchStatus === 'retrying' 
                        ? `Retrying your search... (${retryAttempts + 1}/3)` 
                        : 'Searching for flights'
                      }
                    </h3>
                    <p className="text-gray-400">
                      {searchStatus === 'retrying' 
                        ? 'Our servers are busy. This may take a moment longer.' 
                        : `Looking for the best flights for ${totalPassengers} passenger${totalPassengers !== 1 ? 's' : ''}`
                      }
                    </p>
                    {searchStatus === 'retrying' && (
                      <div className="flex space-x-1 text-sm text-yellow-400">
                        <span>⏳</span>
                        <span>Server temporarily busy</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="w-full max-w-md bg-white/10 rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((retryAttempts + 1) * 33, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Success Results */}
              {hasSearchResults && hasFlights && showMainFlights && !maxRetriesReached && (
                <>
                  {/* Success Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-500/15 to-emerald-500/15 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-green-100">Excellent!</h3>
                        <p className="text-green-200">
                          Found {totalFlightsCount} flight option{totalFlightsCount !== 1 ? 's' : ''} 
                          {retryAttempts > 1 && (
                            <span className="text-yellow-300 ml-1">(after {retryAttempts} attempts)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Flight Grid */}
                  <div className="grid gap-6">
                    <AnimatePresence>
                      {currentFlights.map((flight, index) => (
                        <motion.div
                          key={`${flight.flightNumber}-${index}`}
                          initial={{ opacity: 0, y: 40, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ 
                            duration: 0.5, 
                            delay: index * 0.1,
                            type: 'spring',
                            stiffness: 100
                          }}
                          className="group"
                        >
                          <motion.div
                            whileHover={{ 
                              y: -4,
                              scale: 1.02,
                              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            }}
                            className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden relative"
                          >
                            {/* Flight Route */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="text-3xl font-bold text-white">
                                  {flight.departureTime}
                                </div>
                                <div className="w-20 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                                <div className="text-3xl font-bold text-white">
                                  {flight.arrivalTime}
                                </div>
                              </div>
                              
                              {/* Duration */}
                              <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                                {flight.duration}
                              </div>
                            </div>

                            {/* Route Info */}
                            <div className="flex items-center space-x-6 mb-4">
                              <div className="flex-1">
                                <div className="text-blue-300 font-semibold text-lg mb-1">
                                  {flight.departureAirport}
                                </div>
                                <div className="w-20 flex justify-center">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div className="text-purple-300 font-semibold text-lg">
                                  {flight.arrivalAirport}
                                </div>
                              </div>
                              
                              {/* Stops */}
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                flight.stops === '0' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }`}>
                                {flight.stops === '0' ? 'Direct' : `${flight.stops} Stop${flight.stops !== '1' ? 's' : ''}`}
                              </div>
                            </div>

                            {/* Flight Details */}
                            <div className="flex items-center justify-between text-sm text-gray-300 mb-6 bg-white/5 px-4 py-3 rounded-xl">
                              <div className="flex items-center space-x-4">
                                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                                  {flight.flightNumber}
                                </span>
                                <span>{flight.airline || 'Various Airlines'}</span>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {flight.duration}
                                </span>
                                <span>🧳 20kg baggage</span>
                              </div>
                            </div>

                            {/* Price & Book */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div>
                                <div className="text-4xl font-bold text-green-400 mb-1">
                                  ₹{(flight.price || 0).toLocaleString('en-IN')}
                                </div>
                                <div className="text-green-300 text-sm bg-green-500/20 px-2 py-1 rounded">
                                  Save ₹750 with INTSAVER
                                </div>
                              </div>
                              
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all tracking-wide whitespace-nowrap"
                                onClick={() => {
                                  try {
                                    dispatch(setBookDetail(flight));
                                    dispatch(setSelectedPassengers(passengers));
                                    dispatch(clearSelectedSeat());
                                    router.push('/user/flight/selectSeats');
                                  } catch (error) {
                                    console.error('Booking redirect error:', error);
                                    Swal.fire({
                                      title: 'Booking Error',
                                      text: 'Unable to proceed. Please refresh and try again.',
                                      icon: 'error',
                                      background: '#282c34',
                                      color: '#fff',
                                    });
                                  }
                                }}
                              >
                                Book Now
                              </motion.button>
                            </div>

                            {/* Baggage & Features */}
                            <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Free meal included</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>20kg baggage</span>
                                </span>
                              </div>
                              <div className="text-gray-500">
                                Partially refundable
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* No Results */}
                    {hasSearchResults && !hasFlights && !searchError && !maxRetriesReached && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 space-y-8"
                      >
                        <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                          <span className="text-5xl">✈️</span>
                        </div>
                        
                        <div className="max-w-2xl mx-auto">
                          <h3 className="text-3xl font-bold text-gray-300 mb-4">
                            No Flights Available
                          </h3>
                          <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                            We searched extensively but couldn't find flights matching{' '}
                            <span className="font-semibold text-white">{selectedFrom?.label}</span> to{' '}
                            <span className="font-semibold text-white">{selectedTo?.label}</span> on{' '}
                            <span className="font-semibold text-white">{startDate?.toLocaleDateString('en-IN')}</span>.
                          </p>
                          
                          {totalPassengers > 4 && (
                            <motion.div
                              className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <p className="text-yellow-100 text-sm">
                                💡 <strong>Large Group Tip:</strong> Groups of {totalPassengers} may have limited availability. 
                                Try searching for 2-4 passengers first, then book multiple tickets.
                              </p>
                            </motion.div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg"
                              onClick={() => {
                                // Suggest flexible dates
                                const flexibleDate = new Date(startDate!);
                                if (flexibleDate.getDay() === 0 || flexibleDate.getDay() === 6) {
                                  // If weekend, suggest weekday
                                  flexibleDate.setDate(flexibleDate.getDate() + (flexibleDate.getDay() === 0 ? 1 : 2));
                                }
                                setStartDate(flexibleDate);
                                setSearchPerformed(false);
                              }}
                            >
                              Try Flexible Dates
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              className="px-8 py-3 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-500 transition-all"
                              onClick={() => {
                                setSearchPerformed(false);
                                setSelectedFrom(null);
                                setSelectedTo(null);
                                setStartDate(null);
                                setReturnDate(null);
                                setPassengers({ adults: 1, seniors: 0, children: 0, infants: 0 });
                                setFlightData([]);
                                dispatch(clearFlights());
                              }}
                            >
                              New Search
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Error State */}
                    {(searchError || maxRetriesReached) && !isSearching && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto"
                      >
                        <div className="bg-gradient-to-br from-red-500/10 via-red-900/10 to-orange-500/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center space-y-6">
                          <div className="relative">
                            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            {maxRetriesReached && (
                              <motion.div
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce"
                              >
                                <span className="text-white text-xs font-bold">3x</span>
                              </motion.div>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-2xl font-bold text-red-100 mb-3">
                              {maxRetriesReached ? 'Search Unavailable' : 'Search Failed'}
                            </h3>
                            <p className="text-red-200 text-lg mb-2 leading-relaxed">
                              {maxRetriesReached 
                                ? 'We tried 3 times but couldn\'t connect to our flight service.' 
                                : 'Something went wrong with your flight search.'
                              }
                            </p>
                            {searchError && (
                              <p className="text-red-300 text-sm mb-6 bg-red-500/10 p-3 rounded-xl">
                                {searchError}
                              </p>
                            )}
                            <div className="text-sm text-red-300 space-y-1">
                              <p>• Check your internet connection</p>
                              {maxRetriesReached && <p>• Our flight service may be temporarily down</p>}
                              <p>• Try again in a few minutes</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t border-red-500/20">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg flex-1 sm:flex-none"
                              onClick={handleSearch}
                              disabled={maxRetriesReached}
                            >
                              {maxRetriesReached ? 'Service Busy' : '🔄 Retry Search'}
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              className="px-8 py-3 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-500 transition-all shadow-lg flex-1 sm:flex-none"
                              onClick={() => {
                                setSearchPerformed(false);
                                setSearchError(null);
                                setMaxRetriesReached(false);
                                setFlightData([]);
                                dispatch(clearFlights());
                                setSelectedFrom(null);
                                setSelectedTo(null);
                                setStartDate(null);
                                setReturnDate(null);
                                setPassengers({ adults: 1, seniors: 0, children: 0, infants: 0 });
                                setRetryAttempts(0);
                                setSearchStatus('idle');
                              }}
                            >
                              🏠 New Search
                            </motion.button>
                            
                            {maxRetriesReached && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg flex-1 sm:flex-none"
                                onClick={() => window.location.reload()}
                              >
                                🔄 Refresh Page
                              </motion.button>
                            )}
                          </div>
                          
                          {!maxRetriesReached && isOnline && (
                            <div className="text-xs text-gray-500 mt-4">
                              <p>We'll automatically retry failed searches when our service recovers.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Return Flights */}
                    {showReturnFlights && returnDate && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-12 border-t border-white/10 pt-12"
                      >
                        <h3 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          Return Flight Options
                        </h3>
                        
                        {loadingReturnFlights ? (
                          <div className="flex justify-center py-12">
                            <div className="text-center space-y-4">
                              <PlaneLoader />
                              <div>
                                <h4 className="text-xl text-white font-semibold mb-2">Loading Return Options</h4>
                                <p className="text-gray-400">Finding flights back from {selectedFrom?.label}</p>
                              </div>
                            </div>
                          </div>
                        ) : returnFlights.length > 0 ? (
                          <div className="grid gap-4">
                            {returnFlights.slice(0, 6).map((flight, index) => (
                              <motion.div
                                key={`${flight.flightNumber}-${index}`}
                                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                                whileHover={{ scale: 1.02, y: -2 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="space-y-2 flex-1">
                                    <div className="text-xl font-semibold text-purple-300">
                                      {flight.departureTime} - {flight.arrivalTime}
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                                        {flight.departureAirport}
                                      </span>
                                      <span className="text-white font-medium">→</span>
                                      <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full">
                                        {flight.arrivalAirport}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                                      <span>{flight.duration}</span>
                                      <span>•</span>
                                      <span className={flight.stops === '0' ? 'text-green-400' : ''}>
                                        {flight.stops === '0' ? 'Direct' : `${flight.stops} Stop${flight.stops !== '1' ? 's' : ''}`}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right space-y-2 min-w-fit">
                                    <div className="text-2xl font-bold text-white">
                                      ₹{(flight.price || 0).toLocaleString()}
                                    </div>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg"
                                      onClick={() => handleSelectReturnFlight(flight)}
                                    >
                                      Select Return
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : !loadingReturnFlights && returnDate ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                          >
                            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <span className="text-4xl">↩️</span>
                            </div>
                            <h4 className="text-2xl font-semibold text-gray-300 mb-4">
                              No Return Flights Available
                            </h4>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                              We couldn't find return flights for your selected dates. You can book a one-way ticket or try different return dates.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              className="px-6 py-3 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-500 transition-all"
                              onClick={() => {
                                setReturnDate(null);
                                setShowReturnFlights(false);
                                setShowMainFlights(true);
                              }}
                            >
                              Book One-Way
                            </motion.button>
                          </motion.div>
                        ) : null}
                      </motion.div>
                    )}

                    {/* Pagination */}
                    {hasFlights && totalPages > 1 && !isSearching && (
                      <motion.div
                        className="flex justify-center mt-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex space-x-2 bg-white/5 rounded-full p-2 backdrop-blur-sm border border-white/10">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={currentPage === 1}
                            onClick={() => paginate(currentPage - 1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                          >
                            ‹
                          </motion.button>
                          
                          {Array.from({ length: totalPages }, (_, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                                currentPage === i + 1
                                  ? 'bg-blue-500 text-white shadow-lg'
                                  : 'text-gray-400 hover:bg-white/10'
                              }`}
                              onClick={() => paginate(i + 1)}
                            >
                              {i + 1}
                            </motion.button>
                          ))}
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={currentPage === totalPages}
                            onClick={() => paginate(currentPage + 1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                          >
                            ›
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Results Summary */}
                    {hasSearchResults && hasFlights && (
                      <motion.div
                        className="text-center mt-12 p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-gray-400 text-sm">
                          <span className="text-white font-semibold">Showing {currentFlights.length} of {totalFlightsCount} results</span> for{' '}
                          <span className="text-blue-400">{selectedFrom?.label} → {selectedTo?.label}</span> on{' '}
                          <span className="text-blue-400">{startDate?.toLocaleDateString('en-IN')}</span>
                          {totalPassengers > 1 && ` for ${totalPassengers} passengers`}
                          {retryAttempts > 1 && (
                            <span className="text-yellow-400 ml-2">• Searched {retryAttempts} time{retryAttempts > 1 ? 's' : ''}</span>
                          )}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-sm border-t border-white/10"
      >
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-4">
              <img src="/logo_airline.png" className="h-10 w-10 rounded-lg" alt="Skybeats" />
              <div>
                <h3 className="text-white font-bold text-xl">Skybeats</h3>
                <p className="text-gray-400 text-sm">Your journey, powered by innovation</p>
              </div>
            </div>
            
            <div className="flex space-x-8 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">About Us</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400 text-xs">
            © 2024 Skybeats. All rights reserved. 
            <span className="ml-2">Flight data provided by aviation APIs</span>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default ListFlights;
