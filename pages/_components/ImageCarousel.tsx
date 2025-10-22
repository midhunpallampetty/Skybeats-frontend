// components/ImageCarousel.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const ImageCarousel: React.FC = () => {
  const images = [
    '/airplane_home1.webp',
    '/pexels-marina-hinic-199169-730778.jpg',
    '/pexels-mdsnmdsnmdsn-1831271.jpg',
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className='h-screen relative'>
      <Image
        src={images[currentImageIndex]}
        layout='fill'
        alt='Loading Error'
        loading='lazy'
        className='opacity-100'
        objectFit='cover'
      />
      <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center z-10'>
        <h1 className='text-white text-4xl'>Welcome to Our Service</h1>
      </div>
    </div>
  );
};

export default ImageCarousel;
