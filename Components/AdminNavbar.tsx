'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import {
  LogOut,
  Menu,
  X,
  Home,
  User,
  Settings,
  Bell,
  ChevronDown
} from 'lucide-react';

const AdminNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('adminaccessToken');
    Cookies.remove('adminrefreshToken');
    router.push('/admin/signin');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Profile', href: '/admin/profile', icon: User },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const notifications = [
    { id: 1, text: 'New booking request', time: '5m ago' },
    { id: 2, text: 'System update completed', time: '1h ago' },
    { id: 3, text: 'New user registration', time: '2h ago' },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  const menuVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const notificationVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Admin Portal
              </h1>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </motion.a>
              );
            })}

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                <motion.div
                  initial={false}
                  animate={{ rotate: showNotifications ? 180 : 0 }}
                  className="ml-1"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={notificationVariants}
                    className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-700"
                  >
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        variants={itemVariants}
                        className="px-4 py-3 hover:bg-gray-700/50 cursor-pointer"
                      >
                        <p className="text-sm text-gray-200">{notification.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
            className="md:hidden bg-gray-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.name}
                    variants={itemVariants}
                    href={item.href}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </motion.a>
                );
              })}
              <motion.button
                variants={itemVariants}
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 hover:bg-gray-700 w-full px-3 py-2 rounded-md text-base font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default AdminNavbar;