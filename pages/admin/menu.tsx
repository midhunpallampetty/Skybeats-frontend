'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import adminAxios from '../api/utils/adminAxiosInstance';

interface Food {
  _id: string;
  itemName: string;
  stock: number;
  hotOrCold: 'Hot' | 'Cold';
  ImageUrl: string;
  price: number;
  createdAt: string;
}

const Menu: React.FC = () => {
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const token = Cookies.get('adminaccessToken');
  const router = useRouter();
  const AdminNavbar = dynamic(() => import('../../Components/AdminNavbar'));

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await adminAxios.get('/listFoods');
        setFoods(response.data);
        setFilteredFoods(response.data);
      } catch (error) {
        console.error('Error fetching food data:', error);
      }
    };

    fetchFoods();
  }, []);


  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        router.push('/admin/dashboard');
        return;
      }
  
      try {
        const response = await adminAxios.post('/tokenVerify', { token }, {
          headers: { 'Content-Type': 'application/json' },
        });
  
        const data = response.data;
  
        if (response.status === 200 && data === 'hoteladmin') {
          setRole(data);
          setAuthorized(true);
        } else {
          router.push('/admin/dashboard');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error verifying token:', error.message);
        } else {
          console.error('Unexpected error:', error);
        }
        router.push('/admin/dashboard');
      }
    };
  
    verifyToken();
  }, [token, router]);

  useEffect(() => {
    const filtered = foods.filter((food) =>
      food.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFoods(filtered);
    setCurrentPage(1);
  }, [searchTerm, foods]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFoods = filteredFoods.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  if (!authorized) return <p>Loading...</p>;

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="relative w-full h-full flex flex-col items-center text-white">
      <AdminNavbar />

      <div
        className="absolute top-0 left-0 w-full mt-24 h-screen mb-64 opacity-8 pointer-events-none bg-cover bg-no-repeat bg-center"
        style={{ backgroundImage: 'url(/admin_bg.png)', opacity: 0.1 }}
      />

      <div className="relative z-10 xl:w-[1200px] lg:w-[1000px] md:w-[800px] sm:w-full p-4">
        {/* Search Bar */}
        
        <div className="mt-8">
          <input
            type="text"
            placeholder="Search by item name"
            className="w-full p-3 rounded-md mt-10 bg-gray-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => router.push('/admin/addMeal')}
            className="p-4 mt-6 bg-blue-900 text-white font-bold rounded-lg"
          >
            Add Menu
          </button>
        </div>

        {/* Food Items */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {currentFoods.map((food) => (
            <div
              key={food._id}
              className="bg-transparent border-2 rounded-lg shadow-lg border-gray-600/60 flex flex-col justify-between h-60"
            >
              <div className="relative">
                <img
                  className="w-full h-28 rounded-t-lg object-cover"
                  src={food.ImageUrl}
                  alt={food.itemName}
                />
                <div className="absolute top-0 left-0 w-full h-full bg-transparent bg-opacity-60 flex flex-col justify-center items-center text-white">
                  <span
                    className={`px-4 py-1 font-bold text-xs rounded-full ${
                      food.hotOrCold === 'Hot' ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                  >
                    {food.hotOrCold}
                  </span>
                </div>
              </div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-bold">{food.itemName}</h3>
                <p className="text-xs mt-1">
                  Menu added on:{' '}
                  {new Date(food.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8 space-x-2">
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`px-4 py-2 rounded-md ${
                number === currentPage ? 'bg-blue-700' : 'bg-gray-800'
              } text-white`}
            >
              {number}
            </button>
          ))}
        </div>

        
      </div>
    </div>
  );
};

export default Menu;
