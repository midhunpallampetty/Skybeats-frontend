'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/pages/_components/Navbar';
import { ApolloClient, gql } from '@apollo/client';
import { Airport } from '@/interfaces/Airport';
import { setHotelBookDetail } from '@/redux/slices/hotelBookDetailSlice';
import Modal from 'react-modal';
import Footer from '../_components/Footer';
import axiosInstance from '../api/utils/axiosInstance';
import DatePicker from 'react-datepicker';
import { useDispatch, UseDispatch,useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setHotelOptions } from '@/redux/slices/bookHotelSlice';
import { useRef } from 'react';
import Select, { SingleValue, ActionMeta, InputActionMeta } from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import debounce from 'lodash.debounce';
import GET_NEARBY_HOTELS from '@/graphql/queries/nearbyhotels';
import axios from 'axios';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import { AnyNaptrRecord } from 'dns';
import { OptionType } from '@/interfaces/OptionType';
import { CityOption } from '@/interfaces/cityOption';
import { IMycity } from '@/interfaces/IMyCity';
import Swal from 'sweetalert2';
import { RootState } from '@/redux/store';

const Hotels: React.FC = () => {
  
const dispatch=useDispatch();
const router=useRouter();
  const [pixabayImages,setpixabayImages]=useState([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredAirports, setFilteredAirports] = useState<OptionType[]>([]);
  const [sortOption, setSortOption] = useState('name-asc');
  
  const { loading, error, data } = useQuery(GET_NEARBY_HOTELS);
  const [myCity, SetmyCity] = useState<IMycity>({ city: '', Location: '', Region: '' });
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCity, setSelectedCity] = useState<SingleValue<OptionType> | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const testData=useSelector((state:RootState)=>state.hotelBookDetail.selectedHotel);

  const [imageUrl, setImageUrl] = useState('');
  // const [hotelOptions, setHotelOptions] = useState<any>([]);
  const hotelOptions=useSelector((state:RootState)=>state.hotelOptions.hotelOptions);
  const [hotels, setHotels] = useState([]);
  const itemsPerPage = 6; 
  const [currentPage, setCurrentPage] = useState(1);
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

        router.push('/hotel/selectHotel');
  };                 

  const handlePageChange = (pageNumber:number) => {
    setCurrentPage(pageNumber);
    console.log('got data  gaxiosgaxiosgaxiosgaxiosgaxiosgaxios',testData);

  };
  const sortHotels = (hotels: any[], option: string) => {
    switch (option) {
      case 'name-asc':
        return hotels.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name ascending
      case 'name-desc':
        return hotels.sort((a, b) => b.name.localeCompare(a.name)); // Sort by name descending
      case 'rating-asc':
        return hotels.sort((a, b) => a.overall_rating - b.overall_rating); // Sort by rating ascending
      case 'rating-desc':
        return hotels.sort((a, b) => b.overall_rating - a.overall_rating); // Sort by rating descending
      default:
        return hotels;
    }
  };
  
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response:any = await axios.get('https://pixabay.com/api/', {
          params: {
            key: '38643909-0965461316365ac27e67b31c5', 
            q: 'hotel+rooms',
            image_type: 'photo',
            per_page: 50,  
          },
        });

        setpixabayImages(response.data.hits);
        console.log(pixabayImages,'testbvfhvghvb');
        if (pixabayImages.length > 0) {
          const randomImage =  JSON.parse(JSON.stringify(pixabayImages[Math.floor(Math.random() * pixabayImages.length)]));
          setImageUrl(randomImage.webformatURL);
        }
        
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    };

    fetchImage();
  }, []);

  // const hotelOptions=((state:RootState)=>state.hotels.hotels)
  console.log('accessed d');
  const currentHotels = hotelOptions?.HotelByLocation?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(hotelOptions?.HotelByLocation?.length / itemsPerPage);
  const sortedHotels = sortHotels([...currentHotels || []], sortOption);
  const [nearByHotel, setnearByHotel] = useState({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const scrollLeft = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -scrollContainer.clientWidth, behavior: 'smooth' });
    }
  };


  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await axiosInstance.get<Airport[]>('/getAirports');
    
        const airportsData = response.data; // Extract the data from the response
        setAirports(airportsData);
    
        setFilteredAirports(
          airportsData.map(airport => ({
            value: airport.code,
            label: `${airport.city}`,
          }))
        );
      } catch (error: any) {
        console.error('Error fetching airports:', error.message || error);
      }
    };

    fetchAirports();
  }, []);


  const scrollRight = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: scrollContainer.clientWidth, behavior: 'smooth' });
    }
  };



  console.log(myCity, 'mycity is', new Date());



  const handleCityChange = (selectedOption: SingleValue<OptionType>) => {
    setSelectedCity(selectedOption);
  };
  const handleSearchHotels = async (event: React.FormEvent) => {
    event.preventDefault();
  
    // Validate inputs
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
  
    try {
      console.log(selectedCity.label.toLowerCase(), 'searching hotels...');
      
      const response = await axiosInstance.post('/searchHotels', {
        city: selectedCity.label.toLowerCase(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
  
      // Dispatch the data to Redux or update state
      dispatch(setHotelOptions(response.data));  
      console.log('Hotels fetched successfully:', response.data);
    } catch (error: any) {
      console.error('Error searching hotels:', error.message);
      Swal.fire({
        title: 'Error',
        text: 'An error occurred while searching for hotels. Please try again.',
        icon: 'error',
      });
    }
  };
  
  console.log(hotelOptions, 'bhthbnghrbgrhebgh');
  function truncateWords(text: string, wordLimit: number): string {
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  }

  const validateForm = (): boolean => {
    if (!selectedCity) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please select a city.',
        icon: 'error',
      });
      return false;
    }

    if (!startDate) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please select a start date.',
        icon: 'error',
      });
      return false;
    }

    if (!endDate) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please select an end date.',
        icon: 'error',
      });
      return false;
    }

    return true;
  };

 

  return (
    <>
      <Navbar />const scrollRef = useRef(null);



     <div style={{ position: 'relative', zIndex: 1 }}>
      <video
        autoPlay
        loop
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
          opacity: 0.8,
        }}
      >
        <source src="/hotel intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div
        style={{
          height: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '80px',
        }}
      >
        <div className="container w-[620px] h-[250px] mx-auto p-8 bg-blue-950/80 bg-opacity-90 rounded-3xl flex flex-col justify-center space-y-6">
        <form onSubmit={handleSearchHotels}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-10">
          <Select
            options={filteredAirports}
            className="w-64 border-none rounded-r-lg text-black bg-blue-900"
            onChange={setSelectedCity}
            value={selectedCity}
            placeholder="Select City"
          />
        </div>
        <div className="relative flex text-black space-x-4 mt-4">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            className="border p-2 rounded"
            minDate={new Date()}
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            className="border p-2 rounded"
            minDate={startDate || new Date()}
          />
        </div>
        <button
          type="submit"
          className="mt-4 p-2 bg-blue-700 text-white rounded"
        >
          Search Hotels
        </button>
      </div>
    </form>

        </div>
      </div>
    </div>
      <section className='h-auto bg-gradient-to-r from-[#0f172a] to-[#131723] p-8'>
        <h1 className='text-white text-3xl font-semibold'>Hotels In Nearby Locations  </h1>
        <span className='text-white' style={{ display: 'inline-flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width='20' height='20' fill='red' viewBox="0 0 384 512">
            <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
          </svg>
          {myCity?.city}, {myCity?.Region}, {myCity?.Location}
        </span>
       <div className="overflow-hidden relative">
  {/* Left Scroll Button */}
  <div className="absolute top-1/2 transform -translate-y-1/2 left-2 z-10">
    <button
      onClick={scrollLeft}
      aria-label="Scroll left"
      className="focus:outline-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        fill="gray"
        viewBox="0 0 256 512"
      >
        <path d="M9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-128-128z" />
      </svg>
    </button>
  </div>

  {/* Right Scroll Button */}
  <div className="absolute top-1/2 transform -translate-y-1/2 right-2 z-10">
    <button
      onClick={scrollRight}
      aria-label="Scroll right"
      className="focus:outline-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        fill="gray"
        viewBox="0 0 256 512"
      >
        <path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s25.7 2.2 34.9-6.9l128-128z" />
      </svg>
    </button>
  </div>

  <div
    ref={scrollRef}
    className="flex mt-10 gap-8 overflow-x-auto scroll-smooth"
    style={{ scrollBehavior: 'smooth' }}
  >
    {data &&
      data.NearByHotels?.map((hotel: any) => (
        <div
          key={hotel.name}
          className="flex-none w-80 relative max-w-sm rounded-lg shadow bg-transparent border border-white/10 cursor-pointer transition-transform transform hover:scale-105"
          onClick={openModal}
        >
          <a href="#">
            <img
              className="rounded-t-lg w-full h-48 object-cover" // Added height and object-fit
              src="https://img.freepik.com/free-photo/beautiful-luxury-outdoor-swimming-pool-hotel-resort_74190-7433.jpg?semt=ais_hybrid"
              alt={`Image of ${hotel.name}`} // Improved alt text for accessibility
            />
            <div className="absolute top-2 right-2 bg-green-400 text-white text-xs font-bold py-1 px-2 rounded-lg">
              ⭐ {hotel.overall_rating.toFixed(1)}
            </div>
          </a>
          <div className="p-5">
            <a href="#">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {hotel.name.length > 30
                  ? `${hotel.name.substring(0, 30)}...`
                  : hotel.name}
              </h5>
            </a>
          </div>
        </div>
      ))}
  </div>
</div>


      </section>
      
      <section className='h-auto bg-gradient-to-r from-[#0f172a] to-[#131723] p-8'>
      <div className="flex justify-end mb-4">
  <select
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
    className="px-4 py-2 bg-blue-950 border border-gray-300 rounded-full text-white font-extrabold" 
  >
    <option value="name-asc">Sort by Name (A-Z)</option>
    <option value="name-desc">Sort by Name (Z-A)</option>
    <option value="rating-asc">Sort by Rating (Low to High)</option>
    <option value="rating-desc">Sort by Rating (High to Low)</option>
  </select>
</div>

        {hotelOptions.HotelByLocation && (
          <h1 className='text-white/50 font-semibold text-2xl mb-5 ml-[850px]'>
            Found {hotelOptions.HotelByLocation?.length} Hotels
          </h1>
        )}
 <div className="flex justify-center items-center h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedHotels.map((hotel: any) => (
          <a key={hotel.id} href="#" className="flex flex-col border border-white/10 md:flex-row bg-[#141f3b] text-white rounded-xl overflow-hidden shadow-lg">
            <div className="relative">
              <img className="object-cover w-full md:w-full h-56 md:h-auto" src={imageUrl || 'https://cdn.pixabay.com/photo/2014/07/10/17/17/hotel-389256_640.jpg'} alt="Hotel" />
              <button className="absolute top-3 left-3 bg-white text-red-500 p-2 rounded-full">
                ❤️
              </button>
            </div>
            <div className="flex flex-col rounded-tr-xl rounded-br-xl justify-between p-6 w-full">
              <div>
                <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">{hotel.overall_rating.toFixed(1)}</span>
                <h5 className="mt-4 mb-2 text-2xl font-bold tracking-tight">
                  {truncateWords(hotel.name, 10)}
                </h5>
                {selectedCity && (
                  <p className="text-gray-400">{selectedCity.label.toLowerCase()}</p>
                )}
              </div>
              <button onClick={() => { dispatch(setHotelBookDetail(hotel)); router.push('/hotel/selectHotel'); }} className="self-end mt-4 bg-green-400 text-white py-2 px-4 font-extrabold rounded-full hover:bg-green-600">
                Book Now
              </button>
            </div>
          </a>
        ))}
      </div>
    </div>

      </section>
      <div className="flex justify-center mt-6">
  {Array.from({ length: totalPages }, (_, index) => (
    <button
      key={index + 1}
      onClick={() => handlePageChange(index + 1)}
      className={`mx-1 px-3 py-1 rounded-full ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
    >
      {index + 1}
    </button>
  ))}
</div>



     
      <Footer/>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Hotel Details"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
          },
        }}
      >
        <h2>test</h2>
        <p>Rating:4.5</p>
        <p>More details about the hotel...</p>
        <button
          onClick={closeModal}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Close Modal
        </button>
      </Modal>
    </>
  );
};

export default Hotels;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
