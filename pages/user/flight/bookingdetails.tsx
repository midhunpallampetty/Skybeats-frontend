'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/store';
import { setPassengerDetails } from '@/redux/slices/bookdetailSlice';
import Swal from 'sweetalert2';
import FoodMenuModal from '@/components/FoodMenuModal';
import Cookies from 'js-cookie';
import axios from 'axios';
import axiosInstance from '@/pages/api/utils/axiosInstance';
import { clearSelectedReturnFlight } from '@/redux/slices/returnFlightSlice';

interface PassengerDetails {
  firstName: string;
  middleName: string;
  lastName: string;
  age: string;
  passportNumber: string;
  disability: string;
}

interface CommonDetails {
  email: string;
  phoneNumber: string;
}

const BookingDetailsPage: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const selectedFlight = useSelector((state: RootState) => state.bookdetail.selectedFlight);
  const selectedSeat = useSelector((state: RootState) => state.selectedSeats.selectedSeats);
  const returnFlight = useSelector((state: RootState) => state.returnFlights.selectedReturnFlight);

  const [passengerDetails, setPassengerDetailsState] = useState<PassengerDetails[]>([]);
  const [commonDetails, setCommonDetails] = useState<CommonDetails>({ email: '', phoneNumber: '' });
  const [errors, setErrors] = useState<Record<number, Record<string, boolean>>>({});
  const [isChecked, setIsChecked] = useState(false);
  const passengerTotal=selectedSeat.length;
  console.log(passengerTotal)
  const token = Cookies.get('accessToken');
  const userId = Cookies.get('userId');
