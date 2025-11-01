'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { Airport } from '@/interfaces/Airport';
import { setHotelBookDetail } from '@/redux/slices/hotelBookDetailSlice';
import Modal from 'react-modal';
import Footer from '../../components/Footer';
import axiosInstance from '../api/utils/axiosInstance';
import DatePicker from 'react-datepicker';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setHotelOptions } from '@/redux/slices/bookHotelSlice';
import Select, { SingleValue } from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import Image from 'next/image';
import { OptionType } from '@/interfaces/OptionType';
import Swal from 'sweetalert2';
import { RootState } from '@/redux/store';
import { 
  Loader2, 
  MapPin, 
  Star, 
  Heart, 
  Bed, 
  Wifi, 
  Pool, 
  Car, 
  Utensils,
  Hotel,
  Search,
  Clock,
  Users
} from 'lucide-react';

const Hotels: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredAirports, setFilteredAirports] = useState<OptionType[]>([]);
  const [sortOption, setSortOption] = useState('name-asc');
  const [searchLoading, setSearchLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCity, setSelectedCity] = useState<SingleValue<OptionType> | null>(null);
  
  const hotelOptions = useSelector((state: RootState) => state.hotelOptions.hotelOptions);
  const itemsPerPage = 8; 
  const [currentPage, setCurrentPage] = useState(1);
  
  const testData = useSelector((state: RootState) => state.hotelBookDetail.selectedHotel);

  // Default hotel data for display when no search is performed
  const [defaultHotels, setDefaultHotels] = useState<any[]>([]);

  // Loading Components
  const SearchLoader = () => (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      <span className="text-blue-500">Searching for hotels...</span>
    </div>
  );

  const HotelsLoader = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 h-48 bg-gray-700 rounded-xl animate-pulse"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="flex items-center space-x-2 mt-4">
                <div className="h-3 bg-gray-700 rounded w-16"></div>
                <div className="h-3 bg-gray-700 rounded w-12"></div>
              </div>
              <div className="h-10 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Initialize default hotels with your data
  useEffect(() => {
    const initializeDefaultHotels = () => {
      const hotelData = [
        {
          "type": "hotel",
          "name": "Lemon Tree Premier, Mumbai International Airport",
          "check_in_time": "2:00 PM",
          "check_out_time": "12:00 AM",
          "overall_rating": 4.2,
          "reviews": 4554,
          "location_rating": 4.6,
          "rate_per_night": 1000,
          "total_rate": 2000,
          "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Free breakfast", "Free Wi-Fi", "Free parking", "Outdoor pool", "Air conditioning", "Fitness center", "Spa", "Bar", "Restaurant"],
          "excluded_amenities": [],
          "essential_info": ["Near Mumbai Airport", "Business-friendly", "Luxury accommodations"]
        },
        {
          "type": "hotel",
          "name": "Radisson Blu Mumbai International Airport",
          "check_in_time": "2:00 PM",
          "check_out_time": "12:00 PM",
          "overall_rating": 4.5,
          "reviews": 6422,
          "location_rating": 4.1,
          "rate_per_night": 1000,
          "total_rate": 2100,
          "images": ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Breakfast ($)", "Free Wi-Fi", "Free parking", "Outdoor pool", "Hot tub", "Air conditioning", "Fitness center"],
          "excluded_amenities": [],
          "essential_info": ["Airport shuttle available", "Modern facilities", "Great for business travelers"]
        },
        {
          "type": "vacation rental",
          "name": "Gagal Home BKC Suite | Rooms & Caretaker",
          "check_in_time": "12:00 PM",
          "check_out_time": "10:00 AM",
          "overall_rating": 3.7,
          "reviews": 41,
          "location_rating": 3.6,
          "rate_per_night": 1000,
          "total_rate": 1800,
          "images": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Air conditioning", "Elevator", "Fireplace", "Kitchen", "Microwave", "Free parking", "Free Wi-Fi"],
          "excluded_amenities": ["No fitness center", "Not pet-friendly"],
          "essential_info": ["Entire apartment", "Sleeps 9", "2 bedrooms", "3 bathrooms", "700 sq ft"]
        },
        {
          "type": "hotel",
          "name": "Fairfield by Marriott Mumbai International Airport",
          "check_in_time": "3:00 PM",
          "check_out_time": "12:00 PM",
          "overall_rating": 4.1,
          "reviews": 6844,
          "location_rating": 3.6,
          "rate_per_night": 1000,
          "total_rate": 1900,
          "images": ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Breakfast ($)", "Free Wi-Fi", "Free parking", "Outdoor pool", "Air conditioning", "Fitness center"],
          "excluded_amenities": [],
          "essential_info": ["Marriott quality", "Reliable service", "Airport proximity"]
        },
        {
          "type": "hotel",
          "name": "JW Marriott Mumbai Sahar",
          "check_in_time": "3:00 PM",
          "check_out_time": "12:00 PM",
          "overall_rating": 4.6,
          "reviews": 25862,
          "location_rating": 4.2,
          "rate_per_night": 1000,
          "total_rate": 2200,
          "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Free breakfast", "Free Wi-Fi", "Free parking", "Outdoor pool", "Air conditioning", "Spa", "Restaurant"],
          "excluded_amenities": [],
          "essential_info": ["Luxury experience", "Excellent service", "Prime location"]
        },
        {
          "type": "hotel",
          "name": "The Taj Mahal Palace, Mumbai",
          "check_in_time": "2:00 PM",
          "check_out_time": "12:00 PM",
          "overall_rating": 4.7,
          "reviews": 33211,
          "location_rating": 4.4,
          "rate_per_night": 1000,
          "total_rate": 2500,
          "images": ["https://images.unsplash.com/photo-1571003118755-17af748ed185?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Free breakfast", "Free Wi-Fi", "Parking ($)", "Outdoor pool", "Hot tub", "Spa", "Multiple restaurants"],
          "excluded_amenities": [],
          "essential_info": ["Iconic landmark", "Historical luxury", "World-class amenities"]
        },
        {
          "type": "hotel",
          "name": "Four Seasons Hotel Mumbai",
          "check_in_time": "3:00 PM",
          "check_out_time": "12:00 PM",
          "overall_rating": 4.5,
          "reviews": 14973,
          "location_rating": 4.5,
          "rate_per_night": 1000,
          "total_rate": 2300,
          "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Breakfast ($)", "Free Wi-Fi", "Free parking", "Outdoor pool", "Pet-friendly", "Spa", "Fine dining"],
          "excluded_amenities": [],
          "essential_info": ["International luxury", "Exceptional service", "Prime Worli location"]
        },
        {
          "type": "hotel",
          "name": "ITC Maratha, a Luxury Collection Hotel, Mumbai",
          "check_in_time": "3:00 PM",
          "check_out_time": "12:00 PM",
          "overall_rating": 4.7,
          "reviews": 36579,
          "location_rating": 4,
          "rate_per_night": 1000,
          "total_rate": 2400,
          "images": ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
          "amenities": ["Breakfast ($)", "Free Wi-Fi", "Free parking", "Indoor pool", "Spa", "Multiple restaurants", "Business facilities"],
          "excluded_amenities": [],
          "essential_info": ["Luxury Collection", "Award-winning service", "Excellent business facilities"]
        }
      ];

      // Add fallback images and set default pricing
      const hotelsWithDefaults = hotelData.map(hotel => ({
        ...hotel,
        rate_per_night: 1000, // Default price
        total_rate: 1000 * (Math.floor(Math.random() * 3) + 2), // 2-4 nights total
        images: hotel.images || ["https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        gps_coordinates: hotel.gps_coordinates || { lat: 19.0760, lng: 72.8777 }, // Mumbai coordinates
        nearby_places: hotel.nearby_places || ["Mumbai Airport", "Business District", "Shopping Areas"],
        prices: hotel.prices || [{ currency: "USD", amount: 1000, formatted: "$1000" }]
      }));

      setDefaultHotels(hotelsWithDefaults);
      
      // Set the hotel options in Redux to show default hotels initially
      dispatch(setHotelOptions({
        HotelByLocation: hotelsWithDefaults
      }));
    };

    initializeDefaultHotels();
  }, [dispatch]);

  // Fetch fallback images
  useEffect(() => {
    const fetchFallbackImages = async () => {
      try {
        const response: any = await axios.get('https://pixabay.com/api/', {
          params: {
            key: '38643909-0965461316365ac27e67b31c5',
            q: 'luxury+hotel+exterior',
            image_type: 'photo',
            per_page: 20,
          },
        });

        if (response.data && response.data.hits && response.data.hits.length > 0) {
          const randomImages = response.data.hits.slice(0, 8).map((hit: any) => hit.webformatURL);
          setImageUrl(randomImages[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
        } else {
          setImageUrl('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
        }
      } catch (error) {
        console.error('Error fetching fallback images:', error);
        setImageUrl('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
      }
    };

    fetchFallbackImages();
  }, []);

  // Fetch airports with better error handling
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await axiosInstance.get<Airport[]>('/getAirports', {
          timeout: 10000 // 10 second timeout
        });
        
        if (response.data && Array.isArray(response.data)) {
          const airportsData = response.data;
          setAirports(airportsData);

          const cityOptions = airportsData
            .filter(airport => airport.city && airport.code) // Ensure city and code exist
            .map(airport => ({
              value: airport.code,
              label: `${airport.city}${airport.country ? `, ${airport.country}` : ''}`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

          setFilteredAirports(cityOptions);
          
          console.log('Airports loaded successfully:', cityOptions.length, 'options');
        } else {
          console.warn('No airport data received, using fallback cities');
          // Fallback city options
          const fallbackCities: OptionType[] = [
            { value: 'BOM', label: 'Mumbai, India' },
            { value: 'DEL', label: 'New Delhi, India' },
            { value: 'BLR', label: 'Bengaluru, India' },
            { value: 'HYD', label: 'Hyderabad, India' },
            { value: 'CCU', label: 'Kolkata, India' },
            { value: 'MAA', label: 'Chennai, India' },
            { value: 'PNQ', label: 'Pune, India' },
            { value: 'GOI', label: 'Goa, India' },
          ];
          setFilteredAirports(fallbackCities);
        }
      } catch (error: any) {
        console.error('Error fetching airports:', error.message);
        
        // Show user-friendly error
        Swal.fire({
          title: 'Network Issue',
          text: 'Unable to load city options. Using popular destinations instead.',
          icon: 'warning',
          timer: 3000,
          showConfirmButton: false
        });

        // Fallback city options
        const fallbackCities: OptionType[] = [
          { value: 'BOM', label: 'Mumbai, India' },
          { value: 'DEL', label: 'New Delhi, India' },
          { value: 'BLR', label: 'Bengaluru, India' },
          { value: 'HYD', label: 'Hyderabad, India' },
          { value: 'CCU', label: 'Kolkata, India' },
          { value: 'MAA', label: 'Chennai, India' },
          { value: 'PNQ', label: 'Pune, India' },
          { value: 'GOI', label: 'Goa, India' },
        ];
        setFilteredAirports(fallbackCities);
      }
    };

    fetchAirports();
  }, []);

  const handleBooking = (hotel: any) => {
    // Ensure hotel has all required properties
    const hotelDetails = {
      type: hotel.type || 'hotel',
      name: hotel.name || 'Unknown Hotel',
      gps_coordinates: hotel.gps_coordinates || { lat: 19.0760, lng: 72.8777 },
      check_in_time: hotel.check_in_time || '2:00 PM',
      check_out_time: hotel.check_out_time || '12:00 PM',
      rate_per_night: hotel.rate_per_night || 1000,
      total_rate: hotel.total_rate || (1000 * 2), // Default 2 nights
      prices: hotel.prices || [{ currency: "USD", amount: 1000, formatted: "$1000" }],
      nearby_places: hotel.nearby_places || ["City Center", "Shopping Areas", "Restaurants"],
      images: hotel.images || [imageUrl],
      overall_rating: hotel.overall_rating || 4.0,
      reviews: hotel.reviews || hotel.reviews?.length || 0,
      location_rating: hotel.location_rating || 4.0,
      amenities: hotel.amenities || ["Free Wi-Fi", "Air Conditioning", "Restaurant"],
      excluded_amenities: hotel.excluded_amenities || [],
      essential_info: hotel.essential_info || ["Comfortable stay", "Great location"],
    };

    dispatch(setHotelBookDetail(hotelDetails));
    router.push('/hotel/selectHotel');
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const sortHotels = (hotels: any[], option: string) => {
    const sorted = [...hotels];
    
    switch (option) {
      case 'name-asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'rating-asc':
        return sorted.sort((a, b) => (a.overall_rating || 0) - (b.overall_rating || 0));
      case 'rating-desc':
        return sorted.sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));
      case 'price-asc':
        return sorted.sort((a, b) => (a.rate_per_night || 1000) - (b.rate_per_night || 1000));
      case 'price-desc':
        return sorted.sort((a, b) => (b.rate_per_night || 1000) - (a.rate_per_night || 1000));
      default:
        return sorted;
    }
  };

  // Fixed hotel search with better error handling and city validation
  const handleSearchHotels = async (event: React.FormEvent) => {
    event.preventDefault();

    // Enhanced validation
    if (!selectedCity || !selectedCity.value || !selectedCity.label) {
      Swal.fire({
        title: 'Please select a city',
        text: 'Choose your destination from the dropdown to continue.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (!startDate || !endDate) {
      Swal.fire({
        title: 'Select your dates',
        text: 'Please choose both check-in and check-out dates for your stay.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (startDate > endDate) {
      Swal.fire({
        title: 'Invalid dates',
        text: 'Check-out date cannot be earlier than check-in date.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (endDate.getTime() - startDate.getTime() > 30 * 24 * 60 * 60 * 1000) { // 30 days max
      Swal.fire({
        title: 'Date range too long',
        text: 'Please select a stay of 30 days or less.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setSearchLoading(true);
    setCurrentPage(1);

    try {
      console.log('Searching hotels for:', {
        city: selectedCity.label,
        cityCode: selectedCity.value,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        nights: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      });

      // Prepare search payload
      const searchPayload = {
        city: selectedCity.value || selectedCity.label.toUpperCase(), // Use airport code or city name
        cityName: selectedCity.label,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        checkIn: startDate.toLocaleDateString('en-CA'),
        checkOut: endDate.toLocaleDateString('en-CA'),
        adults: 2,
        rooms: 1,
        nights: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      };

      const response = await axiosInstance.post('/searchHotels', searchPayload, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Search response:', response.data);

      // Validate response structure
      if (response.data && response.data.HotelByLocation && Array.isArray(response.data.HotelByLocation)) {
        // Ensure all hotels have required fields
        const validatedHotels = response.data.HotelByLocation.map((hotel: any) => ({
          ...hotel,
          rate_per_night: hotel.rate_per_night || 1000,
          total_rate: hotel.total_rate || (1000 * searchPayload.nights),
          images: hotel.images && hotel.images.length > 0 ? hotel.images : [imageUrl],
          overall_rating: hotel.overall_rating || 4.0,
          reviews: hotel.reviews || 0,
          amenities: hotel.amenities || ["Free Wi-Fi", "Air Conditioning"],
          gps_coordinates: hotel.gps_coordinates || { lat: 19.0760, lng: 72.8777 }
        }));

        dispatch(setHotelOptions({
          HotelByLocation: validatedHotels,
          searchParams: searchPayload
        }));

        // Show success message
        Swal.fire({
          title: 'Hotels Found!',
          text: `Found ${validatedHotels.length} great options in ${selectedCity.label} for your ${searchPayload.nights}-night stay.`,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false,
          confirmButtonColor: '#10b981'
        });

        console.log('Hotels search successful:', validatedHotels.length, 'hotels found');
      } else {
        // Handle empty or invalid response
        console.warn('No hotels found or invalid response structure');
        
        // Show fallback message and use default hotels filtered by city if possible
        const cityFiltered = defaultHotels.filter(hotel => 
          hotel.name.toLowerCase().includes(selectedCity.label.toLowerCase())
        );
        
        dispatch(setHotelOptions({
          HotelByLocation: cityFiltered.length > 0 ? cityFiltered : defaultHotels.slice(0, 8),
          searchParams: searchPayload
        }));

        Swal.fire({
          title: 'No Exact Matches',
          text: `Couldn't find hotels for ${selectedCity.label}. Showing best available options nearby.`,
          icon: 'info',
          timer: 3000,
          showConfirmButton: false,
          confirmButtonColor: '#3b82f6'
        });
      }

    } catch (error: any) {
      console.error('Hotel search error:', error);
      
      // More specific error handling
      let errorMessage = 'Unable to search for hotels. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Search timed out. Please try with a different city or shorter date range.';
      } else if (error.response?.status === 404) {
        errorMessage = `No hotels available for ${selectedCity.label}. Try a different destination.`;
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Our team has been notified. Please try again shortly.';
      }

      Swal.fire({
        title: 'Search Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });

      // Reset to default hotels on search failure
      dispatch(setHotelOptions({
        HotelByLocation: defaultHotels
      }));
    } finally {
      setSearchLoading(false);
    }
  };

  // Get hotels for current page and sorting
  const getCurrentHotels = () => {
    let hotelsToShow = hotelOptions?.HotelByLocation || defaultHotels;
    
    // If no search has been performed and we have default hotels, use them
    if (!hotelOptions?.HotelByLocation || hotelOptions.HotelByLocation.length === 0) {
      hotelsToShow = defaultHotels;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedHotels = hotelsToShow.slice(startIndex, endIndex);
    
    return sortHotels(paginatedHotels, sortOption);
  };

  const currentHotels = getCurrentHotels();
  const totalPages = Math.ceil((hotelOptions?.HotelByLocation?.length || defaultHotels.length) / itemsPerPage);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const truncateWords = (text: string, wordLimit: number): string => {
    if (!text) return 'No description available';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={16} fill="#fbbf24" className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<Star key={i} size={16} fill="#fbbf24" className="text-yellow-400" />);
      } else {
        stars.push(<Star key={i} size={16} fill="none" className="text-gray-300" />);
      }
    }
    return stars;
  };

  const getAmenitiesIcons = (amenities: string[]) => {
    if (!amenities || amenities.length === 0) {
      return [<span key="no-amenities" className="text-xs text-gray-400">Basic amenities</span>];
    }

    const amenityIcons: { [key: string]: { icon: JSX.Element; color: string } } = {
      'Free Wi-Fi': { icon: <Wifi size={14} />, color: 'text-blue-400' },
      'Wi-Fi': { icon: <Wifi size={14} />, color: 'text-blue-400' },
      'Free parking': { icon: <Car size={14} />, color: 'text-green-400' },
      'Parking': { icon: <Car size={14} />, color: 'text-green-400' },
      'Outdoor pool': { icon: <Pool size={14} />, color: 'text-blue-500' },
      'Indoor pool': { icon: <Pool size={14} />, color: 'text-blue-500' },
      'Pool': { icon: <Pool size={14} />, color: 'text-blue-500' },
      'Breakfast': { icon: <Utensils size={14} />, color: 'text-orange-400' },
      'Free breakfast': { icon: <Utensils size={14} />, color: 'text-orange-400' },
      'Restaurant': { icon: <Utensils size={14} />, color: 'text-orange-400' },
      'Bar': { icon: <Utensils size={14} />, color: 'text-purple-400' },
      'Spa': { icon: <Hotel size={14} />, color: 'text-pink-400' },
      'Fitness center': { icon: <Users size={14} />, color: 'text-indigo-400' },
      'Gym': { icon: <Users size={14} />, color: 'text-indigo-400' },
      'Kitchen': { icon: <Utensils size={14} />, color: 'text-gray-400' },
      'Air conditioning': { icon: <Bed size={14} />, color: 'text-teal-400' },
      default: { icon: <Bed size={14} />, color: 'text-gray-400' }
    };

    return amenities.slice(0, 4).map((amenity, index) => {
      const config = amenityIcons[amenity] || amenityIcons.default;
      return (
        <div key={index} className="flex items-center space-x-1 p-1 rounded">
          <div className={`${config.color} flex-shrink-0`}>{config.icon}</div>
          <span className="text-xs text-gray-300 truncate max-w-20">{amenity.length > 15 ? `${amenity.substring(0, 12)}...` : amenity}</span>
        </div>
      );
    });
  };

  // Calculate nights for total price display
  const getNightsCount = () => {
    if (!startDate || !endDate) return 1;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = getNightsCount();

  return (
    <>
      <Navbar />
      
      {/* Hero Section with Search */}
      <div className="relative h-[80vh] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.6 }}
        >
          <source src="/hotel intro.mp4" type="video/mp4" />
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            alt="Hotel background"
          />
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
        
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Discover Perfect Stays
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Find luxury hotels and vacation rentals with amazing amenities and unbeatable prices
              </p>
            </div>
            
            <form onSubmit={handleSearchHotels} className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* City Selection */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-white mb-3 flex items-center">
                    <MapPin className="mr-2" size={18} />
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Select
                      options={filteredAirports}
                      className="text-base"
                      classNamePrefix="react-select"
                      onChange={(option) => {
                        console.log('City selected:', option);
                        setSelectedCity(option);
                      }}
                      value={selectedCity}
                      placeholder="Select city or airport"
                      isClearable
                      isSearchable
                      noOptionsMessage={() => "Type to search cities"}
                      loadingMessage={() => "Loading destinations..."}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                          borderRadius: '16px',
                          minHeight: '56px',
                          boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          }
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: '#6b7280',
                        }),
                        input: (provided) => ({
                          ...provided,
                          color: '#374151',
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected 
                            ? '#3b82f6' 
                            : state.isFocused 
                              ? 'rgba(59, 130, 246, 0.1)' 
                              : 'white',
                          color: state.isSelected ? 'white' : '#374151',
                          '&:hover': {
                            backgroundColor: state.isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                          }
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#1f2937',
                        })
                      }}
                    />
                  </div>
                  {selectedCity && (
                    <div className="mt-2 text-sm text-blue-200 flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {selectedCity.label}
                    </div>
                  )}
                </div>
                
                {/* Dates */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-white mb-3 flex items-center">
                    <Clock className="mr-2" size={18} />
                    Travel Dates
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => {
                          console.log('Start date selected:', date);
                          setStartDate(date);
                          if (date && endDate && date > endDate) {
                            setEndDate(null);
                          }
                        }}
                        placeholderText="Check-in date"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/95"
                        minDate={new Date()}
                        dateFormat="MMM dd, yyyy"
                        showPopperArrow={false}
                      />
                      <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    
                    <div className="relative">
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => {
                          console.log('End date selected:', date);
                          setEndDate(date);
                        }}
                        placeholderText="Check-out date"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/95"
                        minDate={startDate || new Date()}
                        dateFormat="MMM dd, yyyy"
                        showPopperArrow={false}
                      />
                      <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  
                  {startDate && endDate && (
                    <div className="mt-2 text-sm text-blue-200">
                      {nights} {nights === 1 ? 'night' : 'nights'} • {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                
                {/* Guests - Simplified */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-white mb-3 flex items-center">
                    <Users className="mr-2" size={18} />
                    Guests & Rooms
                  </label>
                  <div className="relative">
                    <select 
                      defaultValue="2 adults, 1 room"
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/95 appearance-none"
                    >
                      <option value="2 adults, 1 room">2 adults • 1 room</option>
                      <option value="2 adults, 2 rooms">2 adults • 2 rooms</option>
                      <option value="3 adults, 1 room">3 adults • 1 room</option>
                      <option value="4 adults, 2 rooms">4 adults • 2 rooms</option>
                    </select>
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={searchLoading || !selectedCity || !startDate || !endDate}
                className={`w-full mt-8 flex items-center justify-center py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl ${
                  searchLoading || !selectedCity || !startDate || !endDate
                    ? 'bg-gray-500 cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700'
                } text-white`}
              >
                {searchLoading ? (
                  <SearchLoader />
                ) : (
                  <>
                    <Search size={20} className="mr-3" />
                    {selectedCity ? `Search hotels in ${selectedCity.label}` : 'Find Your Perfect Stay'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Hotels Results Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header with Results Info */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                <Hotel size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {hotelOptions?.HotelByLocation && hotelOptions.HotelByLocation.length > 0 
                    ? `Great options in ${selectedCity?.label || 'your area'}`
                    : currentHotels.length > 0 
                      ? 'Featured Hotels'
                      : 'Search above to find hotels'
                  }
                </h2>
                <p className="text-gray-600">
                  {currentHotels.length > 0 
                    ? `${currentHotels.length} properties • Average price $${Math.round(currentHotels.reduce((sum, h) => sum + (h.rate_per_night || 1000), 0) / currentHotels.length)}/night`
                    : selectedCity ? `Searching for ${selectedCity.label}...` : ''
                  }
                </p>
              </div>
            </div>
            
            {/* Sorting */}
            {currentHotels.length > 1 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden lg:block">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setCurrentPage(1); // Reset to first page when sorting
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="rating-desc">Rating (Highest first)</option>
                  <option value="rating-asc">Rating (Lowest first)</option>
                  <option value="price-asc">Price (Lowest first)</option>
                  <option value="price-desc">Price (Highest first)</option>
                </select>
              </div>
            )}
          </div>

          {/* Hotels Grid */}
          <div className="space-y-8">
            {searchLoading ? (
              <HotelsLoader />
            ) : currentHotels.length > 0 ? (
              currentHotels.map((hotel: any, index: number) => (
                <article
                  key={`${hotel.name}-${index}`}
                  className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 border border-gray-200 hover:border-blue-200"
                >
                  {/* Hotel Image and Actions */}
                  <div className="relative h-64 md:h-80 overflow-hidden bg-gray-100">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      src={hotel.images?.[0] || imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                      alt={`${hotel.name} - ${hotel.type}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg z-10">
                      <div className="flex items-center space-x-1">
                        {getRatingStars(hotel.overall_rating || 4.0)}
                        <span className="ml-1">{(hotel.overall_rating || 4.0).toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {/* Favorite Button */}
                    <button 
                      className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-2xl shadow-lg transition-all duration-200 hover:scale-110 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to favorites logic here
                        Swal.fire({
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 2000,
                          icon: 'success',
                          title: `${hotel.name} added to favorites!`
                        });
                      }}
                      aria-label="Add to favorites"
                    >
                      <Heart 
                        size={20} 
                        className="text-gray-600 group-hover:text-red-500 transition-colors duration-200"
                        fill="none"
                      />
                    </button>
                    
                    {/* Type Badge */}
                    <div className="absolute top-4 right-16 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      {hotel.type === 'vacation rental' ? '🏠 Rental' : '🏨 Hotel'}
                    </div>
                    
                    {/* Location Badge */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium z-10">
                      <MapPin size={14} className="inline mr-1" />
                      {selectedCity?.label || 'Mumbai Area'}
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute bottom-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-lg z-10">
                      <div className="text-center">
                        <div className="text-lg">${hotel.rate_per_night?.toLocaleString() || '1,000'}</div>
                        <div className="text-xs">per night</div>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div className="p-6 lg:p-8">
                    {/* Hotel Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {hotel.name || 'Premium Hotel'}
                        </h3>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <span className="flex items-center mr-4">
                            <MapPin size={14} className="mr-1" />
                            {selectedCity?.label || 'Mumbai'}
                          </span>
                          <span className="flex items-center">
                            <Star size={14} className="mr-1 text-yellow-400 fill-current" />
                            {hotel.location_rating?.toFixed(1) || '4.2'} location
                          </span>
                        </div>
                        
                        {/* Reviews */}
                        {hotel.reviews && (
                          <div className="text-xs text-gray-500 mb-3">
                            {typeof hotel.reviews === 'number' ? `${hotel.reviews.toLocaleString()} reviews` : `${hotel.reviews?.length || 0} reviews`}
                          </div>
                        )}
                        
                        {/* Amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4 -mx-1">
                            {getAmenitiesIcons(hotel.amenities)}
                          </div>
                        )}
                        
                        {/* Essential Info */}
                        {hotel.essential_info && hotel.essential_info.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {hotel.essential_info.slice(0, 3).map((info: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {info}
                              </span>
                            ))}
                            {hotel.essential_info.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{hotel.essential_info.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Info */}
                      <div className="text-right hidden lg:block">
                        <div className="text-2xl font-bold text-emerald-600">
                          ${hotel.rate_per_night?.toLocaleString() || '1,000'}
                        </div>
                        <div className="text-sm text-gray-500">per night</div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {hotel.essential_info && hotel.essential_info.length > 0 
                          ? hotel.essential_info.join('. ') + '.'
                          : truncateWords('Experience luxury and comfort at this premium accommodation with modern amenities and exceptional service in a prime location.', 25)
                        }
                      </p>
                    </div>

                    {/* Check-in/out times */}
                    {(hotel.check_in_time || hotel.check_out_time) && (
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-6 py-2 border-t border-gray-200">
                        <span className="flex items-center">
                          <Clock size={14} className="mr-2" />
                          Check-in: {hotel.check_in_time || '2:00 PM'} | Check-out: {hotel.check_out_time || '12:00 PM'}
                        </span>
                        {selectedCity && (
                          <span className="flex items-center text-emerald-600 font-medium">
                            {selectedCity.label}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Pricing and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-left">
                        <div className="text-3xl font-bold text-gray-900">
                          ${hotel.rate_per_night?.toLocaleString() || '1,000'}
                          <span className="text-lg font-normal text-gray-600 ml-2">/night</span>
                        </div>
                        {startDate && endDate && (
                          <div className="text-sm text-green-600 font-medium mt-1">
                            Total: ${(hotel.rate_per_night * nights || 1000 * nights).toLocaleString()} for {nights} {nights === 1 ? 'night' : 'nights'}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleBooking(hotel)}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 whitespace-nowrap flex items-center space-x-2"
                      >
                        <span>Book Now</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : !searchLoading && (!hotelOptions?.HotelByLocation || hotelOptions.HotelByLocation.length === 0) ? (
              <div className="text-center py-20">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Hotel size={48} className="text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to find your stay?</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Enter your destination and travel dates above to discover amazing hotels and accommodations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      // Scroll to search form
                      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Search Hotels
                  </button>
                  <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-colors hover:bg-gray-50">
                    Explore Mumbai
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Pagination */}
          {totalPages > 1 && currentHotels.length > 0 && (
            <div className="flex justify-center mt-16">
              <nav className="flex items-center space-x-1 bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors disabled:text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = index + 1;
                  } else if (currentPage <= 4) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + index;
                  } else {
                    pageNum = currentPage - 3 + index;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                    >
                      {pageNum === currentPage ? pageNum : pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 7 && currentPage < totalPages - 3 && (
                  <span className="px-3 py-2 text-sm text-gray-400">...</span>
                )}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors disabled:text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <span className="text-sm text-gray-600 px-4">
                  Page {currentPage} of {totalPages}
                </span>
              </nav>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Enhanced Modal for Hotel Details */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Hotel Details"
        className="bg-white rounded-3xl max-w-4xl mx-auto max-h-[95vh] overflow-y-auto outline-none shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
      >
        <div className="relative">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl shadow-lg transition-all duration-200 hover:scale-110 z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {currentHotels[0] && (
            <div className="p-6 lg:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{currentHotels[0].name}</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About this property</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {currentHotels[0].essential_info?.join('. ') || 'Experience exceptional comfort and service at this premium accommodation located in the heart of the city. Enjoy modern amenities, attentive staff, and convenient access to local attractions and business districts.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-2xl p-6">
                      <h4 className="font-semibold text-blue-900 mb-3">Check-in & Check-out</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <p><Clock size={16} className="inline mr-2" /> Check-in: {currentHotels[0].check_in_time || '2:00 PM'}</p>
                        <p><Clock size={16} className="inline mr-2" /> Check-out: {currentHotels[0].check_out_time || '12:00 PM'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-2xl p-6">
                      <h4 className="font-semibold text-green-900 mb-3">Property highlights</h4>
                      <div className="space-y-2 text-sm text-green-800">
                        <p><Star size={16} className="inline mr-2 text-yellow-500" /> Rating: {(currentHotels[0].overall_rating || 4.0).toFixed(1)}/5</p>
                        <p><Users size={16} className="inline mr-2" /> Reviews: {typeof currentHotels[0].reviews === 'number' ? currentHotels[0].reviews.toLocaleString() : `${currentHotels[0].reviews?.length || 0}`}</p>
                        <p><MapPin size={16} className="inline mr-2" /> Location rating: {(currentHotels[0].location_rating || 4.0).toFixed(1)}/5</p>
                      </div>
                    </div>
                  </div>
                  
                  {currentHotels[0].amenities && currentHotels[0].amenities.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {getAmenitiesIcons(currentHotels[0].amenities)}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-6 text-center">
                    <div className="text-4xl font-bold mb-2">${currentHotels[0].rate_per_night?.toLocaleString() || '1,000'}</div>
                    <div className="text-lg">per night</div>
                    {startDate && endDate && (
                      <div className="text-sm mt-2 opacity-90">
                        Total: ${(currentHotels[0].rate_per_night * nights || 1000 * nights).toLocaleString()} for {nights} {nights === 1 ? 'night' : 'nights'}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      handleBooking(currentHotels[0]);
                      closeModal();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    Reserve Now
                  </button>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p className="mb-2">Free cancellation available</p>
                    <p>Best price guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <style jsx>{`
        .line-clamp-1, .line-clamp-2, .line-clamp-3 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-1 { -webkit-line-clamp: 1; }
        .line-clamp-2 { -webkit-line-clamp: 2; }
        .line-clamp-3 { -webkit-line-clamp: 3; }
        
        .react-select-container {
          font-size: 1rem;
        }
        
        @media (max-width: 768px) {
          .grid-cols-4 { grid-template-columns: 1fr; }
          .lg\\:col-span-2 { grid-column: 1 / -1; }
        }
      `}</style>
    </>
  );
};

export default Hotels;
