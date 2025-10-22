'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import axiosInstance from '@/pages/api/utils/axiosInstance';
interface Cloud {
  imageUrl: string
}

function Index() {
  const Navbar = dynamic(() => import('../../../components/Navbar'), { ssr: false });
  const [images, setImages] = useState<Cloud[]>([]);
  const [imageUrl, setImageUrl] = useState<string[]>([]);

  useEffect(() => {
    axiosInstance.get<Cloud[]>('http://localhost:3000/api/getClouds')
      .then((response) => {
        setImages(response.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const urls = images.map((image) => image.imageUrl);
      setImageUrl(urls);
      console.log('Images loaded:', urls);
    } else {
      console.log('No images found');
    }
  }, [images]);

  return (
    <>
      <Navbar />

      <div id="gallery" className="relative w-full" data-carousel="slide">
        <div className="relative h-56 overflow-hidden rounded-lg md:h-96">
          {imageUrl.map((url, index) => (
            <div key={index} className={`hidden duration-700 ease-in-out ${index === 0 ? 'active' : ''}`} data-carousel-item={index === 0 ? 'active' : ''}>
              <img
                src={url}
                className="absolute block max-w-full h-auto -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                alt={`Slide ${index + 1}`}
              />
            </div>
          ))}
        </div>

        <button type="button" className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
            <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4"/>
            </svg>
            <span className="sr-only">Previous</span>
          </span>
        </button>
        <button type="button" className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
            <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 9l4-4-4-4"/>
            </svg>
            <span className="sr-only">Next</span>
          </span>
        </button>
      </div>
    </>
  );
}

export default Index;
