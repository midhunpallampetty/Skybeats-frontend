'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/store';
import { setSelectedUser } from '@/redux/slices/hotelGuestSlice';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
const SelectHotel = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const data = useSelector((state: RootState) => state.hotelBookDetail.selectedHotel);
  const details = useSelector((state: RootState) => state.hotelGuestData.selectedUser);
  const token = Cookies.get('jwtToken');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState('');
  const [rooms, setRooms] = useState(1); // Default number of rooms
  const [bedType, setBedType] = useState('Single'); // Default bed type
  const [amount, setAmount] = useState(0);
  const [minCheckoutDate, setMinCheckoutDate] = useState('');
  const getGuestDetails=useSelector((state:RootState)=>state.hotelGuestData.selectedUser);

  console.log(data, 'vdvdsvData');
const userId=Cookies.get('userId');
const validateBookingForm = () => {
  if (!checkin) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please select a check-in date.',
      icon: 'error',
    });
    return false;
  }

  if (!checkout) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please select a check-out date.',
      icon: 'error',
    });
    return false;
  }

  if (new Date(checkout) <= new Date(checkin)) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Check-out date must be after the check-in date.',
      icon: 'error',
    });
    return false;
  }

  if (!guests || parseInt(guests) < 1) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please select at least one guest.',
      icon: 'error',
    });
    return false;
  }

  if (!rooms || parseInt(rooms) < 1) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please select at least one room.',
      icon: 'error',
    });
    return false;
  }

  if (!bedType) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please select a room type.',
      icon: 'error',
    });
    return false;
  }

  return true;
};

useEffect(() => {
  const userId = Cookies.get('userId');
  const accessToken = Cookies.get('accessToken');
  const refreshToken = Cookies.get('refreshToken');

  if (!userId || !accessToken || !refreshToken) {
    Cookies.remove('userId');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    router.push('/');  // Redirect to home or login page
  }
}, [router]);

