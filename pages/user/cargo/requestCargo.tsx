import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Send, User, MapPin, Weight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import Navbar from '../../../components/Navbar';
import { useRouter } from 'next/router';
function RequestCargo() {
  const [isLoading, setIsLoading] = useState(true);
  const router=useRouter()
  const [formData, setFormData] = useState({
    packageName: '',
    senderName: '',
    receiverName: '',
    descriptionOfGoods: '',
    Weight: '',
    StartLocation: '',
    Destination: ''
  });

  const [errors, setErrors] = useState({
    packageName: '',
    senderName: '',
    receiverName: '',
    descriptionOfGoods: '',
    Weight: '',
    StartLocation: '',
    Destination: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.packageName.trim()) {
      newErrors.packageName = 'Package name is required';
      isValid = false;
    }
    if (!formData.senderName.trim()) {
      newErrors.senderName = 'Sender name is required';
      isValid = false;
    }
    if (!formData.receiverName.trim()) {
      newErrors.receiverName = 'Receiver name is required';
      isValid = false;
    }
    if (!formData.StartLocation.trim()) {
      newErrors.StartLocation = 'Sender location is required';
      isValid = false;
    }
    if (!formData.Destination.trim()) {
      newErrors.Destination = 'Receiver location is required';
      isValid = false;
    }
    if (!formData.descriptionOfGoods.trim()) {
      newErrors.descriptionOfGoods = 'Description of goods is required';
      isValid = false;
    }
    if (!formData.Weight.trim()) {
      newErrors.Weight = 'Weight is required';
      isValid = false;
    } else if (isNaN(Number(formData.Weight))) {
      newErrors.Weight = 'Weight must be a number';
      isValid = false;
    } else if (Number(formData.Weight) <= 0) {
      newErrors.Weight = 'Weight must be greater than zero';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Swal.fire({
        title: 'Request Submitted!',
        html: `Your cargo booking request has been submitted successfully. TrackingID: <b>CRG${Math.random().toString(36).substr(2, 9).toUpperCase()}</b>`,
        icon: 'success',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
setTimeout(() => {
  router.push('/')
}, 300);
      setFormData({
        packageName: '',
        senderName: '',
        receiverName: '',
        descriptionOfGoods: '',
        Weight: '',
        StartLocation: '',
        Destination: ''
      });
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'An unexpected error occurred. Please try again later.',
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const formFields = [
    { name: 'packageName', label: 'Package Name', icon: Package, type: 'text', placeholder: 'Enter package name' },
    { name: 'senderName', label: 'Sender Name', icon: User, type: 'text', placeholder: 'Enter sender name' },
    { name: 'receiverName', label: 'Receiver Name', icon: User, type: 'text', placeholder: 'Enter receiver name' },
    { name: 'StartLocation', label: 'Pickup Location', icon: MapPin, type: 'text', placeholder: 'Enter pickup location' },
    { name: 'Destination', label: 'Delivery Location', icon: MapPin, type: 'text', placeholder: 'Enter delivery location' },
    { name: 'Weight', label: 'Weight (kg)', icon: Weight, type: 'number', placeholder: 'Enter package weight' }
  ];

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white mt-4 text-xl font-semibold"
            >
              Loading...
            </motion.p>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black pt-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-3xl mx-auto"
        >
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold text-center text-white mb-12"
          >
            Cargo Request Form
          </motion.h1>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <AnimatePresence>
                {formFields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      {field.label}
                    </label>
                    <div className="relative">
                      <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder={field.placeholder}
                      />
                    </div>
                    {errors[field.name as keyof typeof errors] && (
                      <p className="mt-1 text-sm text-red-400">{errors[field.name as keyof typeof errors]}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="md:col-span-2"
              >
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Description of Goods
                </label>
                <textarea
                  name="descriptionOfGoods"
                  value={formData.descriptionOfGoods}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Describe the goods being shipped"
                />
                {errors.descriptionOfGoods && (
                  <p className="mt-1 text-sm text-red-400">{errors.descriptionOfGoods}</p>
                )}
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="mt-8 w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-500 transition-all duration-200"
            >
              <Send className="w-5 h-5" />
              Submit Request
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </>
  );
}

export default RequestCargo;