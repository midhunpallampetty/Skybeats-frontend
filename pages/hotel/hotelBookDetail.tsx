'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/store';
import { setGuestDetails } from '@/redux/slices/bookdetailSlice';
import BookingSummaryModal from '../../components/HotelModal';
import Cookies from 'js-cookie';

const HotelBookDetail: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const bookdata = useSelector((state: RootState) => state.hotelGuestData.selectedUser);
  const hotelBookingDetail = useSelector((state: RootState) => state.hotelBookDetail.selectedHotel);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); // State to manage field-specific errors

  const token = Cookies.get('jwtToken');
  const userId = Cookies.get('userId');

  useEffect(() => {
    const userId = Cookies.get('userId');
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    if (!userId || !accessToken || !refreshToken) {
      Cookies.remove('userId');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      router.push('/'); // Redirect to home or login page
    }
  }, [router]);

  useEffect(() => {
    if (!hotelBookingDetail) {
      router.push('/hotel');
    }
  }, [hotelBookingDetail]);

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      return; // Exit if validation fails
    }

    // Dispatch the guest details
    dispatch(setGuestDetails({ firstName, lastName, email, phoneNumber }));

    // Redirect to the payment page
    router.push('/hotel/payNow');
  };

  const handleShowModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <BookingSummaryModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <div className="bg-gray-900 text-white min-h-screen">
        <div className="relative h-64">
          <Image
            src="https://images2.alphacoders.com/258/thumb-1920-258412.jpg"
            alt="Header Image"
            layout="fill"
            objectFit="cover"
            className="rounded-b-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <h1 className="text-3xl font-bold">Add Guest Details</h1>
          </div>
        </div>

        <div className="container mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
          {hotelBookingDetail ? (
            <>
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-black font-extrabold">{hotelBookingDetail.name}</p>
                  <p className="text-black font-extrabold">{hotelBookingDetail?.overall_rating}</p>
                </div>
                <div>
                  <p className="text-right text-black font-extrabold">Fare Type: Regular</p>
                  <p className="text-right text-black font-extrabold">Total Guests: {bookdata?.guests}</p>
                  <p className="text-right text-black font-extrabold">Total Fare: ₹{bookdata?.amount}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg text-black font-extrabold">Rooms: {bookdata?.rooms}</p>
                  <p className="text-sm text-black font-extrabold">Bed Type: {bookdata?.bedType}</p>
                </div>
                <div className="flex space-x-4">
                  <button className="bg-blue-500 text-white font-semibold px-4 py-2 rounded" onClick={handleShowModal}>
                    Details
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-black font-extrabold">No hotels selected</p>
          )}
        </div>

        <div className="container mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-black">Guest Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm text-black font-extrabold">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-extrabold text-black">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                />
                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-extrabold text-black">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-extrabold text-black">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" className="bg-green-500 text-white font-semibold px-4 py-2 rounded">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default HotelBookDetail;
