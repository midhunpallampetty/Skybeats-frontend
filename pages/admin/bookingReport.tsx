'use client';
import React, { useEffect, useState } from 'react';
import { ADMIN_LOGIN_MUTATION } from '@/graphql/mutations/adminLoginMutation';
import { useMutation } from '@apollo/client';
import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { DotLoader } from 'react-spinners';
import adminAxios from '../api/utils/adminAxiosInstance';

import { Guests } from '@/interfaces/Guests';

const Super_adminDashboard: React.FC = () => {
   const AdminNavbar = dynamic(() => import('../../components/AdminNavbar'), { ssr: true });
   const [authorized, setAuthorized] = useState(false);
   const [email, setEmail] = useState('');
   const [role, setRole] = useState('');
   const [bookings, setBookings] = useState<Guests[]>([]);
   const [currentPage, setCurrentPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState('');
   const [filteredBookings, setFilteredBookings] = useState<Guests[]>([]);

   const usersPerPage = 5;
   const router = useRouter();

   const token = Cookies.get('adminaccessToken');

   const totalPages = Math.ceil(filteredBookings.length / usersPerPage);

   useEffect(() => {
      if (!token) {
         router.push('/admin/signin');
      }
   }, [token]);

   const handlePageChange = (pageNumber: number) => {
      setCurrentPage(pageNumber);
   };

   const currentUsers = filteredBookings.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

   useEffect(() => {
      if (role) {
         if (role !== 'hoteladmin') {
            router.push('/admin/dashboard');
         } else {
            setAuthorized(true);
         }
      }
   }, [role]);

   useEffect(() => {
      (async () => {
         try {
            const response = await adminAxios.get('/getAllHotels');
            setBookings(response.data); 
         } catch (error) {
            console.log('Error fetching hotels:', error);
         }
      })();
   }, []);

   

   useEffect(() => {
      (async () => {
         try {
            const response = await adminAxios.post('/tokenVerify', { token }, {
               headers: {
                  'Content-Type': 'application/json',
               },
            });
            setRole(response.data); // Axios automatically parses the response data
         } catch (error: unknown) {
            if (error instanceof Error) {
               if ((error as any).response?.data?.message) {
                  // Handle errors with a response
                  console.error('Error from API:', (error as any).response.data.message);
               } else {
                  // Generic error message
                  console.error('Unexpected error:', error.message);
               }
            } else {
               // Non-Error object thrown
               console.error('Unexpected non-error type:', error);
            }
         }
         
      })();
   }, [token]);
   

   useEffect(() => {
      if (role === 'hoteladmin') {
         setAuthorized(true);
      }
   }, [role]);

   useEffect(() => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = bookings.filter(
         (booking) =>
            booking.guestName.toLowerCase().includes(lowerCaseSearch) ||
            booking.email.toLowerCase().includes(lowerCaseSearch) ||
            booking.phoneNumber.includes(lowerCaseSearch)
      );
      setFilteredBookings(filtered);
   }, [searchTerm, bookings]);

   useEffect(() => {
      setCurrentPage(1); // Reset to first page after filtering
   }, [filteredBookings]);

   const handleSignin = async (event: React.MouseEvent<HTMLButtonElement>) => {
      try {
         const { data } = await adminLogin({
            variables: {
               email,
               password,
               adminType,
            },
         });
         if (data && data.adminLogin) {
            console.log('login success', data.adminLogin);
         } else {
            throw new Error('Invalid credentials');
         }
      } catch (error) {
         console.log('Admin login failed');
      }
   };

   const [password, setPassword] = useState('');
   const [adminType, setadminType] = useState('');
   const [adminLogin, { loading, error, data }] = useMutation(ADMIN_LOGIN_MUTATION);

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
      pointerEvents: 'none',
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
            <div className="ml-52 mb-32"></div>

            <section className="xl:ml-[250px] xl:w-[1200px] md:w-[800px] sm:w-full bg-transparent" style={{ position: 'relative', zIndex: 10 }}>
              

               <div className="p-6 mt-[200px]">
               <div className="flex justify-center gap-6 my-2">
                  <input
                     type="text"
                     placeholder="Search by name, email, or phone"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="px-4 py-2 text-black font-extrabold border rounded-lg w-80"
                  />
               </div>
                  <div className="grid grid-cols-12 md:grid-cols-3 gap-6">
                     {authorized ? (
                        currentUsers.length > 0 ? (
                           currentUsers.map((booking, index) => (
                              <div key={index} className="w-full mb-6">
                                 <div className="w-full bg-transparent border border-gray-600 rounded-lg shadow-lg">
                                    <div className="relative">
                                       <img
                                          className="w-full h-48 rounded-t-lg object-cover"
                                          src="https://res.cloudinary.com/dbn1fdk8f/image/upload/v1723181608/airline/kch5xemyueavoffdg7r1.jpg"
                                          alt="Airplane in the sky"
                                       />
                                       <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full">
                                          International
                                       </div>
                                    </div>
                                    <div className="p-6 flex flex-col md:flex-row justify-between items-center">
                                       <div className="text-white space-y-1">
                                          <p className="text-xl font-semibold">Name: {booking.guestName}</p>
                                          <p>Email: {booking.email}</p>
                                          <p>Phone: {booking.phoneNumber}</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="text-white text-center w-full">No results found</div>
                        )
                     ) : (
                        <div className="flex items-center justify-center min-h-screen">
                           {/* Not authorized message */}
                        </div>
                     )}
                  </div>
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
               </div>
            </section>
         </div>
      </div>
   );
};

export default Super_adminDashboard;
