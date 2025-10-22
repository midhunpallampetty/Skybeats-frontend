'use client';

import React, { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { ADMIN_LOGIN_MUTATION } from '@/graphql/mutations/adminLoginMutation';
import dynamic from 'next/dynamic';
export interface ApplyJob {
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  cv: string;
  Date: string;
  id:string;
}

interface JobApplicationsResponse {
  applications: ApplyJob[];
}

const ReceivedApplications: React.FC = () => {
  const [authorized, setAuthorized] = useState(false);
  const [applications, setApplications] = useState<ApplyJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 4;
  const router = useRouter();
  const token = Cookies.get('adminaccessToken');
  const AdminNavbar = dynamic(() => import('../../components/AdminNavbar'));

  const [adminLogin, { loading }] = useMutation(ADMIN_LOGIN_MUTATION);
  console.log(applications,'applica')
  useEffect(() => {
    if (!token) {
      router.push('/admin/signin');
    }
  }, [token, router]);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/tokenVerify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data === 'hradmin') {
          setAuthorized(true);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get<JobApplicationsResponse>('/api/getJobApplications');
        setApplications(response.data.applications || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };
    fetchApplications();
  }, []);

  const totalPages = Math.ceil(applications.length / usersPerPage);
  const currentUsers = applications.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

 

  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <AdminNavbar/>
      

        {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentUsers.map((application) => (
            <div key={application.name} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-32">
                <img
                  src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/31470401_7799874.jpg"
                  alt="Application Background"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">
                  WalkIn
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img
                      src="https://www.rosenaviation.com/wp-content/uploads/2024/02/Longest-commercial-flights-Rosen-Aviation-scaled.jpeg"
                      alt={`${application.name}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{application.name}</h3>
                    <p className="text-sm text-gray-500">{application.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Applied: {application.Date}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{application.coverLetter}</p>
              </div>
              <div className="px-4 pb-4">
                <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300 ease-in-out"
                  onClick={() => window.open(application.cv, '_blank')}
                >
                  Download Resume
                </button>
              </div>
            </div>
          ))}
        </div> */}
        <div className="max-w-7xl mx-auto mt-56">
        <button
          className="mb-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300 ease-in-out"
          onClick={() => router.push('/admin/addJobs')}
        >
          Add Jobs
        </button>
        <p className='text-white font-extrabold '>Received Job Applications</p>
<div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 text-white gap-6">
 
          {currentUsers.map((application) => (
            <div
              key={application.id}
              className="bg-transparent border-2 rounded-lg shadow-lg border-gray-600/60 flex flex-col justify-between h-60"
            >
              <div className="relative">
                <img
                  className="w-full h-28 rounded-t-lg object-cover"
                  src='https://airline-datacenter.s3.ap-south-1.amazonaws.com/What-Is-Your-Dream.jpg'
                  alt='no image'
                />
                <div className="absolute top-0 left-0 w-full h-full bg-transparent bg-opacity-60 flex flex-col justify-center items-center text-white">
                  <span
                    className="px-4 py-1 font-bold text-xs rounded-full bg-red-600 "
                  >
                    {application.Date}
                  </span>
                </div>
                <p className="text-sm text-white font-extrabold ml-10 ">Name: {application.name}</p>
                <p className="text-sm text-white font-extrabold ml-10"> Email:{application.email}</p>
                <p className="text-sm text-white font-extrabold ml-10">Date: {application.Date}</p>
              </div>
              <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300 ease-in-out"
                  onClick={() => window.open(application.cv, '_blank')}
                >
                  Download Resume
                </button>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-blue-500 hover:bg-blue-100'
                } transition duration-300 ease-in-out`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivedApplications;

