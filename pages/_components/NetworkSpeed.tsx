'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';


const SpeedButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 6px 8px;
  background-color:  #08186a ;
  color: white;
  border: none;
  border-radius: 8px;
  
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #45a049;
  }
`;

const NetworkSpeedButton = () => {
  const [speed, setSpeed] = useState('Loading...');


  const getNetworkSpeed = () => {
    const image = new Image();
    const startTime = new Date().getTime();
    const cacheBuster = '?cache=' + Math.floor(Math.random() * 10000);


    image.onload = function () {
      const endTime = new Date().getTime();
      const duration = (endTime - startTime) / 1000;
      const bitsLoaded = 50000 * 8;
      const speedBps: any = (bitsLoaded / duration).toFixed(2);
      const speedKbps: any = (speedBps / 1024).toFixed(2);
      const speedMbps = (speedKbps / 1024).toFixed(2);

      setSpeed(`${speedMbps} Mbps`);
    };


    image.onerror = function () {
      setSpeed('Error');
    };


    image.src = 'https://via.placeholder.com/50x50' + cacheBuster;
  };


  useEffect(() => {
    const intervalId = setInterval(getNetworkSpeed, 5000);
    getNetworkSpeed();

    return () => clearInterval(intervalId);
  }, []);

  return <SpeedButton>{`Speed: ${speed}`}</SpeedButton>;
};

export default NetworkSpeedButton;
