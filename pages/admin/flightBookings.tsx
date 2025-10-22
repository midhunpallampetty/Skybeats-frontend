'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import { usePDF } from 'react-to-pdf';
import { ADMIN_LOGIN_MUTATION } from '@/graphql/mutations/adminLoginMutation';
import { useMutation } from '@apollo/client';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { DotLoader } from 'react-spinners';
import { bookData } from '@/interfaces/bookData';
import adminAxios from '../api/utils/adminAxiosInstance';
interface ApiError extends Error {
   response?: {
     data: {
       message: string;
     };
   };
 }
 interface Booking {
   id: string;
   customerName: string;
   flightNumber: string;
   date: string;
   seatNumber: string[];
   FarePaid:number;
   createdAt:string;
   arrivalAirport:string;
   phoneNumber:string;
   departureAirport:string;
   // Add other fields as per your data
 }
 
 interface BookingsResponse {
   data: Booking[];
 }
const FlightBookings: React.FC = () => {
   const { toPDF, targetRef } = usePDF({ filename: 'page.pdf' });
   const [authorized, setAuthorized] = useState(false);
   const [email, setEmail] = useState('');
   const [role, setRole] = useState('');
   const AdminNavbar  = dynamic(() => import('../_components/AdminNavbar'), { ssr: false });

   const [bookings, setBookings] = useState<Booking[]>([]);
   const [currentPage, setCurrentPage] = useState(1);
   const usersPerPage = 2;
   const router = useRouter();

   const totalPages = Math.ceil(bookings.length / usersPerPage);
   const token = Cookies.get('adminaccessToken');
                                    
   useEffect(() => {
      if (!token) {
         router.push('/admin/signin');
      }
   }, [token]);
   const handlePageChange = (pageNumber: number) => {
      setCurrentPage(pageNumber);
   };
   useEffect(() => {
      if (role) {
         console.log(role, 'role...................................');
         if (role !== 'flightoperator') {
            router.push('/admin/dashboard');
         } else {
            console.log('Authorized as flight operator');
            setAuthorized(true);
         }
      }
   }, [role]);
   





   useEffect(() => {
      const verifyToken = async () => {
         try {
            console.log('Sending token to API:', token);
            const response = await adminAxios.post('/tokenVerify', { token });
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
   
            const data = response.data;
            console.log('Received data:', data);
   
            setRole(data);
   
            if (response.status !== 200) {
               console.error('Error from API:', response.statusText);
            }
         }catch (error: unknown) {
            if (error instanceof Error) {
              const apiError = error as ApiError; // Type assertion to ApiError
              console.error(
                'External API error:',
                apiError.response?.data?.message || error.message
              );
            } else {
              console.error('External API error: An unknown error occurred');
            }
          }

      };
   
      verifyToken();
   }, [token]);
   useEffect(() => {
      if (role !== null) {
         console.log('Role has been updated:', role);
         if (role === 'flightoperator') {
            console.log('Setting authorised to true');
            setAuthorized(true);
            console.log('role is fine', role);
         }
         console.log('test', authorized);

      }
   }, [role]);
   useEffect(() => {
      console.log('Authorised state updated:', authorized);
   }, [authorized]);

   console.log(bookings, 'user');
   const [password, setPassword] = useState('');
   const [adminType, setadminType] = useState('');
   const [adminLogin, { loading, error, data }] = useMutation(ADMIN_LOGIN_MUTATION);
   // const handleDropdown = (e: any) => {
   //    setadminType(e.target.value);
   // };
   useEffect(() => {
      const fetchData = async () => {
         try {
            const response: BookingsResponse = await adminAxios.get('/getBookings');
            console.log(response.data, 'congratulations.........');
            setBookings(response?.data);
         } catch (error) {
            console.log('An error occurred', error);
         }
      };
      fetchData();
   }, []);
   const currentUsers = bookings.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

   const handleSignin = async (event: React.MouseEvent<HTMLButtonElement>) => {
      try {
         const { data } = await adminLogin({
            variables: {
               email,
               password,
               adminType
            }
         });
         if (data && data.adminLogin) {
            console.log('login success', data.adminLogin);
         } else {
            throw new Error('Inavlid credentials');
            console.log('login failed invalid credentials');
         }
      } catch (error) {

         console.log('Operation of admin login not successful');
         throw new Error('can\'t perform admin login operation');
      }
   };
   const containerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
   };

   const contentStyle: React.CSSProperties = {
      position: 'relative',
      zIndex: 1,
   };

   const backgroundStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      opacity: 0.08,
      pointerEvents: 'none' as 'none',
      backgroundImage: 'url(/admin_bg.png)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
   };

   return (

      <div style={containerStyle}>
         {loading && <DotLoader color="#ffffff" size={60} />}
         <AdminNavbar />

         <div style={backgroundStyle} />
         <div style={contentStyle}>
            <div className='ml-52 mb-32'>

            </div>

            <section className="xl:ml-[250px] xl:w-[1200px] md:w-[800px] sm:w-full bg-transparent" style={{ position: 'relative', zIndex: 10 }}>
               <button
                  data-drawer-target="logo-sidebar"
                  data-drawer-toggle="logo-sidebar"
                  aria-controls="logo-sidebar"
                  type="button"
                  className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
               >
                  <span className="sr-only">Open sidebar</span>
                  <svg
                     className="w-6 h-6"
                     aria-hidden="true"
                     fill="currentColor"
                     viewBox="0 0 20 20"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                     <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                     />
                  </svg>
               </button>


               {authorized ? (
                  currentUsers.map((bookings, index) => (


                     <div key={index} className="bg-blue-900/50 p-6 rounded-lg shadow-lg w-full mb-10  mx-auto">
                        <div className="relative rounded-t-lg overflow-hidden">
                           <span className="absolute top-2 left-2 bg-green-400 text-black text-xs px-3 py-1 rounded-full">
                              International
                           </span>
                        </div>

                        <div className="flex items-center mt-4" >
                           <img src="https://www.rosenaviation.com/wp-content/uploads/2024/02/Longest-commercial-flights-Rosen-Aviation-scaled.jpeg" alt="Profile" className="w-20 h-20 rounded-full border-4 border-blue-900" />
                           <div className="ml-4 text-white flex-1">
                              <div className="flex justify-between items-center">
                                 <div ref={targetRef}>
                                 <p className="text-lg font-semibold">
                              Name: {bookings.passengerName[0]?.firstName}{' '}
                              {bookings.passengerName[0]?.lastName}
                           </p>
                                    <p className="text-sm">Paid: {bookings.FarePaid}</p>
                                    <p className="text-sm">Duration: {bookings.flightDuration}</p>
                                    <p className="text-sm">Stop: {bookings.stop}</p>

                                 </div>
                                 <div>
                                    <p className="text-sm">Arrival Airport: {bookings?.arrivalAirport}</p>
                                    <p className="text-sm">Arrival Time: {bookings.arrivalTime}</p>
                                    <p className="text-sm">Phone Number: {bookings.phoneNumber}</p>
                                    <p className="text-sm">Stop: {bookings.email}</p>

                                 </div>
                                 <p className="text-sm">Flight Number: <span className="text-white">{bookings.flightNumber}</span></p>
                              </div>
                              <div className="flex mt-4 space-x-4">
                              
                                 

                                 
                              </div>
                           </div>
                        </div>
                       
                     </div>



                  ))
               ) : (
                  <div className="flex items-center justify-center min-h-screen">
                     <div className="text-center text-white/5">
                       
                     </div>
                  </div>


               )}

               {authorized && totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                     {Array.from({ length: totalPages }, (_, pageNumber) => (
                        <button
                           key={pageNumber}
                           className={`px-3 py-2 rounded-md ${currentPage === pageNumber + 1 ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
                           onClick={() => handlePageChange(pageNumber + 1)}
                        >
                           {pageNumber + 1}
                        </button>
                     ))}
                  </div>
               )}


            </section>

         </div>
      </div>
   );
};

export default FlightBookings;