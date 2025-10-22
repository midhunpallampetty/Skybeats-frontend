import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { DestinationCard } from '../../../Components/DestinationCard';
import Navbar from '@/Components/Navbar';
 interface Destination {
    id: number;
    name: string;
    location: string;
    description: string;
    image: string;
    rating: number;
  }
const destinations: Destination[] = [
    {
      id: 1,
      name: "Santorini Sunset",
      location: "Greece",
      description: "Experience the magical sunsets and white-washed buildings of this Mediterranean paradise.",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=2000",
      rating: 4.9
    },
    {
      id: 2,
      name: "Kyoto Gardens",
      location: "Japan",
      description: "Immerse yourself in the tranquil beauty of traditional Japanese gardens and temples.",
      image: "https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&q=80&w=2000",
      rating: 4.8
    },
    {
      id: 3,
      name: "Machu Picchu",
      location: "Peru",
      description: "Discover the ancient Incan citadel set high in the Andes Mountains.",
      image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=2000",
      rating: 4.9
    },
    {
      id: 4,
      name: "Northern Lights",
      location: "Iceland",
      description: "Witness the mesmerizing aurora borealis dance across the Arctic sky.",
      image: "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&q=80&w=2000",
      rating: 4.7
    }
  ];
function Index() {
  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
     < Navbar/>
      <div className="container mx-auto px-4 py-12 mt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Compass className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Explore Dream Destinations
          </h1>
          <p className="text-gray-300 text-lg">
            Discover the world's most breathtaking locations
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
        >
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <DestinationCard destination={destination} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default Index;