'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Carousel } from 'flowbite-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
function TrackCargo() {
  const Navbar = dynamic(() => import('../../_components/Navbar'), { ssr: false });
  const [tracking, setTracking] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);  // Ensure trackingData can be null initially
 const userId=Cookies.get('userId');
  const handleTracking = () => {
    if (tracking) {
      fetchTrackingData(tracking);
    }
  };
  const router=useRouter()
  const fetchTrackingData = async (trackingId: string) => {
    try {
      const response = await fetch('/trackingConsent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackingId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched tracking data:', data);
      setTrackingData(data);  // Store the fetched data
      console.log(trackingData.data[0].packageName, 'ydfhvfdgv');
    } catch (error: any) {
      console.error('Error fetching tracking data:', error.message);
    }
  };

  useEffect(() => {
    const userId = Cookies.get('userId');
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    if (!userId || !accessToken || !refreshToken) {
      Cookies.remove('userId');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      router.push('/');  // Redirect to home or login page
    }
  }, [router]);
  return (
    <>
      <Navbar />
      <div className="h-[250px] mt-[100px] w-[99] rounded-lg sm:h-[55] xl:h-[500px] 2xl:h-[500px]">
        <Carousel>
          <img
            src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/pexels-steve-2130475.jpg"
            alt="Career Carousel 1"
          />
       
        </Carousel>
      </div>
      <p className="text-center text-white font-extrabold text-4xl mt-4">Track Consignment</p>

      <div className="w-full items-center ml-[700px] mt-28 max-w-md">
        <label className="sr-only">Search</label>
        <div className="relative w-full">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 21 21">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.15 5.6h.01m3.337 1.913h.01m-6.979 0h.01M5.541 11h.01M15 15h2.706a1.957 1.957 0 0 0 1.883-1.325A9 9 0 1 0 2.043 11.89 9.1 9.1 0 0 0 7.2 19.1a8.62 8.62 0 0 0 3.769.9A2.013 2.013 0 0 0 13 18v-.857A2.034 2.034 0 0 1 15 15Z" />
            </svg>
          </div>
          <input
            type="text"
            id="voice-search"
            onChange={(e) => setTracking(e.target.value)}
            className="bg-blue-900/40 shadow-white shadow-inner h-16  border-gray-300 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Track Your Consignment... By TrackingID"
            required
          />
          <button onClick={handleTracking} type="button" className="text-white font-extrabold absolute inset-y-0 end-0 flex items-center pe-3">
            Track
          </button>
        </div>


        {/* Tracking Details Card */}
        {trackingData && trackingData.data && trackingData.data.length > 0 ? (
  <div className="bg-blue-700/30 shadow-inner shadow-white/15 rounded-lg  p-6 max-w-lg mx-auto my-10">
    <h2 className="text-2xl font-bold mb-4 text-white">Tracking Details</h2>
    <div className="space-y-3">
      <div>
        <strong className="block text-white font-extralight">Tracking ID:</strong>
        <p className="text-white font-extrabold">{tracking}</p>
      </div>

      <div>
        <strong className="block text-white font-extralight">Package Name:</strong>
        <p className="text-white font-extrabold">{trackingData.data[0].packageName}</p>
      </div>
      <div>
        <strong className="block text-white font-extralight">Sender Name:</strong>
        <p className="text-white font-extrabold">{trackingData.data[0].senderName}</p>
      </div>
      <div>
        <strong className="block text-white font-extralight">Weight:</strong>
        <p className="text-white font-extrabold">{trackingData.data[0].Weight}</p>
      </div>
      <div>
        <strong className="block text-white font-extralight">Date Received:</strong>
        <p className="text-white font-extrabold">
          {new Date(trackingData.data[0].Date_Received).toLocaleDateString()}
        </p>
      </div>

      <div>
        <strong className="block text-white font-extralight">Description:</strong>
        <p className="text-white font-extrabold">{trackingData.data[0].descriptionOfGoods}</p>
      </div>
      <div>
        <strong className="block text-white font-extralight">Approval Status:</strong>
        <p className={`text-lg ${trackingData.data[0].approved ? 'text-green-600' : 'text-red-600 font-extrabold'}`}>
          {trackingData.data[0].approved ? 'Approved' : 'Pending'}
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="h-4 rounded-full"
          style={{
            width: trackingData.data[0].approved ? '100%' : '50%',
            backgroundColor: trackingData.data[0].approved ? 'green' : 'red',
            transition: 'width 0.3s ease', // Optional for smooth transition
          }}
        ></div>
      </div>
    </div>
  </div>
) : (
  <div className="text-white font-bold text-center my-10">
    No tracking data available.
  </div>
)}

      </div>

      {/* Footer */}
      <footer
    className="bg-blue-800/20 text-center mt-20 rounded-md text-white/10 shadow-white/15 shadow-inner ">
    <div className="container p-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="mb-6 lg:mb-0">
          <img
            src="https://img.freepik.com/free-photo/logistics-transportation-container-cargo-ship-cargo-plane-with-working-crane-bridge-shipyard-sunrise-logistic-import-export-transport-industry-background-ai-generative_123827-24177.jpg?w=1380&t=st=1726561962~exp=1726562562~hmac=4f9324056b37759c8605a8232a03522b85c0f6897e9d95b198c5420f7ee21ab2"
            className="w-full rounded-md shadow-lg" />
        </div>
        <div className="mb-6 lg:mb-0">
          <img
            src="https://img.freepik.com/free-photo/top-view-plane-boxes_23-2149853127.jpg?t=st=1726562011~exp=1726565611~hmac=a569284458a99cdb3aa222d3ac69611901ce23ff6683ea28acc7a4f70e6edd1b&w=1480"
            className="w-full rounded-md shadow-lg" />
        </div>
        <div className="mb-6 lg:mb-0">
          <img
            src="https://img.freepik.com/free-photo/logistics-means-transport-together-with-technological-futuristic-holograms_23-2151662980.jpg?t=st=1726562042~exp=1726565642~hmac=010c2b0240f5d8b1ec9ea7f9d0b07fdff1376886cc1fddfc242752aacb6e153d&w=1380"
            className="w-full rounded-md shadow-lg" />
        </div>
        <div className="mb-6 lg:mb-0">
          <img
            src="https://img.freepik.com/free-photo/green-plane-ecofriendly-environment_23-2151582434.jpg?t=st=1726562078~exp=1726565678~hmac=62eea8807a3fc6a0f501a10a9dfa1819dd6f796b81385e3c079527f4b2d89a3d&w=1480"
            className="w-full rounded-md shadow-lg" />
        </div>
        <div className="mb-6 lg:mb-0">
          <img
            src="https://img.freepik.com/free-photo/airplane-sunset_1150-8368.jpg?t=st=1726562105~exp=1726565705~hmac=fbcd17be8fbc2c36498465085b83d955ee64636b59ea873e49ebc6c9728bb922&w=1380"
            className="w-full rounded-md shadow-lg" />
        </div>
        <div className="mb-6 lg:mb-0">
          <img
            src="https://img.freepik.com/free-photo/logistics-means-transport-together-with-technological-futuristic-holograms_23-2151662992.jpg?t=st=1726562148~exp=1726565748~hmac=9216655d617871585322a750005e26a46928b4b810d988a48cd647bb394f1c9e&w=1060"
            className="w-full rounded-md shadow-lg" />
        </div>
        
      </div>
    </div>

    {/* <!--Copyright section--> */}
    <div
      className="bg-white p-4 text-center text-black ">
      © 2023 Copyright:
      <a className="dark:text-neutral-400" href="https://tw-elements.com/"
      >Skybeats</a>
    </div>
  </footer>
    </>
  );
}

export default TrackCargo;
