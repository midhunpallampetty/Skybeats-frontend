import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

 interface Destination {
    id: number;
    name: string;
    location: string;
    description: string;
    image: string;
    rating: number;
  }
interface Props {
  destination: Destination;
}

export function DestinationCard({ destination }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className="bg-white rounded-xl overflow-hidden shadow-lg"
    >
      <motion.div
        className="relative h-64 overflow-hidden"
        whileHover={{ scale: 1.1 }}
      >
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
      </motion.div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{destination.name}</h3>
          <div className="flex items-center">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="ml-1 text-gray-600">{destination.rating}</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-2">{destination.location}</p>
        <p className="text-gray-700">{destination.description}</p>
      </div>
    </motion.div>
  );
}