const handleBookHotel = () => {
  // Validate form fields before proceeding
  if (!validateBookingForm()) {
    return; // Exit if validation fails
  }

  // Dispatch user-selected booking details
  dispatch(setSelectedUser({ checkin, checkout, guests, rooms, bedType, amount }));

  // Navigate to the booking details page
  router.push('/hotel/hotelBookDetail');
};


  useEffect(() => {
    if (checkin && checkout && guests && rooms && bedType) {
      const totalStayDays = dateDifference(checkin, checkout);

      // Determine room price based on bed type
      let roomPrice = 0;
      if (bedType === 'Single') {
        roomPrice = 1000;
      } else if (bedType === 'Double') {
        roomPrice = 2500;
      } else if (bedType === 'Suite') {
        roomPrice = 3000;
      }

      // Calculate total amount
      const calculatedAmount = roomPrice * parseInt(guests) * parseInt(rooms) * totalStayDays;
      setAmount(calculatedAmount);
    }
  }, [checkin, checkout, guests, rooms, bedType]);

  function dateDifference(d1: string, d2: string) {
    const date1 = parseDate(d1);
    const date2 = parseDate(d2);
    const timeDifference = date2.getTime() - date1.getTime();
    const dayDifference = timeDifference / (1000 * 60 * 60 * 24);
    return Math.abs(dayDifference);
  }
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0!
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  function parseDate(dateStr: string) {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const formatCheckinDateForMinCheckout = (checkinDate: string) => {
    const [day, month, year] = checkinDate.split('-').map(Number);
    const formattedDate = new Date(year, month - 1, day);
    const yyyy = formattedDate.getFullYear();
    const mm = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(formattedDate.getDate() + 1).padStart(2, '0'); // Ensuring checkout is after check-in
    return `${yyyy}-${mm}-${dd}`;
  };
  useEffect(()=>{
    console.log(userId)
    if(!userId){
      router.push('/')
    }
    },[userId])
  return (
    <>
      <Navbar />
      <div className="mt-28">
        <div className="container mx-auto p-4">
          {/* Hotel Title */}
          <div className="bg-gradient-to-r from-[#295b64] to-[#0f397944] p-8 rounded-lg text-center">
            <h1 className="text-5xl font-bold text-white shadow-lg">{data?.name}</h1>
          </div>

          {/* Hotel Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            <img
              className="rounded-lg transform hover:scale-105 transition-all"
              src="https://identityinteriorbd.com/wp-content/uploads/2024/03/h4-1.jpg"
              alt="Hotel Image 1"
            />
            <img
              className="rounded-lg transform hover:scale-105 transition-all"
              src="https://algedra.com.tr/files/hotels_interior/hotel_interior_design_1.jpg"
              alt="Hotel Image 2"
            />
            <img
              className="rounded-lg transform hover:scale-105 transition-all"
              src="https://www.hotellobbies.net/wp-content/uploads/2019/03/luxury-hotel-interior-design-idear-for-bedroom.jpg"
              alt="Hotel Image 3"
            />
            <img
              className="rounded-lg transform hover:scale-105 transition-all"
              src="https://i.pinimg.com/564x/69/c0/21/69c0214153dcc630840393cd8226b6d2.jpg"
              alt="Hotel Image 4"
            />
            <img
              className="rounded-lg transform hover:scale-105 transition-all"
              src="https://foyr.com/learn/wp-content/uploads/2021/12/hotel-interior-design.jpg"
              alt="Hotel Image 5"
            />
          </div>

          {/* Rating Section */}
          <div className="w-24 h-20 shadow-inner shadow-white/25 rounded-md flex items-center mt-6 bg-[#0f3131] backdrop-blur-md ">
            <svg xmlns="http://www.w3.org/2000/svg" fill="white" width="25" viewBox="0 0 576 512"className='ml-2'>
              <path d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3 0 289.2zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z" />
            </svg>
            <p className="text-white font-extrabold text-xl ml-4">{data?.location_rating}</p>
          </div>

          {/* Hotel Info & Booking Section */}
          <div className="text-white flex flex-col md:flex-row mt-8">
            <div className="flex-1">
              {data?.amenities?.map((amenity, index) => (
                <div className="mt-2 flex items-center" key={index}>
                  <span className="font-semibold bg-blue-600 px-2 py-1 rounded-lg">{amenity}</span>
                </div>
              ))}

              <div className="mt-6">
                <h2 className="text-3xl font-bold">About this place</h2>
                <p className="mt-2 text-lg">
                  SANTIPHAP ROOM - is a spacious en-suite located on the top floor of the renovated 40-year-old shophouse
                  called "Ba hao". The room is a Thai-contemporary inspired, overlooking one of the most sacred "Trimit
                  Temple" and a balcony with little garden.
                </p>
              </div>
            </div>

            {/* Booking Card */}
            <div className="bg-black/40 md:w-1/3 md:ml-8 mt-8 md:mt-0 backdrop-blur-lg rounded-lg shadow-white/30 shadow-inner">
              <div className="           p-6 rounded-lg">
                <p className="text-3xl font-bold">₹1000 / night</p>
                <div className="mt-6">
                  <label htmlFor="checkin" className="text-lg">Check-in</label>
                  <input
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
                      setCheckin(formattedDate);

                      // Set min date for checkout (must be at least 1 day after check-in)
                      setMinCheckoutDate(formatCheckinDateForMinCheckout(formattedDate));
                    }}
                    type="date"
                    id="checkin"
                    className="w-full mt-1 p-2 rounded-lg bg-black/50 border text-white"
                    min={getTodayDate()} // Set minimum date for check-in as today
                  />
                </div>
                <div className="mt-6">
                  <label htmlFor="checkout" className="text-lg">Check-out</label>
                  <input
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
                      setCheckout(formattedDate);
                    }}
                    type="date"
                    id="checkout"
                    className="w-full mt-1 p-2 rounded-lg bg-black/50 border text-white"
                    min={minCheckoutDate} // Set minimum date for checkout as the day after check-in
                  />
                </div>

                <div className="mt-6">
                  <label htmlFor="guests" className="text-lg">Guests</label>
                  <input
                    onChange={(e) => setGuests(e.target.value)}
                    type="number"
                    id="guests"
                    min={1}
                    className="w-full mt-1 p-2 rounded-lg bg-black/50 border text-white"
                  />
                </div>

                <div className="mt-6">
                  <label htmlFor="rooms" className="text-lg">Rooms</label>
                  <input
                    onChange={(e) => setRooms(parseInt(e.target.value))}
                    type="number"
                    id="rooms"
                    min={1}
                    className="w-full mt-1 p-2 rounded-lg bg-black/50 border text-white"
                  />
                </div>

                <div className="mt-6">
                  <label htmlFor="bedType" className="text-lg">Room Type</label>
                  <select
                    id="bedType"
                    value={bedType}
                    onChange={(e) => setBedType(e.target.value)}
                    className="w-full mt-1 p-2 rounded-lg bg-black/50 border text-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <p className="text-lg">Total Amount:</p>
                  <p className="text-2xl font-bold">₹{amount}</p>
                </div>

                <button
                  onClick={handleBookHotel}
                  className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-800 transition-all text-white rounded-lg"
                >
                  Book Hotel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SelectHotel;
