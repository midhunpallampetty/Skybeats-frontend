'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [submenuTimer, setSubmenuTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    setIsLoggedIn(!!accessToken);
  }, []);

  const handleLogout = async () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('userId');
    router.push('/user/signin');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileSubmenu(null);
  };

  const handleMouseEnter = (itemName: string) => {
    if (submenuTimer) {
      clearTimeout(submenuTimer);
      setSubmenuTimer(null);
    }
    setHoveredItem(itemName);
  };

  const handleMouseLeave = (itemName: string) => {
    const timer = setTimeout(() => {
      if (hoveredItem === itemName) {
        setHoveredItem(null);
      }
    }, 300); // 300ms delay before hiding submenu
    setSubmenuTimer(timer);
  };

  const toggleMobileSubmenu = (menu: string) => {
    setMobileSubmenu((prev) => (prev === menu ? null : menu));
  };

  const menuItems = [
    {
      name: 'Flights',
      href: '/user/flight/listflights',
      icon: '✈️',
    },
    {
      name: 'Cargo',
      href: '/',
      icon: '📦',
      submenu: [
        { name: 'Request Cargo', href: '/user/cargo/requestCargo' },
        { name: 'All Cargos', href: '/user/cargo/allCargoRequests' },
      ],
    },
    {
      name: 'Hotels',
      href: '/hotel',
      icon: '🏨',
      submenu: [
        { name: 'Book Hotels', href: '/hotel' },
        { name: 'Booking History', href: '/hotel/hotelHistory' },
      ],
    },
    {
      name: 'Careers',
      href: '/user/careers',
      icon: '💼',
      submenu: [
        { name: 'Job Openings', href: '/user/careers' },
        { name: 'Applied Jobs', href: '/user/careers/appliedJobs' },
      ],
    },
    {
      name: 'Contact Us',
      href: '/contact',
      icon: '📞',
    },
    {
      name: 'Chat Support',
      href: '/user/clientChat',
      icon: '💬',
    },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  const submenuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.nav 
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="bg-gradient-to-r from-blue-950 to-black shadow-lg fixed w-full z-20 top-0 start-0 border-b border-none shadow-black"
    >
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <Image src="/logo_airline.png" width={140} height={12} className="h-8" alt="Airline Logo" />
          </Link>
        </motion.div>

        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center"
              >
                <LogOut size={16} />
                Log Out
              </button>
            ) : (
              <Link href="/user/signin">
                <button
                  type="button"
                  className="flex items-center gap-2 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center"
                >
                  <User size={16} />
                  Sign In
                </button>
              </Link>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMobileMenu}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-controls="navbar-sticky"
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
          </motion.button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="items-center justify-between w-full md:flex md:w-auto md:order-1"
              id="navbar-sticky"
            >
              <motion.ul 
                variants={navVariants}
                className="flex flex-col p-4 md:p-0 mt-4 font-medium rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0 bg-gradient-to-r from-blue-900 to-indigo-900 md:bg-transparent"
              >
                {menuItems.map((item) => (
                  <motion.li 
                    key={item.name} 
                    variants={itemVariants}
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter(item.name)}
                    onMouseLeave={() => handleMouseLeave(item.name)}
                  >
                    <div className="flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 py-2 px-3 text-white rounded hover:bg-blue-800 md:hover:bg-transparent md:hover:text-blue-300 md:p-0 transition-colors duration-200"
                          onClick={closeMobileMenu}
                        >
                          <span>{item.icon}</span>
                          {item.name}
                          {item.submenu && (
                            <ChevronDown 
                              size={16} 
                              className={`transition-transform duration-200 ${hoveredItem === item.name ? 'rotate-180' : ''}`}
                            />
                          )}
                        </Link>
                      </motion.div>
                    </div>

                    {item.submenu && (
                      <AnimatePresence>
                        {hoveredItem === item.name && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={submenuVariants}
                            className="absolute left-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl"
                            onMouseEnter={() => handleMouseEnter(item.name)}
                            onMouseLeave={() => handleMouseLeave(item.name)}
                          >
                            {item.submenu.map((subitem) => (
                              <motion.div
                                key={subitem.name}
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                className="relative"
                              >
                                <Link
                                  href={subitem.href}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                                  onClick={closeMobileMenu}
                                >
                                  {subitem.name}
                                </Link>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.li>
                ))}

                <motion.li 
                  variants={itemVariants}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/user/profile"
                    className="block py-2 px-3 text-white rounded-full overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all duration-200"
                    onClick={closeMobileMenu}
                  >
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      className="w-8 h-8 rounded-full"
                      src="https://miro.medium.com/v2/resize:fit:1400/1*VcrrNXYOXbtnZqQ9R_Svbw.png"
                      alt="User profile"
                    />
                  </Link>
                </motion.li>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${
          mobileMenuOpen ? 'block' : 'hidden'
        }`}>
          <motion.ul 
            variants={navVariants}
            className="hidden md:flex md:p-0 md:space-x-8 md:mt-0 md:border-0 md:bg-transparent"
          >
            {menuItems.map((item) => (
              <motion.li 
                key={item.name} 
                variants={itemVariants}
                className="relative group"
                onMouseEnter={() => handleMouseEnter(item.name)}
                onMouseLeave={() => handleMouseLeave(item.name)}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 py-2 px-3 text-white rounded hover:text-blue-300 transition-colors duration-200"
                  >
                    <span>{item.icon}</span>
                    {item.name}
                    {item.submenu && (
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${hoveredItem === item.name ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>
                </motion.div>

                {item.submenu && (
                  <AnimatePresence>
                    {hoveredItem === item.name && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={submenuVariants}
                        className="absolute left-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl"
                        onMouseEnter={() => handleMouseEnter(item.name)}
                        onMouseLeave={() => handleMouseLeave(item.name)}
                      >
                        {item.submenu.map((subitem) => (
                          <motion.div
                            key={subitem.name}
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            className="relative"
                          >
                            <Link
                              href={subitem.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                            >
                              {subitem.name}
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.li>
            ))}

            <motion.li 
              variants={itemVariants}
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/user/profile"
                className="block rounded-full overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all duration-200"
              >
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-full"
                  src="https://miro.medium.com/v2/resize:fit:1400/1*VcrrNXYOXbtnZqQ9R_Svbw.png"
                  alt="User profile"
                />
              </Link>
            </motion.li>
          </motion.ul>
        </div>
      </div>
    </motion.nav>
  );
}