'use client';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';
import { usePDF } from 'react-to-pdf';
import { useMutation } from '@apollo/client';
import { DotLoader } from 'react-spinners';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import adminAxios from '../api/utils/adminAxiosInstance';
import { cargoData } from '@/interfaces/cargoData';
import { ADMIN_LOGIN_MUTATION } from '@/graphql/mutations/adminLoginMutation';

const ReceivedCargo: React.FC = () => {
   const { toPDF, targetRef } = usePDF({ filename: 'page.pdf' });
   const [authorized, setAuthorized] = useState(false);
   const [role, setRole] = useState('');
   const AdminNavbar = dynamic(() => import('../_components/AdminNavbar'), { ssr: false });
   const [bookings, setBookings] = useState<cargoData[]>([]);
   const [currentPage, setCurrentPage] = useState(1);
   const [searchQuery, setSearchQuery] = useState('');
   const [sortBy, setSortBy] = useState('');
   const usersPerPage = 2;
   const router = useRouter();
   const totalPages = Math.ceil(bookings.length / usersPerPage);
   const token = Cookies.get('adminaccessToken');
   const [adminLogin, { loading }] = useMutation(ADMIN_LOGIN_MUTATION);

   // Redirect if not authorized
   useEffect(() => {
      if (!token) {
         router.push('/admin/signin');
      }
   }, [token, router]);

   // Verify token and check role
   useEffect(() => {
      const verifyToken = async () => {
         try {
            const response = await adminAxios.post('/tokenVerify', { token }, {
               headers: {
                  'Content-Type': 'application/json',
               },
            });
   
            const data = response.data;
            setRole(data);
   
            if (data === 'flightoperator' || data === 'cargomanager') {
               setAuthorized(true);
            } else {
               router.push('/admin/signin');
            }
         } catch (error) {
            console.error('Error verifying token:', error);
            router.push('/admin/signin'); // Ensure redirection on failure
         }
      };
   
      if (token) {
         verifyToken();
      }
   }, [token, router]);
   

   // Fetch cargo requests
   useEffect(() => {
      const fetchData = async () => {
         try {
            const response = await adminAxios.get<cargoData[]>('/getCargoRequests');
            setBookings(response.data);
         } catch (error) {
            console.error('Error fetching cargo requests:', error);
         }
      };
      fetchData();
   }, []);

   const handlePageChange = (pageNumber: number) => {
      setCurrentPage(pageNumber);
   };

   const handleUpdation = async (trackingId: string) => {
      try {
         const response = await fetch('/api/toggleCargo', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ trackingId }),
         });

         if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
         }

         Swal.fire('Approved!');
         const updatedBooking = await response.json();
         setBookings((prevBookings) =>
            prevBookings.map((b) =>
               b.trackingId === trackingId ? { ...b, approved: true } : b
            )
         );
      } catch (error: unknown) {
         if (error instanceof Error) {
           console.error('Error updating cargo status:', error.message);
         } else {
           console.error('An unknown error occurred during the update.');
         }
       }
       
   };

   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
   };

   const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSortBy(e.target.value);
   };

   const filteredBookings = bookings
      .filter((booking) =>
         booking.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         booking.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         booking.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
         if (sortBy === 'name') {
            return a.packageName.localeCompare(b.packageName);
         } else if (sortBy === 'date') {
            return new Date(a.Date_Received).getTime() - new Date(b.Date_Received).getTime();
         } else if (sortBy === 'sender') {
            return a.senderName.localeCompare(b.senderName);
         }
         return 0;
      });

   const currentUsers = filteredBookings.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

   return (
      <div className="relative min-h-screen bg-gray text-white">
         {loading && <DotLoader color="#ffffff" size={60} />}
         <AdminNavbar />
         <div className="flex justify-center items-center h-[calc(100vh-60px)]">
            <div className="w-full max-w-4xl bg-blue-700/15 shadow-inner shadow-white/10 rounded-lg p-6">
               <div className="flex justify-between items-center mb-6">
                  <input
                     type="text"
                     placeholder="Search by name, receiver, or sender..."
                     className="border p-2  text-black  font-extrabold rounded w-1/2"
                     value={searchQuery}
                     onChange={handleSearch}
                  />
                  <select className="border p-2 rounded text-black" value={sortBy} onChange={handleSortChange}>
                     <option value="">Sort by</option>
                     <option value="name">Receiver Name</option>
                     <option value="date">Date Received</option>
                     <option value="sender">Sender Name</option>
                  </select>
               </div>

               {authorized &&
                  currentUsers.map((booking) => (
                     <div key={booking.trackingId} className="p-6 rounded-lg mb-4  bg-blue-950/20 shadow-white/15 shadow-inner">
                        <p className="font-bold">Name: {booking.packageName}</p>
                        <p>Receiver: {booking.receiverName}</p>
                        <p>Sender: {booking.senderName}</p>
                        <p>Date Received: {booking.Date_Received}</p>
                        <p>Status: {booking.approved ? 'Approved' : 'Pending'}</p>
                        <button
                           onClick={() => handleUpdation(booking.trackingId)}
                           disabled={booking.approved}
                           className={`mt-2 p-2 rounded ${
                              booking.approved ? 'bg-gray-400' : 'bg-green-500 text-white hover:bg-green-600'
                           }`}
                        >
                           {booking.approved ? 'Approved' : 'Approve'}
                        </button>
                     </div>
                  ))}

               {authorized && totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                     {Array.from({ length: totalPages }, (_, pageNumber) => (
                        <button
                           key={pageNumber}
                           className={`px-4 py-2 mx-1 rounded ${
                              currentPage === pageNumber + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                           }`}
                           onClick={() => handlePageChange(pageNumber + 1)}
                        >
                           {pageNumber + 1}
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default ReceivedCargo;
