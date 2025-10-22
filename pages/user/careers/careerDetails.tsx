import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { RootState } from '@/redux/store'; 
import Cookies from 'js-cookie';
const Navbar = dynamic(() => import('../../../components/Navbar'));

const CareerDetails = () => {
  const router = useRouter();
  const selectedJob = useSelector((state: RootState) => state.job.selectedJob);
const userId=Cookies.get('userId');
  useEffect(() => {
    if (!selectedJob) {
      router.push('/user/careers/jobBoard');
    }
  }, [selectedJob, router]);

  if (!selectedJob) {
    return null; // You can also return a loading spinner or placeholder here
  }
  useEffect(()=>{
    console.log(userId)
    if(!userId){
      router.push('/')
    }
    },[userId])
  return (
    <>
      <Navbar />

      <div className="container mx-auto mt-20 p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Job Details</h1>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-start">
            <div className="w-48 h-48 rounded overflow-hidden">
              <img
                src={selectedJob.Image || '/placeholder-job-image.jpg'}
                alt={selectedJob.designation}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="ml-6 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.designation}</h2>
              <p className="text-gray-700 mb-4">{selectedJob.description}</p>

              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800">Job Information</h3>
                {/* Add more job information here if needed */}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => router.push('/user/careers')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Back to Job Board
                </button>
                <button className='ml-5 bg-green-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg' onClick={() => router.push('/user/careers/applyCareer')}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 mt-20 text-white py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center px-6">
          <div className="mb-8 md:mb-0">
            <h2 className="text-3xl font-bold mb-4">
              Landingfolio helps you to grow your career fast.
            </h2>
            <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
              Start 14 Days Free Trial
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">About</a></li>
                <li><a href="#" className="hover:underline">Features</a></li>
                <li><a href="#" className="hover:underline">Pricing & Plans</a></li>
                <li><a href="#" className="hover:underline">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">Account</a></li>
                <li><a href="#" className="hover:underline">Tools</a></li>
                <li><a href="#" className="hover:underline">Newsletter</a></li>
                <li><a href="#" className="hover:underline">Support</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Subscribe</h3>
              <p className="mb-2">Subscribe to our newsletter for the latest news and updates.</p>
              <div className="flex items-center">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-lg bg-gray-800 text-white border-none"
                />
                <button className="bg-blue-600 px-4 py-2 rounded-r-lg text-white hover:bg-blue-700">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default CareerDetails;
