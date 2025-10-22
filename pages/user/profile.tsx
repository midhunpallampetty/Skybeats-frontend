'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { Carousel } from 'flowbite-react';
import ShowBookings from '../_components/ShowBookings';
import { gql, useQuery } from '@apollo/client';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import axios from 'axios';
import WalletModal from '../_components/Wallet';
import { useRouter } from 'next/router';
import { Edit, Mail, Phone, MapPin, Cake, User, Briefcase, Calendar, Key } from 'lucide-react';
import { contextType } from 'react-modal';
import axiosInstance from '../api/utils/axiosInstance';
const GET_USER_BY_ID = gql`
        query GetUserById($userId: String!) {
          getUserById(userId: $userId) {
            email
          
            username
          }
        }
      `;
const ITEMS_PER_PAGE = 5;
export default function ProfileComponent() {
  const Navbar = dynamic(() => import('../_components/Navbar'), { ssr: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const userId = Cookies.get('userId');
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [walletBalance, setWalletBalance] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const sortedBookings = bookings.sort((a, b) => {
    const dateA = new Date(a.DateofJourney);
    const dateB = new Date(b.DateofJourney);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Pagination logic: slice the bookings array based on the current page
  const indexOfLastBooking = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstBooking = indexOfLastBooking - ITEMS_PER_PAGE;
  const currentBookings = sortedBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const [user, setUser] = useState({
    firstName: 'Jane',
    lastName: 'Doe',
    gender: 'Female',
    contactNo: '+11 998001001',
    currentAddress: 'Beech Creek, PA, Pennsylvania',
    permanentAddress: 'Arlington Heights, IL, Illinois',
    email: 'jane@example.com',
    birthday: 'Feb 06, 1998',
    profileImage: '/placeholder.svg?height=200&width=200',
    coverImage: '/placeholder.svg?height=400&width=1200',
    occupation: 'Software Engineer',
    company: 'Tech Innovations Inc.',
  });
  const [birthday, setBirthDay] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [contactNo, setContactNo] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [email, setEmail] = useState('');
  const [dateSortDirection, setDateSortDirection] = useState('asc'); // State to track sorting order (asc/desc)
  const [errors, setErrors] = useState<any>({});
  const [skelton, setSkelton] = useState(true);
  const [showCanceled, setShowCanceled] = useState(false);
  const [gender, setGender] = useState('');
  const [permananentAddress, setPermananentAddress] = useState('');
  const [userData, setuserData] = useState<any[]>([]);
  const [profile, setProfile] = useState({
    email: '',
    contactNo: '',
    gender: '',
    birthday: '',
    currentAddress: '',
    permananentAddress: ''
  });
  console.log(profile,'profile')
  const toggleShowCanceled = () => {
    setShowCanceled((prev) => !prev);
  };
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  useEffect(() => {
    const userId = Cookies.get('userId');

    const fetchData = async () => {
      try {
        const response = await axiosInstance.post('/getBookingById', {
          userId: userId,
        });

        await setBookings(response?.data);
        console.log(bookings, 'congratulations.........');
      } catch (error) {
        console.log('An error occurred', error);
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    // Simulate a data fetch delay
    setTimeout(() => {
      setSkelton(false);
    }, 2000); // Adjust delay as needed or load when data is ready
}, []);
useEffect(()=>{
  if(!userId){
    router.push('/')
  }
  },[])
  const toggleModal = () => {
    setIsWalletModalOpen(prev => !prev);
  };
  async function handleSubmit() {
    if (!validateForm()) {
      console.log('Form validation failed');
      return; // Stop submission if form is invalid 
    }

    Swal.fire('Updated Profile');
    setEditMode(false);
    console.log({
      gender: profile.gender,
      contactNo: profile.contactNo,
      currentAddress: profile.currentAddress,
      permananentAddress: profile.permananentAddress,
      email: profile.email,
      birthday: profile.birthday
    }); // Log variable values

    try {
      const response = await axiosInstance.post('/addorUpdateProfile', {
        userId: userId,
        gender: profile.gender,
        contactNo: profile.contactNo,
        currentAddress: profile.currentAddress,
        permananentAddress: profile.permananentAddress,
        email: profile.email,
        birthday: profile.birthday
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response:', response.data);
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
    }
  }





  const validateForm = () => {
    const newErrors: any = {};

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email || !emailRegex.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate contact number (simple check for numeric value and length)
    const contactNoRegex = /^[0-9]{10,15}$/;
    if (!profile.contactNo || !contactNoRegex.test(profile.contactNo)) {
      newErrors.contactNo = 'Please enter a valid contact number';
    }

    // Validate gender
    if (!profile.gender) {
      newErrors.gender = 'Please enter your gender';
  } else if (profile.gender !== 'Male' && profile.gender !== 'Female') {
      newErrors.gender = 'Gender must be either Male or Female';
  }
  

    // Validate birthday (ensure it's a valid date and in the past)
    if (!profile.birthday || new Date(profile.birthday) >= new Date()) {
      newErrors.birthday = 'Please enter a valid birthday in the past';
    }

    // Validate addresses
    if (!profile.currentAddress) {
      newErrors.currentAddress = 'Current address cannot be empty';
    }
    if (!profile.permananentAddress) {
      newErrors.permanentAddress = 'Permanent address cannot be empty';
    }

    setErrors(newErrors);

    // If no errors, form is valid
    return Object.keys(newErrors).length === 0;
  };



  useEffect(() => {
    const fetchProfileDetails = async () => {
      try {
        // Send POST request to your Next.js API
        const response: any = await axiosInstance.post(
          '/getProfile', // API route
          {
            userId: userId // Pass the userId in the request body
          },
          {
            headers: {
              'Content-Type': 'application/json', // Correct the Content-Type header
            },
          }
        );

        // Log the API response before setting state

        // Set the profile data in state
        setProfile(response.data.getProfileDetails);
        console.log(response.data.getProfileDetails, 'This is the API response data');

      } catch (error) {
        console.error('Error fetching profile details:', error);
      }
    };

    fetchProfileDetails(); // Call the function to fetch data
  }, [userId]); // Add userId as a dependency to refetch if it changes

  // To check if the state is being updated, add a useEffect to monitor userData
  useEffect(() => {
    console.log(profile, 'Updated userData state');
  }, [profile]); // This will log whenever userData is updated
  // Empty dependency array to run this once when the component mounts

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Handle page changes
  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };


  const handleEditClick = () => {
    setEditMode(!editMode);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };
  function handleMore() {
    router.push('/user/flight/bookingHistory');
  }
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'profileImage' | 'coverImage') => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setUser({ ...user, [imageType]: fileReader.result as string });
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };


  async function changePassword() {
    if (newPassword !== confirmNewPassword) {
      Swal.fire("New Password and Confirm New Password must match!");
      return;
    }
    try {
      // Logging the input data for debugging
      console.log("User ID:", userId, "Old Password:", oldPassword, "New Password:", newPassword);
  
      // Sending the request to the server
      const response = await axiosInstance.post(
        "/changePassword",
        {
          id: userId,
          oldpassword: oldPassword,
          newpassword: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      // Checking the response status
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Password Changed",
          text: "Your password has been changed successfully.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Password Change Failed",
          text: response.data.message || "An error occurred while changing the password.",
        });
      }
    } catch (error: any) {
      // Handling specific server errors
      if (error.response) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response.data.message || "An error occurred while changing the password.",
        });
        console.error("Server Error:", error.response.data);
      } else {
        // Handling unexpected errors
        Swal.fire({
          icon: "error",
          title: "Something Went Wrong",
          text: "An unexpected error occurred. Please try again later.",
        });
        console.error("Unexpected Error:", error);
      }
    }
  }
  

const togglePasswordVisibility = (setter) => {
    setter((prev) => !prev);
  };




  const { loading, error, data } = useQuery(GET_USER_BY_ID, {
    variables: { userId },
  });

 

  const queriedUser = data?.getUserById;

  return (
    <>
     {skelton ? (
      <div className="relative w-full h-16 bg-gray-300 rounded-lg animate-pulse">
      <div className="absolute bottom-4 left-4 bg-gray-400 px-4 py-2 rounded-full text-gray-300 w-24 h-6 animate-pulse"></div>
  </div>
) : (
      <Navbar />
    )}
      <div className="w-full p-6 flex flex-col items-center overflow-y-scroll m-16">
            <section className="mb-8 w-4/5">
                {skelton ? (
                    // Skeleton for banner
                    <div className="relative w-full h-44 bg-gray-300 rounded-lg animate-pulse">
                        <div className="absolute bottom-4 left-4 bg-gray-400 px-4 py-2 rounded-full text-gray-300 w-24 h-6 animate-pulse"></div>
                    </div>
                ) : (
                    // Actual banner content when loaded
                    <div className="relative w-full h-44 bg-blue-800 rounded-lg overflow-hidden">
                        <img
                            src="https://images3.alphacoders.com/135/1350069.jpeg"
                            alt="Event Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-purple-600 px-4 py-2 rounded-full text-white">
                            My Profile
                        </div>
                    </div>
                )}
            </section>
            
            {skelton ? (
                // Skeleton for modals
                <div className="w-4/5  bg-gray-300 rounded-lg animate-pulse"></div>
            ) : (
                <>
                    <ShowBookings isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} booking={selectedBooking} />
                    <WalletModal isOpen={isWalletModalOpen} onClose={toggleModal} />
                </>
            )}
        </div>
       
      <div className="min-h-screen  mt-2 ">
      {skelton ? (
                // Skeleton for modals
<div className="flex  justify-center h-screen">
    <div className="w-[800px] h-64 bg-blue-800/45 rounded-lg animate-pulse transition-all duration-700 ease-in-out"></div>
</div>
            ) : (
        <div className="container mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">


            <div className="relative px-4 md:px-6 pb-6 -mt-16">
              <div className="flex flex-col md:flex-row items-center">

                {editMode && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'profileImage')}
                    className="mt-2 md:mt-0 md:ml-4 w-full md:w-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}

                <button
                  onClick={handleEditClick}
                  className={`mt-4 md:mt-0 md:ml-auto px-4 py-2 rounded-md flex items-center ${editMode
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  {editMode ? 'Save' : 'Edit'}
                  <Edit className="w-4 h-4 ml-2" />
                </button>
              </div>

              <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {['profile', 'bookings', 'password'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>
              {activeTab === 'profile' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email Input */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!editMode}
                        className={`mt-1 block w-full text-black font-bold rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                    {/* Contact Number Input */}
                    <div>
                      <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700">Contact Number</label>
                      <input
                        type="tel"
                        id="contactNo"
                        name="contactNo"
                        value={profile.contactNo}
                        onChange={(e) => setProfile({ ...profile, contactNo: e.target.value })}
                        disabled={!editMode}
                        className={`mt-1 block w-full rounded-md text-black font-bold border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.contactNo ? 'border-red-500' : ''}`}
                      />
                      {errors.contactNo && <p className="text-red-500 text-sm">{errors.contactNo}</p>}
                    </div>
                    {/* Gender Input */}
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                      <input
                        type="text"
                        id="gender"
                        name="gender"
                        value={profile.gender}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            gender: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1),
                          })
                        }
                        list="genderOptions"  // Add this to link the datalist
                        disabled={!editMode}
                        className={`mt-1 block w-full text-black font-bold rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.gender ? 'border-red-500' : ''}`}
                      />

                      <datalist id="genderOptions">
                        <option value="Male" />
                        <option value="Female" />
                      </datalist>

                      {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
                    </div>
                    {/* Birthday Input */}
                    <div>
                      <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">Birthday</label>
                      <input
                        type="date"
                        id="birthday"
                        name="birthday"
                        value={profile.birthday}
                        onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                        disabled={!editMode}
                        className={`mt-1 block w-full text-black font-bold rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.birthday ? 'border-red-500' : ''}`}
                      />
                      {errors.birthday && <p className="text-red-500 text-sm">{errors.birthday}</p>}
                    </div>
                    {/* Current Address Input */}
                    <div className="col-span-2">
                      <label htmlFor="currentAddress"  className="block text-sm font-medium text-gray-700">Current Address</label>
                      <textarea
                        id="currentAddress"
                        name="currentAddress"
                        value={profile.currentAddress}
                        onChange={(e) => setProfile({ ...profile, currentAddress: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1), })}
                        disabled={!editMode}
                        rows={3}
                        className={`mt-1 block w-full rounded-md text-black font-bold border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.currentAddress ? 'border-red-500' : ''}`}
                      ></textarea>
                      {errors.currentAddress && <p className="text-red-500 text-sm">{errors.currentAddress}</p>}
                    </div>
                    {/* Permanent Address Input */}
                    <div className="col-span-2">
                      <label htmlFor="permanentAddress" className="block text-sm font-medium text-gray-700">Permanent Address</label>
                      <textarea
                        id="permanentAddress"
                        name="permanentAddress"
                        value={profile.permananentAddress}
                        onChange={(e) => setProfile({ ...profile, permananentAddress: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1), })}
                        disabled={!editMode}
                        rows={3}
                        className={`mt-1 block w-full rounded-md text-black font-bold border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.permanentAddress ? 'border-red-500' : ''}`}
                      ></textarea>
                      {errors.permanentAddress && <p className="text-red-500 text-sm">{errors.permanentAddress}</p>}
                    </div>

                  </div>
                  <div className="mt-6 flex justify-end">
                    {editMode ? (
                      <>
                        <button onClick={handleSubmit}
                          type="button"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mr-2"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleEditClick}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Edit
                      </button>

                    )}
                  </div>
                  <button
                    type="button" onClick={toggleModal}

                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Wallet
                  </button>
                </div>
              )}



              {activeTab === 'bookings' && (
                <div className="mt-6 text-black">
                  <h3 className="text-lg text-black font-semibold mb-4">Booking History</h3>

                  {/* Toggle Button for Show/Hide Canceled Orders */}
                  <button
                    onClick={toggleShowCanceled}
                    className="bg-blue-600 text-white p-2 rounded-lg mb-4"
                  >
                    {showCanceled ? 'Hide Canceled Orders' : 'Show Canceled Orders'}
                  </button>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Passenger Names
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={handleSortToggle}
                          >
                            Date of Journey {dateSortDirection === 'asc' ? '▲' : '▼'}
                          </th>
                          <th className="px-6 py-3"></th> {/* Empty cell for "More Details" */}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentBookings
                          .filter((booking) => showCanceled || !booking.cancelled) // Filter based on showCanceled
                          .sort((a, b) => {
                            const dateA = new Date(a.DateofJourney);
                            const dateB = new Date(b.DateofJourney);
                            return dateSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                          })
                          .map((booking) => (
                            <tr
                              key={booking.id}
                              className={booking.cancelled ? 'bg-red-100' : ''} // Red background for canceled bookings
                            >
                              {/* Displaying passenger names */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {booking.passengerName.map((passenger, index) => (
                                  <div key={index}>
                                    {passenger.firstName} {passenger.middleName} {passenger.lastName}
                                  </div>
                                ))}
                              </td>

                              {/* Displaying Date of Journey */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {booking.DateofJourney}
                              </td>

                              {/* More details button */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setSelectedBooking(booking); // Set the specific booking
                                    setIsModalOpen(true); // Open the modal
                                  }}
                                  className="bg-green-600 text-white p-2 rounded-lg font-extrabold"
                                >
                                  More Details
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {/* Pagination controls */}
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 ${currentPage === 1 ? 'text-gray-400' : 'text-blue-500'}`}
                      >
                        Previous
                      </button>

                      <p className="text-gray-500">Page {currentPage} of {totalPages}</p>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 ${currentPage === totalPages ? 'text-gray-400' : 'text-blue-500'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}




{activeTab === "password" && (
        <div className="mt-6 text-black">
          <h3 className="text-lg font-semibold mb-4 text-black">Forget Password</h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="old-password"
                className="block text-sm font-medium text-gray-700"
              >
                Old Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  id="old-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(setShowOldPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                >
                  {showOldPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(setShowNewPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                >
                  {showNewPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-new-password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    togglePasswordVisibility(setShowConfirmPassword)
                  }
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                >
                  {showConfirmPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div>
              <button
                onClick={changePassword}
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

            </div>

          </div>
        </div>
)}
      </div>
      <footer
        className="bg-blue-800/20 text-center mt-20 rounded-md text-white/10 shadow-white/15 shadow-inner ">
        <div className="container p-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="mb-6 lg:mb-0">
              <img
                src="https://img.freepik.com/free-photo/logistics-transportation-container-cargo-ship-cargo-plane-with-working-crane-bridge-shipyard-sunrise-logistic-import-export-transport-industry-background-ai-generative_123827-24177.jpg?w=1380&t=st=1726561962~exp=1726562562~hmac=4f9324056b37759c8605a8232a03522b85c0f6897e9d95b198c5420f7ee21ab2"
                className="w-full rounded-md shadow-lg" />
            </div>
            <div className="mb-6 lg:mb-0">
              <img
                src="https://img.freepik.com/free-photo/top-view-plane-boxes_23-2149853127.jpg?t=st=1726562011~exp=1726565611~hmac=a569284458a99cdb3aa222d3ac69611901ce23ff6683ea28acc7a4f70e6edd1b&w=1480"
                className="w-full rounded-md shadow-lg" />
            </div>
            <div className="mb-6 lg:mb-0">
              <img
                src="https://img.freepik.com/free-photo/logistics-means-transport-together-with-technological-futuristic-holograms_23-2151662980.jpg?t=st=1726562042~exp=1726565642~hmac=010c2b0240f5d8b1ec9ea7f9d0b07fdff1376886cc1fddfc242752aacb6e153d&w=1380"
                className="w-full rounded-md shadow-lg" />
            </div>
            <div className="mb-6 lg:mb-0">
              <img
                src="https://img.freepik.com/free-photo/green-plane-ecofriendly-environment_23-2151582434.jpg?t=st=1726562078~exp=1726565678~hmac=62eea8807a3fc6a0f501a10a9dfa1819dd6f796b81385e3c079527f4b2d89a3d&w=1480"
                className="w-full rounded-md shadow-lg" />
            </div>
            <div className="mb-6 lg:mb-0">
              <img
                src="https://img.freepik.com/free-photo/airplane-sunset_1150-8368.jpg?t=st=1726562105~exp=1726565705~hmac=fbcd17be8fbc2c36498465085b83d955ee64636b59ea873e49ebc6c9728bb922&w=1380"
                className="w-full rounded-md shadow-lg" />
            </div>
            <div className="mb-6 lg:mb-0">
              <img
                src="https://img.freepik.com/free-photo/logistics-means-transport-together-with-technological-futuristic-holograms_23-2151662992.jpg?t=st=1726562148~exp=1726565748~hmac=9216655d617871585322a750005e26a46928b4b810d988a48cd647bb394f1c9e&w=1060"
                className="w-full rounded-md shadow-lg" />
            </div>

          </div>
        </div>

        {/* <!--Copyright section--> */}
        <div
          className="bg-white p-4 text-center text-black ">
          © 2023 Copyright:
          <a className="text-black" href="https://tw-elements.com/"
          >Skybeats</a>
        </div>
      </footer>
    </>
  );
}