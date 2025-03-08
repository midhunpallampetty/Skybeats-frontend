'use client';

import React, { useEffect, useState } from 'react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import adminAxios from '../api/utils/adminAxiosInstance';
import { ArrowLeft, TrendingUp, Users, Plane, Building } from 'lucide-react';

interface PieInterface {
  name: string;
  value: number;
  fill: string;
}

interface Booking {
  id: string;
  customerName: string;
  flightNumber: string;
  date: string;
  seatNumber: string[];
  FarePaid: number;
  createdAt: string;
  arrivalAirport: string;
  phoneNumber: string;
  departureAirport: string;
}

const categoryData = [
  { category: "Alpha", value: 8 },
  { category: "Omega", value: 6 },
  { category: "Meta", value: 4 },
  { category: "Strategic", value: 7 },
  { category: "Growth", value: 5 },
  { category: "Tech", value: 8 },
  { category: "Series", value: 6 },
];

export default function BookingReport() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weeklyData, setWeeklyData] = useState([
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ]);
  const [role, setRole] = useState('');
  const [total, setTotal] = useState(0);
  const [pieData, setPieData] = useState<PieInterface[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(6);
  const [displayedBookings, setDisplayedBookings] = useState<Booking[]>([]);
  
  const router = useRouter();
  const token = Cookies.get('adminaccessToken');

  useEffect(() => {
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await adminAxios.post('/tokenVerify', { token });
        setRole(response.data);
        setAuthorized(response.data === 'flightoperator');
      } catch (error) {
        console.error('Error verifying token:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/getBookings');
        setBookings(response.data);
        
        // Calculate total revenue
        const totalRevenue = response.data.reduce((acc: number, booking: Booking) => 
          acc + booking.FarePaid, 0
        );
        setTotal(totalRevenue);
        
        // Set initial displayed bookings
        setDisplayedBookings(response.data.slice(0, 6));
        
        // Process weekly data
        processWeeklyData(response.data);
        
        // Process airport data for pie chart
        processAirportData(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchData();
  }, []);

  const processWeeklyData = (bookingData: Booking[]) => {
    const updatedWeeklyData = [...weeklyData];
    
    bookingData.forEach((booking) => {
      const date = new Date(parseInt(booking.createdAt));
      const day = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
      
      const dayIndex = updatedWeeklyData.findIndex((d) => d.day === day);
      if (dayIndex !== -1) {
        updatedWeeklyData[dayIndex].value += 1;
      }
    });

    setWeeklyData(updatedWeeklyData);
  };

  const processAirportData = (bookingData: Booking[]) => {
    const airportCounts: { [key: string]: number } = {};
    
    bookingData.forEach((booking) => {
      if (booking.arrivalAirport) {
        airportCounts[booking.arrivalAirport] = (airportCounts[booking.arrivalAirport] || 0) + 1;
      }
    });

    const topAirports = Object.entries(airportCounts)
      .map(([name, value]) => ({ 
        name, 
        value, 
        fill: `hsl(${Math.random() * 360}, 70%, 50%)` 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    setPieData(topAirports);
  };

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      const nextItems = bookings.slice(currentIndex, currentIndex + 6);
      setDisplayedBookings([...displayedBookings, ...nextItems]);
      setCurrentIndex(currentIndex + 6);
      setLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-[#050b2c]"
      >
        <div className="space-y-4 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </motion.div>
    );
  }

  if (!authorized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-screen items-center justify-center bg-[#050b2c] text-white"
      >
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-500">Access Restricted</h1>
          <p className="text-gray-400">You don't have permission to view this page.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/admin/dashboard')}
            className="px-6 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#050b2c] p-8 text-white"
    >
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </motion.button>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Airline Booking Analytics
          </h1>
        </div>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold text-center"
        >
          ₹{total.toLocaleString()}
          <span className="text-lg text-gray-400 ml-2">total revenue</span>
        </motion.div>
      </motion.header>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { icon: TrendingUp, label: "500+ Staff", color: "from-blue-500 to-blue-600" },
          { icon: Building, label: "3000+ Airports", color: "from-purple-500 to-purple-600" },
          { icon: Users, label: "Well Trained Pilots", color: "from-green-500 to-green-600" },
          { icon: Plane, label: "Ruling Sky", color: "from-yellow-500 to-yellow-600" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-4 shadow-lg`}
          >
            <stat.icon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-white/5 backdrop-blur-lg p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Weekly Bookings</h2>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <LineChart data={weeklyData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-white/5 backdrop-blur-lg p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Category Distribution</h2>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <BarChart data={categoryData}>
                <Bar dataKey="value" fill="#8b5cf6" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-white/5 backdrop-blur-lg p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Popular Destinations</h2>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 rounded-xl bg-white/5 backdrop-blur-lg p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-6">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 font-semibold">Fare</th>
                <th className="text-left py-3 px-4 font-semibold">From</th>
                <th className="text-left py-3 px-4 font-semibold">To</th>
                <th className="text-left py-3 px-4 font-semibold">Contact</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {displayedBookings.map((booking, index) => (
                  <motion.tr
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">₹{booking.FarePaid.toLocaleString()}</td>
                    <td className="py-3 px-4">{booking.departureAirport}</td>
                    <td className="py-3 px-4">{booking.arrivalAirport}</td>
                    <td className="py-3 px-4">{booking.phoneNumber}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {currentIndex < bookings.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
            >
              {loading ? 'Loading...' : 'Load More'}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}