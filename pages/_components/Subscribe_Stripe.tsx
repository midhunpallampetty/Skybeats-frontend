'use client';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axiosInstance from '../api/utils/axiosInstance';
import React from 'react';
type SubscribeComponentProps = {
  price: string;
  description: string;
};
const SubscribeComponent:React.FC<SubscribeComponentProps> = () => {
  const price = useSelector((state: RootState) => state.bookdetail.selectedFlight?.price);
  const description = 'Flight on 2024'; 

  const handleSubmit = async () => {
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
    );
    if (!stripe) {
      return;
    }
    try {
      const response = await axiosInstance.post('/stripe/checkout', {
      });
      const data:any = response.data;
      if (!data.ok) throw new Error('Something went wrong');
      await stripe.redirectToCheckout({
        sessionId: data.result.id
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      Click the button below to get {description}
      <button onClick={handleSubmit}>
        Upgrade for ₹{price}
      </button>
    </div>
  );
};

export default SubscribeComponent;
