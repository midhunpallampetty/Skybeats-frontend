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
import { Plane } from 'lucide-react';

// Fullscreen Loader
function PlaneLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-50"
    >
      <motion.div
        animate={{
          rotate: 360,
          transition: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
        }}
        className="w-20 h-20 flex items-center justify-center"
      >
        <Plane className="w-20 h-20 text-blue-500" />
      </motion.div>
    </motion.div>
  );
}

const ListFlights: React.FC = () => {
  const Navbar = dynamic(() => import('../../../components/Navbar'), { ssr: true });

  const router = useRouter();
  const dispatch = useDispatch();
  const airports = useSelector((state: RootState) => state.airports.airports);
  const filteredAirports = useSelector((state: RootState) => state.airports.filteredAirports);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);
  const [showMainFlights, setShowMainFlights] = useState(false); // Start with false
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
  const [loadingFlights, setLoadingFlights] = useState(false); // Explicitly false
  const [flightsFound, setFlightsFound] = useState(false);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false); // Track if search was performed
  const listingRef = useRef<HTMLDivElement>(null);

  // Clear flights and related state on component mount
  useEffect(() => {
    dispatch(clearFlights());
    dispatch(clearSelectedReturnFlight());
    setFlightsFound(false);
    setHasPerformedSearch(false);
    setShowMainFlights(false);
    setShowReturnFlights(false);
  }, [dispatch]);

  // Auth check
  useEffect(() => {
    const userId = Cookies.get('userId');
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    if (!userId || !accessToken || !refreshToken) {
      Cookies.remove('userId');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      router.push('/');
    }
  }, [router]);

  // Fetch airports
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
      setCurrentPage(1);
    } else {
      setShowMainFlights(false);
      setShowReturnFlights(true);
      setCurrentPage(1);
      fetchReturnFlights();
    }
  };

  const fetchReturnFlights = async () => {
    if (!returnDate || !selectedFrom || !selectedTo || !hasPerformedSearch) {
      Swal.fire('Please complete your main flight search first.');
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
    
    // Validation
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

    // Set loading state ONLY here, after validation
    setLoadingFlights(true);
    setHasPerformedSearch(true);
    setFlightsFound(false);
    setShowMainFlights(true); // Show main flights section

    const from = selectedFrom.label.split(' ')[0].toLowerCase();
    const to = selectedTo.label.split(' ')[0].toLowerCase();
    const searchRequest = { from, to, date: startDate };

    // Check for duplicate search
    if (
      lastSearchRequest.current &&
      JSON.stringify(lastSearchRequest.current) === JSON.stringify(searchRequest)
    ) {
      setLoadingFlights(false);
      return;
    }

    lastSearchRequest.current = searchRequest;
    
    try {
      const response = await axiosInstance.post('/searchFlights', {
        from,
        to,
        date: startDate,
      });

      const flightData = response.data as Flight[];
      dispatch(setFlights(flightData));
      dispatch(setDate(startDate.toDateString()));
      dispatch(setReturnDate(returnDate?.toDateString() || null));
      
      // Handle successful search
      if (flightData && flightData.length > 0) {
        setFlightsFound(true);
        setShowMainFlights(true);
        setShowReturnFlights(false);
        setCurrentPage(1);
        
        // Scroll to results after a brief delay to ensure DOM is ready
        setTimeout(() => {
          if (listingRef.current) {
            listingRef.current.scrollIntoView({ 
              behavior: "smooth", 
              block: "start" 
            });
          }
        }, 100);
        
        Swal.fire({
          title: 'Flights Found!',
          text: `${flightData.length} flights available for your trip.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#10B981',
          color: '#fff',
        });
      } else {
        setFlightsFound(false);
        setShowMainFlights(true); // Still show the section but with no results
        Swal.fire({
          title: 'No Flights Found',
          text: 'Sorry, no flights available for your selected criteria. Please try different dates or destinations.',
          icon: 'info',
          background: '#1E3A8A',
          color: '#fff',
          confirmButtonColor: '#4F46E5',
        });
      }
    } catch (error: any) {
      console.error('Error searching flights:', error.message);
      setShowMainFlights(true); // Show the section even on error
      Swal.fire({
        title: 'Search Failed',
        text: 'Unable to fetch flights. Please try again.',
        icon: 'error',
        background: '#1E3A8A',
        color: '#fff',
        confirmButtonColor: '#4F46E5',
      });
    } finally {
      // Always turn off loading
      setLoadingFlights(false);
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

  // STRICT LOADER CONDITION - Only show when actively searching
  const shouldShowLoader = (loadingFlights || loadingReturnFlights) && hasPerformedSearch;

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
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      {/* Only show loader during active searches */}
      {shouldShowLoader && <PlaneLoader />}
      
      <Navbar />
      
      {/* Search Form Section - Always visible */}
      <motion.div className="relative min-h-screen bg-gradient-to-br mt-16 from-blue-900 to-indigo-900" variants={fadeIn}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pexels-yurix-sardinelly-504228832-16141006.jpg')] bg-cover bg-center opacity-20"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div className="max-w-4xl mx-auto bg-white/30 backdrop-blur-lg p-8 rounded-2xl shadow-2xl" variants={itemVariants}>
            <h1 className="text-4xl font-bold text-white text-center mb-8">Find Your Perfect Flight</h1>
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
                  isDisabled={loadingFlights}
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
                  isDisabled={loadingFlights}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  className="w-full p-3 rounded-lg text-black bg-white/90 border-none"
                  placeholderText="Departure Date"
                  minDate={new Date()}
                  disabled={loadingFlights}
                />
                <DatePicker
                  selected={returnDate}
                  onChange={(date: Date | null) => setReturnDate(date)}
                  className="w-full p-3 rounded-lg text-black bg-white/90 border-none"
                  placeholderText="Return Date"
                  minDate={startDate || new Date()}
                  disabled={loadingFlights}
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
                  isDisabled={loadingFlights}
                />
              </div>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !loadingFlights && setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full p-3 bg-white/90 rounded-lg font-semibold text-gray-800 hover:bg-white/100 transition-all disabled:opacity-50"
                  disabled={loadingFlights}
                >
                  Passenger Details ({totalPassengers})
                </motion.button>
                <AnimatePresence>
                  {isDropdownOpen && !loadingFlights && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute w-full mt-2 bg-white text-black rounded-lg shadow-xl border border-gray-100 z-50"
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
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full disabled:opacity-50"
                                disabled={loadingFlights}
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
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full disabled:opacity-50"
                                disabled={loadingFlights || totalPassengers >= 10}
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
                className="w-full p-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-lg shadow-lg hover:from-green-500 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingFlights}
              >
                {loadingFlights ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching Flights...
                  </span>
                ) : (
                  'Search Flights'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.div>

      {/* Flights Results Section - Only show after search */}
      {hasPerformedSearch && (
        <motion.div 
          ref={listingRef}
          className="relative bg-gray-900 min-h-screen py-20"
          variants={fadeIn}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto px-4">
            {(flights.length > 0 || returnFlights.length > 0 || loadingFlights) ? (
              <>
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
                    disabled={loadingFlights}
                  >
                    Outbound Flights ({flights.length})
                  </motion.button>
                  {returnDate && returnFlights.length > 0 && (
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
                      Return Flights ({returnFlights.length})
                    </motion.button>
                  )}
                </motion.div>

                <AnimatePresence mode="wait">
                  {showMainFlights && (
                    <motion.div
                      key="main-flights" 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {loadingFlights ? (
                        <div className="flex justify-center items-center py-20">
                          <div className="text-center">
                            <PlaneLoader />
                            <p className="text-white mt-4 text-lg">Searching for flights...</p>
                          </div>
                        </div>
                      ) : currentFlights.length > 0 ? (
                        <>
                          {currentFlights.map((flight) => (
                            <motion.div
                              key={flight.flightNumber}
                              className="bg-gray-800 rounded-xl p-4 shadow-lg hover:bg-gray-700 transition-all"
                              whileHover={{ scale: 1.02 }} 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="flex justify-between items-center text-white">
                                <div className="space-y-1">
                                  <div className="text-lg font-semibold">
                                    {flight.departureTime} - {flight.arrivalTime}
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    {flight.departureAirport} → {flight.arrivalAirport}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Duration: {flight.duration} | {flight.stops}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Flight: {flight.flightNumber}
                                  </div>
                                </div>
                                <div className="text-right space-y-2">
                                  <div className="text-xl font-bold">
                                    ₹{flight.price}
                                  </div>
                                  <div className="text-xs text-green-400">
                                    Save ₹750 with INTSAVER
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600"
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
                        </>
                      ) : (
                        !loadingFlights && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                          >
                            <Image
                              src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                              alt="No Flights Available"
                              width={700}
                              height={400}
                              className="rounded-lg shadow-2xl mb-6"
                            />
                            <h3 className="text-2xl font-semibold text-white mb-2">
                              No Flights Available
                            </h3>
                            <p className="text-gray-400 max-w-md">
                              Sorry, we couldn't find any flights matching your criteria. 
                              Try adjusting your search dates, destinations, or passenger details.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="mt-6 px-6 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
                              onClick={() => {
                                setHasPerformedSearch(false);
                                dispatch(clearFlights());
                                setFlightsFound(false);
                                setShowMainFlights(false);
                              }}
                            >
                              New Search
                            </motion.button>
                          </motion.div>
                        )
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
                      className="space-y-4"
                    >
                      {loadingReturnFlights ? (
                        <div className="flex justify-center items-center py-20">
                          <div className="text-center">
                            <PlaneLoader />
                            <p className="text-white mt-4 text-lg">Loading return flights...</p>
                          </div>
                        </div>
                      ) : currentReturnFlights.length > 0 ? (
                        currentReturnFlights.map((flight) => (
                          <motion.div
                            key={flight.flightNumber}
                            className="bg-gray-800 rounded-xl p-4 shadow-lg hover:bg-gray-700 transition-all"
                            whileHover={{ scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex justify-between items-center text-white">
                              <div className="space-y-1">
                                <div className="text-lg font-semibold">
                                  {flight.departureTime} - {flight.arrivalTime}
                                </div>
                                <div className="text-sm text-gray-300">
                                  {flight.departureAirport} → {flight.arrivalAirport}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Duration: {flight.duration} | {flight.stops}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Flight: {flight.flightNumber}
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <div className="text-xl font-bold">
                                  ₹{flight.price}
                                </div>
                                <div className="text-xs text-green-400">
                                  Save ₹750 with INTSAVER
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-4 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600"
                                  onClick={() => handleSelectReturnFlight(flight)}
                                >
                                  Select Return Flight
                                </motion.button>
                                <div className="text-xs text-gray-400">
                                  Partially refundable
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        !loadingReturnFlights && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                          >
                            <Image
                              src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/de9dc8d1-fd3b-44a4-b095-d0e4f3a544b6.jpeg"
                              alt="No Return Flights Available"
                              width={700}
                              height={400}
                              className="rounded-lg shadow-2xl mb-6"
                            />
                            <h3 className="text-2xl font-semibold text-white mb-2">
                              No Return Flights Available
                            </h3>
                            <p className="text-gray-400 max-w-md">
                              Try adjusting your return date or search for one-way flights.
                            </p>
                          </motion.div>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pagination */}
                {((showMainFlights && !loadingFlights && flights.length > flightsPerPage) || 
                  (showReturnFlights && !loadingReturnFlights && returnFlights.length > flightsPerPage)) ? (
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
                ) : null}
              </>
            ) : (
              loadingFlights && (
                <motion.div className="flex flex-col items-center justify-center py-20">
                  <PlaneLoader />
                  <p className="text-white mt-8 text-xl font-semibold">Searching for flights...</p>
                  <p className="text-gray-400 mt-2">Please wait while we find the best options for you</p>
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      )}

      {/* Initial Empty State - Only show before any search */}
      {!hasPerformedSearch && (
        <motion.div className="relative bg-gray-900 min-h-screen py-20" variants={fadeIn}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto"
            >
              <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <Plane className="w-16 h-16 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Find Your Perfect Flight?
              </h2>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Enter your travel details above to discover available flights. We'll show you 
                the best options based on price, duration, and your preferences.
              </p>
              <motion.div
                className="grid md:grid-cols-2 gap-6 text-left bg-white/5 p-6 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-2">
                  <h3 className="text-blue-400 font-semibold text-lg">Search Features</h3>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• • Real-time flight availability</li>
                    <li>• • Best price guarantees</li>
                    <li>• • Flexible date search</li>
                    <li>• • Multiple airline options</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-green-400 font-semibold text-lg">How It Works</h3>
                  <ol className="text-gray-300 space-y-1 text-sm list-decimal list-inside">
                    <li>Select your cities</li>
                    <li>Choose travel dates</li>
                    <li>Specify passengers</li>
                    <li>Click search & explore</li>
                  </ol>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}

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