console.log(passengerDetails,'zzzzzzzzzzzz')
const fetchPassengerInfo = async () => {
  try {
    const response = await axiosInstance.post('/getPassengerInfo', { userId }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const passengerInfoArray = response.data.getPassengerInfo;

    // Limit passenger data to the number of seats selected
    const availablePassengerInfo = passengerInfoArray.slice(0, selectedSeat.length);

    // Populate the passenger details fields based on available fetched data
    const populatedPassengerDetails = selectedSeat.map((_, index) => {
      const passengerInfo = availablePassengerInfo[index] || {};
      return {
        firstName: passengerInfo.firstName || '',
        middleName: passengerInfo.middleName || '',
        lastName: passengerInfo.lastName || '',
        age: passengerInfo.age || '',
        passportNumber: passengerInfo.passportNumber || '',
        disability: '', // or passengerInfo.disability if available
      };
    });

    setPassengerDetailsState(populatedPassengerDetails);

    // Set common details for email and phone number
    if (availablePassengerInfo.length > 0) {
      setCommonDetails({
        email: availablePassengerInfo[0].email || '',
        phoneNumber: availablePassengerInfo[0].phone || '',
      });
    }
  } catch (error) {
    console.error('Error fetching passenger info:', error);
  }
};

useEffect(() => {
  if (selectedSeat.length > 0 && passengerDetails.length === 0) {
    const mappedPassengers = selectedSeat.map((_, index) => {
      const passengerInfo = passengerDetails?.[index] || {};
      return {
        firstName: passengerInfo.firstName || '',
        middleName: passengerInfo.middleName || '',
        lastName: passengerInfo.lastName || '',
        age: passengerInfo.age || '',
        passportNumber: passengerInfo.passportNumber || '',
        disability: passengerInfo.disability || '',
      };
    });
    setPassengerDetailsState(mappedPassengers);
  }
}, [selectedSeat, passengerDetails]);
  const savePassengerInfo = async () => {
    for (let passenger of passengerDetails) {
      const data = {
        input: {
          email: commonDetails.email,
          firstName: passenger.firstName,
          lastName: passenger.lastName,
          middleName: passenger.middleName,
          passportNumber: passenger.passportNumber,
          phone: commonDetails.phoneNumber,
          userId,
          age: parseInt(passenger.age),
        }
      };

      try {
        const response = await axiosInstance.post('/savePassengerInfo', data, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Passenger info saved successfully:', response.data);
      } catch (error: any) {
        console.error('Error saving passenger info:', error.response?.data || error.message);
      }
    }
  };

  const handleCommonInputChange = (field: string, value: string) => {
    setCommonDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = () => {
    setIsChecked((prev) => !prev);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const updatedPassengers = [...passengerDetails];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    setPassengerDetailsState(updatedPassengers);
    setErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: !validateField(field, value) },
    }));
  };

  const validateField = (field: string, value: string): boolean => {
    if (field === 'age') return /^\d+$/.test(value) && Number(value) > 0;
    if (field === 'passportNumber') return value.trim().length > 5;
    if (field === 'firstName' || field === 'lastName') return value.trim().length > 1;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Check if all passenger details are filled
    const hasPassengerErrors = Object.values(errors).some((errorSet) =>
      Object.values(errorSet).some((error) => error)
    );
  
    // Check if any passenger details are empty
    const hasEmptyFields = passengerDetails.some((passenger) => 
      !passenger.firstName || 
      !passenger.lastName || 
      !passenger.age || 
      !passenger.passportNumber
    );
  
    // If there are empty fields or validation errors, show an alert
    if (hasEmptyFields || hasPassengerErrors) {
      Swal.fire({
        text: 'Please fill all the required fields and correct any errors.',
        icon: 'error',
        background: '#05043d',
      });
      return;
    }
  
    // If no errors, save the passenger details and proceed to payment
    dispatch(setPassengerDetails({ ...commonDetails, passengers: passengerDetails }));
    if (isChecked) await savePassengerInfo();
    router.push('/user/payment/payNow');
  };
  

  useEffect(() => {
    if (!token) router.push('/');
    else fetchPassengerInfo();

    if (selectedSeat.length > 0 && passengerDetails.length === 0) {
      setPassengerDetailsState(selectedSeat.map(() => ({
        firstName: '', middleName: '', lastName: '', age: '', passportNumber: '', disability: ''
      })));
    }
  }, [selectedSeat, token]);

  useEffect(() => {
    if (returnFlight) {
      Swal.fire({
        title: 'Do you want to Continue With Return Flights?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Save',
        denyButtonText: 'Don\'t save'
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          Swal.fire('Continue With Return Flights!', '', 'success');

        } else if (result.isDenied) {
          dispatch(clearSelectedReturnFlight());

          Swal.fire('Return Flights are Removed', '', 'info');
        }
      });

    }
  }, [returnFlight, dispatch]);

  useEffect(()=>{
    console.log(userId)
    if(!userId){
      router.push('/')
    }
    },[userId])
  return (
    <div className="bg-gray-700/50 text-white min-h-screen">
      <div className="relative h-64">
        <Image
          src="/ai-generated.jpg"
          alt="Header Image"
          layout="fill"
          objectFit="cover"
          className="rounded-b-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-3xl font-bold">Add Passenger Details</h1>
        </div>
      </div>

      <div className="container shadow-inner border border-white/20 mx-auto p-6 mt-6 bg-black/45 rounded-lg">
        {selectedFlight ? (
          <>
            <div className="flex justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{selectedFlight.departureAirport} → {selectedFlight.arrivalAirport}</h2>
                <p>{selectedFlight.departureTime} - {selectedFlight.arrivalTime}</p>
                <p>{selectedFlight.duration}</p>
              </div>
              <div className="flex-1 text-right">
                <p>Fare Type: Regular</p>
                <p>Total Passengers: {selectedSeat.length}</p>
                <p>Total Fare: ₹{selectedFlight.price * selectedSeat.length}</p>
              </div>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-lg font-semibold">Additional Fares</h1>
              {selectedSeat.map((seat, index) => (
                <p key={index}>
                  {seat.price === 499 && 'Economy'}
                  {seat.price === 899 && 'First Class'}
                  {seat.price === 1099 && 'Business Class'} : ₹{seat.price}
                </p>
              ))}
              <button className='bg-blue-700/35 rounded-sm font-extrabold p-1'>Add Additional</button>
              <FoodMenuModal />
            </div>
          </>
        ) : (
          <p>No flight selected</p>
        )}
      </div>

      <div className="container mx-auto p-6 mt-6 border border-white/20 bg-[#07152C] rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Contact Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
    type="text"
    value={commonDetails.email}
    onChange={(e) => handleCommonInputChange('email', e.target.value)}
    className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone Number</label>
              <input
    type="text"
    value={commonDetails.phoneNumber}
    onChange={(e) => handleCommonInputChange('phoneNumber', e.target.value)}
    className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4 mt-8">Passenger Details</h2>
          {selectedSeat.map((_, index) => (
  <div key={index} className="border p-4 mb-4 rounded-md shadow-sm">
    <h3 className="text-lg font-semibold mb-2">Passenger {index + 1}</h3>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium">First Name</label>
        <input
          type="text"
          value={passengerDetails[index]?.firstName || ''}
          onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
          className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors[index]?.firstName && <p className="text-red-500 text-sm mt-1">First Name is required</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Middle Name</label>
        <input
          type="text"
          value={passengerDetails[index]?.middleName || ''}
          onChange={(e) => handleInputChange(index, 'middleName', e.target.value)}
          className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Last Name</label>
        <input
          type="text"
          value={passengerDetails[index]?.lastName || ''}
          onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
          className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors[index]?.lastName && <p className="text-red-500 text-sm mt-1">Last Name is required</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Age</label>
        <input
          type="text"
          value={passengerDetails[index]?.age || ''}
          onChange={(e) => handleInputChange(index, 'age', e.target.value)}
          className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors[index]?.age && <p className="text-red-500 text-sm mt-1">Age is required and must be a valid number</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Passport Number</label>
        <input
          type="text"
          value={passengerDetails[index]?.passportNumber || ''}
          onChange={(e) => handleInputChange(index, 'passportNumber', e.target.value)}
          className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors[index]?.passportNumber && <p className="text-red-500 text-sm mt-1">Passport number must be at least 6 characters</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Disability (if any)</label>
        <input
          type="text"
          value={passengerDetails[index]?.disability || ''}
          onChange={(e) => handleInputChange(index, 'disability', e.target.value)}
          className="mt-1 block w-full bg-gray-800 border rounded-md py-2 px-3 text-sm leading-5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>
))}
          <div className="flex items-center my-4">
            <input type="checkbox" checked={isChecked} onChange={handleCheckboxChange} className="mr-2" />
            <label>Save information for future bookings</label>
          </div>
          <button
            type="submit"
            className="bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Proceed to Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
