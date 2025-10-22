'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import withAuthorization from '../hoc/withAuthorization';
import adminAxios from '../api/utils/adminAxiosInstance';

const AdminNavbar = dynamic(() => import('../../Components/AdminNavbar'), {
  loading: () => (
    <div className="h-16 bg-gray-800/50 animate-pulse rounded-lg"></div>
  ),
});

const SuperAdminDashboard: React.FC = () => {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 12;
  const router = useRouter();
  const token = Cookies.get('adminaccessToken');

  const cardsData = [
    {
      id: 1,
      name: 'Cargo Management',
      description: 'Manage cargo operations and tracking',
      imageUrl: 'https://projectcargo.com.tr/images/bg-img/col-bgimage-1.jpg',
      Redirect: '/admin/receivedCargo',
      icon: '📦'
    },
    {
      id: 2,
      name: 'Flight Management',
      description: 'Control flight schedules and operations',
      imageUrl: 'https://blog.adobe.com/en/publish/2022/06/14/media_101523c4fd5175e08bd6ffbe8c509525cccba34cb.jpeg?width=1200&format=pjpg&optimize=medium',
      Redirect: '/admin/flightBookings',
      icon: '✈️'
    },
    {
      id: 3,
      name: 'Hotel Management',
      description: 'Oversee hotel bookings and services',
      imageUrl: 'https://www.hotelierindia.com/public/styles/full_img_sml/public/images/2020/02/14/shutterstock_1560097280.jpg?XO8Z_aDT',
      Redirect: '/admin/bookingReport',
      icon: '🏨'
    },
    {
      id: 4,
      name: 'Career Management',
      description: 'Handle job applications and recruitment',
      imageUrl: 'https://img.onmanorama.com/content/dam/mm/en/entertainment/interview/images/2016/Apr/7/jacobinte-swargarajyam.jpg.image.784.410.jpg',
      Redirect: '/admin/receivedApplications',
      icon: '💼'
    },
    {
      id: 5,
      name: 'Service',
      description: 'Manage customer service operations',
      imageUrl: 'https://blog.infraspeak.com/wp-content/uploads/2021/08/Maintenance-as-a-Service.jpeg',
      Redirect: '/admin/adminChat',
      icon: '🛎️'
    },
    {
      id: 6,
      name: 'Menu',
      description: 'Update and manage in-flight menu',
      imageUrl: 'https://img.freepik.com/premium-photo/flight-attendant-serving-foods-plane_946209-4125.jpg',
      Redirect: '/admin/menu',
      icon: '🍽️'
    },
    {
      id: 7,
      name: 'Booking Report',
      description: 'View booking analytics and reports',
      imageUrl: 'https://www.finereport.com/en/wp-content/uploads/2021/02/Investment-Dashboard-20210225160932-1024x576.png',
      Redirect: '/admin/bookingChart',
      icon: '📊'
    },
    {
      id: 8,
      name: 'Users',
      description: 'Manage user accounts and permissions',
      imageUrl: 'https://v2cloud.com/app/uploads/2024/11/Blog-Hero-Image-2024-11-05T103202.382.png',
      Redirect: '/admin/super_adminDashboard',
      icon: '👥'
    },
    {
      id: 9,
      name: 'Recent Bookings',
      description: 'View latest booking activities',
      imageUrl: 'https://storiesflistgv2.blob.core.windows.net/stories/2019/08/Travel.jpg',
      Redirect: '/admin/flightBookings',
      icon: '🕒'
    },
  ];

  useEffect(() => {
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    (async () => {
      try {
        const response = await adminAxios.post('/tokenVerify', { token }, {
          headers: { 'Content-Type': 'application/json' },
        });
        setRole(response.data);
        setAuthorized(true);
      } catch (error) {
        console.error('Error occurred while verifying token');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router]);

  const currentUsers = cardsData.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <>
         <AdminNavbar />

    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-8 "
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
        >
          Admin Dashboard
        </motion.h1>

        {authorized ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
            {currentUsers.map((card, index) => {
              const isDisabled = (
                (role !== 'hoteladmin' && card.name === 'Hotel Management') ||
                (role !== 'hradmin' && card.name === 'Career Management') ||
                (role !== 'flightoperator' && card.name === 'Flight Management') ||
                (role !== 'cargomanager' && card.name === 'Cargo Management') ||
                (role !== 'hoteladmin' && card.name === 'Menu') ||
                (role !== 'flightoperator' && card.name === 'Booking Report') ||
                (role !== 'flightoperator' && card.name === 'Recent Bookings')
              );

              return (
                <motion.div
                  key={card.id}
                  variants={cardVariants}
                  whileHover={!isDisabled ? "hover" : {}}
                  className={`relative overflow-hidden rounded-xl ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <motion.button
                    className="w-full h-full"
                    onClick={() => !isDisabled && router.push(card.Redirect)}
                    disabled={isDisabled}
                  >
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-75"></div>
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-6 transform transition-transform duration-300 group-hover:translate-y-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{card.icon}</span>
                          <h3 className="text-2xl font-bold">{card.name}</h3>
                        </div>
                        <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <div className="text-center bg-red-500/10 p-8 rounded-lg backdrop-blur-sm">
              <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
              <p className="text-lg text-gray-300">
                You do not have permission to access this page.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
    </>
  );
};

export default withAuthorization(SuperAdminDashboard, 'superadmin');