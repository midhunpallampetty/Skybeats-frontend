'use client';
import React, { useEffect, useState, useMemo,useRef } from 'react';
import dynamic from 'next/dynamic';
import { Carousel } from 'flowbite-react';
import Cookies from 'js-cookie';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setSelectedJob } from '@/redux/slices/jobSlice';
import axiosInstance from '@/pages/api/utils/axiosInstance';
import { Job } from '@/interfaces/Job';

const Navbar = dynamic(() => import('../../_components/Navbar'), { ssr: false });
const ChatBox = dynamic(() => import('../../_components/ChatBox'), { ssr: false });

const JobBoard = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [career, setCareer] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCareer, setFilteredCareer] = useState<Job[]>([]);
  const accessToken = Cookies.get('accessToken');
  const [expandedJobIndex, setExpandedJobIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(2);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'designation' | 'salary' | 'createdAt'>('designation');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const isFetched = useRef(false); 
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;

  // Fetch job data from the server
  useEffect(() => {
    const fetchCareerData = async () => {
      try {
        const response = await axiosInstance.get('/getCareer');
        if (response.data?.getJobs) {
          setCareer(response.data.getJobs);
          setFilteredCareer(response.data.getJobs);
        } else {
          console.error('getJobs array not found in the response data');
        }
      } catch (error) {
        console.error('Error fetching career data:', error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    };

    if (!isFetched.current) {
      // Only fetch data if it hasn't been fetched yet
      isFetched.current = true; // Mark as fetched
      fetchCareerData();
    }
  }, []);

  // Redirect to login if no access token
  useEffect(() => {
    if (!accessToken) {
      router.push('/');
    }
  }, [accessToken, router]);

  // Handle debounced search
  const handleSearch = debounce((query: string) => {
    const filteredJobs = career.filter((job) =>
      job.designation.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCareer(filteredJobs);
    setCurrentPage(1); // Reset pagination
  }, 300);

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  // Sort the job list
  const handleSort = (sortOrder: 'asc' | 'desc', sortBy: 'designation' | 'salary' | 'createdAt') => {
    setSortOrder(sortOrder);
    setSortBy(sortBy);

    const sortedJobs = [...filteredCareer].sort((a, b) => {
      if (sortBy === 'designation') {
        return sortOrder === 'asc'
          ? a.designation.localeCompare(b.designation)
          : b.designation.localeCompare(a.designation);
      } else if (sortBy === 'salary') {
        return sortOrder === 'asc' ? a.salary - b.salary : b.salary - a.salary;
      } else if (sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    setFilteredCareer(sortedJobs);
  };

  // Filter by designation
  const handleFilterByDesignation = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const designation = event.target.value;
    setSelectedDesignation(designation);

    const filteredJobs = designation
      ? career.filter((job) => job.designation === designation)
      : career;

    setFilteredCareer(filteredJobs);
    setCurrentPage(1);
  };

  const currentJobs = useMemo(
    () => filteredCareer.slice(indexOfFirstJob, indexOfLastJob),
    [filteredCareer, indexOfFirstJob, indexOfLastJob]
  );

  const uniqueDesignations = useMemo(
    () => [...new Set(career.map((job) => job.designation))],
    [career]
  );

  // Handle pagination
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toggleShowMore = (index: number) => {
    setExpandedJobIndex(expandedJobIndex === index ? null : index);
  };

  const handleDetailsClick = (job: Job) => {
    dispatch(setSelectedJob(job));
    router.push('/user/careers/careerDetails');
  };

  return (
    <>
      <Navbar />
      <ChatBox />
       
      <div className="h-56 mt-[50px] sm:h-[85] xl:h-80 2xl:h-[600px]">
        <Carousel>
          <img
            src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/e9f1d460-5e31-4a2c-9348-85d8ba317708.jpeg"
            alt="Career Carousel 1"
          />
        </Carousel>
      </div>
      {loading ? (
  Array.from({ length: 4 }).map((_, index) => (
    <div
      key={index}
      className="bg-blue-950 text-white w-full min-h-[300px] p-6 rounded-xl shadow-md animate-pulse"
    >
      <div className="flex flex-col items-center">
        {/* Placeholder for Image */}
        <div className="w-32 h-32 rounded-md overflow-hidden bg-gray-700 mb-4"></div>
        {/* Placeholder for Text */}
        <div className="space-y-2 w-full text-center">
          <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto"></div>
        </div>
        {/* Placeholder for Buttons */}
        <div className="mt-4 flex flex-col space-y-2 w-full">
          <div className="h-10 bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-10 bg-gray-700 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  ))
) : (
      <div className="flex justify-center h-auto ">
        <div className="flex flex-col md:flex-row mt-10 max-w-[1200px] w-full">
          <div className="w-full md:w-[350px] max-h-[550px] p-4 bg-blue-950 text-white rounded-lg ml-4">
            <h3 className="font-bold mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="font-bold mb-2 block">Search by Designation:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Type designation"
                  className="w-full py-2 px-4 bg-gray-200 text-black rounded"
                />
              </div>
              <div>
                <label className="font-bold mb-2 block">Sort by:</label>
                <select
                  onChange={(e) => handleSort(sortOrder, e.target.value as 'designation' | 'salary' | 'createdAt')}
                  value={sortBy}
                  className="w-full py-2 px-4 bg-gray-200 text-black rounded"
                >
                  <option value="designation">Designation</option>
                  <option value="salary">Salary</option>
                  <option value="createdAt">Latest</option>
                </select>
                <select
                  onChange={(e) => handleSort(e.target.value as 'asc' | 'desc', sortBy)}
                  value={sortOrder}
                  className="w-full py-2 px-4 bg-gray-200 text-black rounded mt-2"
                >
                  <option value="asc">Low to High</option>
                  <option value="desc">High to Low</option>
                </select>
              </div>
              <div>
                <label className="font-bold mb-2 block">Filter by Designation:</label>
                <select
                  onChange={handleFilterByDesignation}
                  value={selectedDesignation}
                  className="w-full py-2 px-4 bg-gray-200 text-black rounded"
                >
                  <option value="">All</option>
                  {uniqueDesignations.map((designation, index) => (
                    <option key={index} value={designation}>
                      {designation}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="w-full md:w-3/4 p-4 ml-11">
            <div className="grid grid-cols-1 gap-6">
              {currentJobs.length > 0 ? (
                currentJobs.map((job, index) => (
                  <div
                    key={index}
                    className="bg-blue-950 text-white w-full min-h-[300px] p-6 rounded-xl shadow-md"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-md overflow-hidden border-2 border-blue-500 mb-4">
                        <img
                          src={job.Image}
                          alt="Job Image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <h2 className="font-bold text-lg mb-2">
                          {expandedJobIndex === index
                            ? job.description
                            : `${job.description.slice(0, 50)}...`}
                        </h2>
                        <p className="text-gray-300 text-sm mb-4">{job.designation}</p>
                        <p className="text-white font-semibold text-lg mb-4">
                          Salary: {job.salary} LPA
                        </p>
                      </div>
                      <button
                        onClick={() => toggleShowMore(index)}
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                      >
                        {expandedJobIndex === index ? 'Show Less' : 'Show More'}
                      </button>
                      <button
                        onClick={() => handleDetailsClick(job)}
                        className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-lg font-semibold text-gray-600">No jobs found.</p>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-center space-x-2">
                {Array.from(
                  { length: Math.ceil(filteredCareer.length / jobsPerPage) },
                  (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`py-2 px-4 rounded ${
                        currentPage === i + 1
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-black'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default JobBoard;
