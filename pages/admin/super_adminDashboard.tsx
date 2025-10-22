'use client';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import adminAxios from '../api/utils/adminAxiosInstance';
import { Users } from '@/interfaces/Users';

const Super_adminDashboard: React.FC = () => {
    const [users, setUsers] = useState<Users[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 6;
    const AdminNavbar = dynamic(() => import('../../Components/AdminNavbar'));

    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleBlockUser = async (userId: string, isBlocked: boolean) => {
        const confirmationResult = await Swal.fire({
            title: `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`,
            text: 'This action can be reverted later.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isBlocked ? '#28a745' : '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${isBlocked ? 'unblock' : 'block'}!`,
        });

        if (confirmationResult.isConfirmed) {
            try {
                const response = await adminAxios.post('/blockUser', {
                    blockUserId: userId,
                });

                const data = response.data;

                if (response.status === 200) {
                    // Update the specific user's isBlocked state directly
                    setUsers((prevUsers) =>
                        prevUsers.map((user) =>
                            user.id === userId ? { ...user, isBlocked: !isBlocked } : user
                        )
                    );
                    Swal.fire('Success!', data.message, 'success');
                } else {
                    Swal.fire('Error!', data.message, 'error');
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                  Swal.fire('Error!', error.message || 'Failed to process the request.', 'error');
                } else {
                  Swal.fire('Error!', 'An unknown error occurred. Please try again.', 'error');
                }
              }
              
        }
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const filteredUsers = users.filter(
        (user) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentUsers = filteredUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );

    useEffect(() => {
        (async () => {
            try {
                const response = await adminAxios.post('/getUsers');
                const data = response.data;
                if (response) {
                    setUsers(data);
                } else {
                    throw new Error('Failed to fetch users data');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        })();
    }, []);

    return (
        <div className="relative w-full h-full flex justify-center items-center text-white">
            <AdminNavbar />
            <div className="p-4 mt-[200px]">
                <div className="flex justify-between items-center mb-6">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="p-2 rounded-lg border border-gray-600 bg-transparent text-white placeholder-gray-400"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {currentUsers.map((user) => (
                        <div key={user.id} className="max-w-sm bg-transparent border border-gray-600 rounded-lg shadow-lg">
                            <div className="relative">
                                <img
                                    className="w-full h-48 rounded-t-lg object-cover"
                                    src="https://res.cloudinary.com/dbn1fdk8f/image/upload/v1723181608/airline/kch5xemyueavoffdg7r1.jpg"
                                    alt="Airplane in the sky"
                                />
                                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                                    <img
                                        className="w-24 h-24 rounded-full border-4 border-white"
                                        src="https://res.cloudinary.com/dbn1fdk8f/image/upload/v1723181608/airline/kch5xemyueavoffdg7r1.jpg"
                                        alt="Profile Picture"
                                    />
                                </div>
                            </div>
                            <div className="text-center mt-14 p-4">
                                <h5 className="mb-1 text-xl font-bold text-white">{user.username}</h5>
                                <p className="text-sm text-gray-400">{user.email}</p>
                                <button
                                    onClick={() => handleBlockUser(user.id, user.isBlocked)}
                                    className={`mt-4 px-4 py-2 rounded-md ${
                                        user.isBlocked ? 'bg-red-500' : 'bg-green-500'
                                    } text-white`}
                                >
                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredUsers.length > usersPerPage && (
                    <div className="flex justify-center mt-4">
                        {Array.from({ length: Math.ceil(filteredUsers.length / usersPerPage) }, (_, index) => (
                            <button
                                key={index}
                                className={`px-3 py-2 rounded-md ${
                                    currentPage === index + 1
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-500 hover:text-blue-500'
                                }`}
                                onClick={() => handlePageChange(index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Super_adminDashboard;
