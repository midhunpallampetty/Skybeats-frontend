'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale);

// Define a type for the booking data
interface Booking {
   passengerName: string;
   FarePaid: number;
}

interface BookingChartProps {
   data?: Booking[]; // Make data optional
}

const BookingChart: React.FC<BookingChartProps> = ({ data = [] }) => {
   // Check if data is empty
   if (data.length === 0) {
      return <p>No bookings available to display.</p>;
   }

   // Prepare the chart data
   const chartData = {
      labels: data.map((booking) => booking.passengerName),
      datasets: [
         {
            label: 'Fare Paid',
            data: data.map((booking) => booking.FarePaid),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
         },
      ],
   };

   // Optional: Define chart options
   const options = {
      responsive: true,
      scales: {
         y: {
            beginAtZero: true,
            title: {
               display: true,
               text: 'Fare Paid ($)',
            },
         },
      },
   };

   return <Bar data={chartData} options={options} />;
};

export default BookingChart;
