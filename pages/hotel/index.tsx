'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { ApolloClient, gql } from '@apollo/client';
import { Airport } from '@/interfaces/Airport';
import { setHotelBookDetail } from '@/redux/slices/hotelBookDetailSlice';
import Modal from 'react-modal';
import Footer from '../../components/Footer';
import axiosInstance from '../api/utils/axiosInstance';
import DatePicker from 'react-datepicker';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setHotelOptions } from '@/redux/slices/bookHotelSlice';
import { useRef } from 'react';
import Select, { SingleValue } from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import debounce from 'lodash.debounce';
import GET_NEARBY_HOTELS from '@/graphql/queries/nearbyhotels';
import axios from 'axios';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import { OptionType } from '@/interfaces/OptionType';
import { IMycity } from '@/interfaces/IMyCity';
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
  
  const [pixabayImages, setpixabayImages] = useState([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredAirports, setFilteredAirports] = useState<OptionType[]>([]);
  const [sortOption, setSortOption] = useState('name-asc');
  const [searchLoading, setSearchLoading] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  
  const { loading: nearbyQueryLoading, error, data } = useQuery(GET_NEARBY_HOTELS);
  const [myCity, SetmyCity] = useState<IMycity>({ city: '', Location: '', Region: '' });
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCity, setSelectedCity] = useState<SingleValue<OptionType> | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  
  const hotelOptions = useSelector((state: RootState) => state.hotelOptions.hotelOptions);
  const [hotels, setHotels] = useState([]);
  const itemsPerPage = 6; 
  const [currentPage, setCurrentPage] = useState(1);
  
  const testData = useSelector((state: RootState) => state.hotelBookDetail.selectedHotel);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Loading Components
  const SearchLoader = () => (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      <span className="text-blue-500">Searching for hotels...</span>
    </div>
  );

  const HotelsLoader = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="flex flex-col md:flex-row bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="w-full md:w-64 h-48 bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="flex-1 md:ml-4 space-y-3 mt-4 md:mt-0">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="flex items-center space-x-2 mt-4">
              <div className="h-3 bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const handleBooking = (hotel: any) => {
    const hotelDetails = {
      type: hotel.type,
      name: hotel.name,
      gps_coordinates: hotel.gps_coordinates,
      check_in_time: hotel.check_in_time,
      check_out_time: hotel.check_out_time,
      rate_per_night: hotel.rate_per_night,
      total_rate: hotel.total_rate,
      prices: hotel.prices,
      nearby_places: hotel.nearby_places,
      images: hotel.images,
      overall_rating: hotel.overall_rating,
      reviews: hotel.reviews,
      location_rating: hotel.location_rating,
      amenities: hotel.amenities,
      excluded_amenities: hotel.excluded_amenities,
      essential_info: hotel.essential_info,
    };

    dispatch(setHotelBookDetail(hotelDetails));
    router.push('/hotel/selectHotel');
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const sortHotels = (hotels: any[], option: string) => {
    switch (option) {
      case 'name-asc':
        return hotels.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return hotels.sort((a, b) => b.name.localeCompare(a.name));
      case 'rating-asc':
        return hotels.sort((a, b) => a.overall_rating - b.overall_rating);
      case 'rating-desc':
        return hotels.sort((a, b) => b.overall_rating - a.overall_rating);
      case 'price-asc':
        return hotels.sort((a, b) => a.rate_per_night - b.rate_per_night);
      case 'price-desc':
        return hotels.sort((a, b) => b.rate_per_night - a.rate_per_night);
      default:
        return hotels;
    }
  };

  // Enhanced image fetching with better error handling
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response: any = await axios.get('https://pixabay.com/api/', {
          params: {
            key: '38643909-0965461316365ac27e67b31c5',
            q: 'luxury+hotel+room',
            image_type: 'photo',
            per_page: 50,
          },
        });

        if (response.data && response.data.hits && response.data.hits.length > 0) {
          setpixabayImages(response.data.hits);
          const randomImage = response.data.hits[Math.floor(Math.random() * response.data.hits.length)];
          setImageUrl(randomImage.webformatURL);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        // Fallback image
        setImageUrl('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80');
      }
    };

    fetchImage();
  }, []);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await axiosInstance.get<Airport[]>('/getAirports');
        const airportsData = response.data;
        setAirports(airportsData);

        setFilteredAirports(
          airportsData.map(airport => ({
            value: airport.code,
            label: `${airport.city}, ${airport.country}`,
          }))
        );
      } catch (error: any) {
        console.error('Error fetching airports:', error.message || error);
      }
    };

    fetchAirports();
  }, []);

  // Enhanced hotel search with loading state
  const handleSearchHotels = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!selectedCity) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please select a city.',
        icon: 'error',
      });
      return;
    }

    if (!startDate || !endDate) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please select both start and end dates.',
        icon: 'error',
      });
      return;
    }

    if (startDate > endDate) {
      Swal.fire({
        title: 'Validation Error',
        text: 'End date cannot be earlier than start date.',
        icon: 'error',
      });
      return;
    }

    setSearchLoading(true);
    setCurrentPage(1); // Reset to first page

    try {
      console.log(selectedCity.label.toLowerCase(), 'searching hotels...');
      
      const response = await axiosInstance.post('/searchHotels', {
        city: selectedCity.label.toLowerCase(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      dispatch(setHotelOptions(response.data));
      console.log('Hotels fetched successfully:', response.data);
      
      Swal.fire({
        title: 'Success!',
        text: `Found ${response.data.HotelByLocation?.length || 0} hotels in ${selectedCity.label}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error searching hotels:', error.message);
      Swal.fire({
        title: 'Search Error',
        text: 'Unable to fetch hotels at this moment. Please try again.',
        icon: 'error',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const currentHotels = hotelOptions?.HotelByLocation?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil((hotelOptions?.HotelByLocation?.length || 0) / itemsPerPage);
  const sortedHotels = sortHotels([...(currentHotels || [])], sortOption);
  
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const scrollLeft = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -scrollContainer.clientWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: scrollContainer.clientWidth, behavior: 'smooth' });
    }
  };

  const truncateWords = (text: string, wordLimit: number): string => {
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16}
          fill={i <= Math.floor(rating) ? '#fbbf24' : 'none'}
          className={`${i <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'} `}
        />
      );
    }
    return stars;
  };

  const getAmenitiesIcons = (amenities: string[]) => {
    const amenityIcons: { [key: string]: JSX.Element } = {
      'WiFi': <Wifi size={16} className="text-blue-400" />,
      'Pool': <Pool size={16} className="text-blue-400" />,
      'Parking': <Car size={16} className="text-blue-400" />,
      'Restaurant': <Utensils size={16} className="text-blue-400" />,
      'Spa': <Hotel size={16} className="text-blue-400" />,
    };

    return amenities.slice(0, 3).map((amenity, index) => (
      <div key={index} className="flex items-center space-x-1">
        {amenityIcons[amenity] || <Bed size={16} className="text-blue-400" />}
        <span className="text-xs">{amenity}</span>
      </div>
    ));
  };

  // Set nearby loading state
  useEffect(() => {
    setNearbyLoading(nearbyQueryLoading);
  }, [nearbyQueryLoading]);

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
          style={{ opacity: 0.7 }}
        >
          <source src="/hotel intro.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="w-full max-w-2xl mx-auto p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Find Your Perfect Stay
              </h1>
              <p className="text-white/80 text-lg">Discover amazing hotels with the best prices</p>
            </div>
            
            <form onSubmit={handleSearchHotels} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Select
                    options={filteredAirports}
                    className="text-black"
                    classNamePrefix="react-select"
                    onChange={setSelectedCity}
                    value={selectedCity}
                    placeholder="Select destination"
                    isSearchable={false}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        backgroundColor: 'white',
                        borderColor: '#e5e7eb',
                        borderRadius: '12px',
                        minHeight: '56px',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#3b82f6',
                        }
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280',
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                        color: state.isSelected ? 'white' : '#374151',
                        '&:active': {
                          backgroundColor: '#3b82f6',
                          color: 'white',
                        }
                      }),
                    }}
                  />
                </div>
                
                <div className="relative md:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                        <Clock size={14} className="mr-1" />
                        Check-in Date
                      </label>
                      <div className="relative">
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          placeholderText="Check-in date"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          minDate={new Date()}
                          dateFormat="MMM dd, yyyy"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center">
                        <Clock size={14} className="mr-1" />
                        Check-out Date
                      </label>
                      <div className="relative">
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          placeholderText="Check-out date"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          minDate={startDate || new Date()}
                          dateFormat="MMM dd, yyyy"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={searchLoading || !selectedCity || !startDate || !endDate}
                className={`w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  searchLoading || !selectedCity || !startDate || !endDate
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                } text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
              >
                {searchLoading ? (
                  <SearchLoader />
                ) : (
                  <>
                    <Search size={20} className="mr-2" />
                    Search Hotels
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Nearby Hotels Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Hotels in Nearby Locations
            </h2>
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <MapPin size={16} className="mr-2" />
              {myCity?.city}, {myCity?.Region}
            </div>
          </div>

          {nearbyLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute -top-12 left-4 md:left-8 z-10">
                <button
                  onClick={scrollLeft}
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {data?.NearByHotels?.map((hotel: any) => (
                  <div
                    key={hotel.name}
                    className="flex-none w-72 snap-center group cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={openModal}
                  >
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-xl hover:shadow-2xl">
                      <div className="relative h-48">
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"}
                          alt={hotel.name}
                        />
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold shadow-lg">
                          <span className="flex items-center">
                            {getRatingStars(hotel.overall_rating)}
                            <span className="ml-1">{hotel.overall_rating.toFixed(1)}</span>
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                          {hotel.location_rating?.toFixed(1)} • Location
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-yellow-300 transition-colors">
                          {hotel.name}
                        </h3>
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {hotel.nearby_places?.join(', ') || 'Prime location with great amenities'}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center text-sm text-green-400 font-semibold">
                            <span className="text-2xl">${hotel.rate_per_night}</span>
                            <span className="ml-1">/night</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Users size={12} className="mr-1" />
                            Up to 4 guests
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute -top-12 right-4 md:right-8 z-10">
                <button
                  onClick={scrollRight}
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Search Results Section */}
      <section className="py-16 px-4 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          {/* Sorting and Results Count */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Hotel size={20} />
              <span className="text-lg font-semibold">
                {hotelOptions?.HotelByLocation ? 
                  `Found ${hotelOptions.HotelByLocation.length} hotels in ${selectedCity?.label || 'your destination'}` : 
                  'Search for hotels to see results'
                }
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:block">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="rating-desc">Rating (High to Low)</option>
                <option value="rating-asc">Rating (Low to High)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Hotels Grid */}
          <div className="space-y-6">
            {searchLoading ? (
              <HotelsLoader />
            ) : sortedHotels.length > 0 ? (
              sortedHotels.map((hotel: any, index: number) => (
                <div
                  key={`${hotel.id}-${index}`}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 border border-gray-200 hover:border-blue-200"
                >
                  {/* Hotel Image and Actions */}
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={hotel.images?.[0] || imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                      alt={hotel.name}
                    />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      <span className="flex items-center">
                        {getRatingStars(hotel.overall_rating)}
                        <span className="ml-1">{hotel.overall_rating.toFixed(1)}</span>
                      </span>
                    </div>
                    
                    {/* Favorite Button */}
                    <button className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110">
                      <Heart 
                        size={20} 
                        className="text-gray-600 group-hover:text-red-500 transition-colors"
                        fill="currentColor"
                      />
                    </button>
                    
                    {/* Location Badge */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      <MapPin size={14} className="inline mr-1" />
                      {selectedCity?.label || 'City Center'}
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute bottom-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      ${hotel.rate_per_night}/night
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {hotel.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {hotel.type || 'Hotel'} • {hotel.reviews?.length || 0} reviews
                        </p>
                        
                        {/* Amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {getAmenitiesIcons(hotel.amenities)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {hotel.essential_info || truncateWords(hotel.description || 'Experience luxury and comfort at this beautifully designed hotel with modern amenities and exceptional service.', 25)}
                    </p>

                    {/* Pricing and Booking */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-left">
                        <div className="text-2xl font-bold text-gray-900">
                          ${hotel.rate_per_night}
                          <span className="text-lg font-normal text-gray-600 ml-1">/night</span>
                        </div>
                        {hotel.total_rate && (
                          <p className="text-sm text-green-600 font-medium">
                            Total: ${hotel.total_rate} for your stay
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleBooking(hotel)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : hotelOptions?.HotelByLocation && !searchLoading ? (
              <div className="text-center py-12">
                <Hotel size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hotels found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or dates</p>
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setStartDate(null);
                    setEndDate(null);
                    setCurrentPage(1);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
                >
                  New Search
                </button>
              </div>
            ) : null}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2 bg-white p-4 rounded-xl shadow-md">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Enhanced Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Hotel Details"
        className="bg-white rounded-2xl max-w-2xl mx-auto max-h-[90vh] overflow-y-auto outline-none"
        overlayClassName="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div className="relative">
          <button
            onClick={closeModal}
            className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hotel Details</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>Name:</strong> {data?.NearByHotels?.[0]?.name || 'Sample Hotel'}</p>
              <p><strong>Rating:</strong> 4.5/5 (128 reviews)</p>
              <p><strong>Location:</strong> Downtown Business District</p>
              <p><strong>Amenities:</strong> Free WiFi, Pool, Gym, Restaurant, Parking</p>
              <p className="text-sm">
                This luxury hotel offers modern amenities and exceptional service in the heart of the city. 
                Perfect for business travelers and tourists alike.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default Hotels;
