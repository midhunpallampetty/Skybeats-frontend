'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link  from 'next/link';
import Cookies from 'js-cookie';
import { ChevronRight, ArrowRight, Facebook, Twitter, Instagram, Linkedin, Github, Menu, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '../components/Navbar';
const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router=useRouter()
  // const AiChatBot = dynamic(() => import('../../_components/AiChatBot'), { ssr: false });
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    setIsLoggedIn(!!accessToken);
  }, []);
  const images = [
    'https://airline-datace.s3.ap-south-1.amazonaws.com/pexels-pixabay-531756.jpg',
    'https://airline-datace.s3.ap-south-1.amazonaws.com/pexels-pixabay-147411.jpg',
    'https://airline-datace.s3.ap-south-1.amazonaws.com/pexels-pixabay-302769.jpg'
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 15000); // Change image every 15 seconds
  
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    // If session exists and the token is available, set it in a cookie
    if (session && session.user?.accessToken && session.user?.refreshToken) {
      const currentRefreshToken = Cookies.get('refreshToken');
      const currentAccessToken = Cookies.get('accessToken');
      const currentUserId = Cookies.get('userId');
      
      if (
        session.user.accessToken !== currentRefreshToken ||
        session.user.refreshToken !== currentAccessToken ||
        session.user.usersId !== currentUserId
      ) {
        Cookies.set('refreshToken', session.user.refreshToken, { expires: 7 }); // Expires in 7 days
        Cookies.set('accessToken', session.user.accessToken, { expires: 7 }); 
        Cookies.set('userId', session.user.usersId);
        console.log('JWT Token set in cookie:', session.user.token);
      }
    }
  }, [session]);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    // Remove the cookies accessible by JavaScript
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');

    Cookies.remove('userId');
    // Call the API to remove the HttpOnly refresh token cookie
    
  
   
      // If the response is successful, redirect the user
      router.push('/user/signin');
    
  };
  // Loader Component
  const Loader = () => (
    
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-navy-950 z-50">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8"
      >
        <svg 
          width="120" 
          height="120" 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <motion.path
            d="M60 10L10 60L60 110L110 60L60 10Z"
            fill="url(#gradient)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0EA5E9" />
              <stop offset="1" stopColor="#0369A1" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-2xl font-medium text-white mb-4"
      >
        Skybeats
      </motion.h2>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 200 }}
        transition={{ 
          delay: 0.5,
          duration: 2, 
          ease: "easeInOut", 
          repeat: Infinity, 
          repeatType: "reverse"
        }}
        className="h-1 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
      />
    </div>
  );

  // Navbar Component
  const Navbar = () => (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-300 ${
        isScrolled ? 'py-3 glass shadow-sm' : 'py-5 bg-transparent'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 120 120" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M60 10L10 60L60 110L110 60L60 10Z"
                fill="url(#navGradient)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="navGradient" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0EA5E9" />
                  <stop offset="1" stopColor="#0369A1" />
                </linearGradient>
              </defs>
            </svg>
            <span className={`text-xl font-semibold ${isScrolled ? 'text-gray-900' : 'text-white'} tracking-tight`}>
              Skybeats
            </span>
          </motion.div>
        </Link>
        {/* <AiChatBot /> */}
        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-8">
          {['Home', 'Flights', 'Destinations', 'About Us', 'Contact'].map((item, index) => (
            <motion.a
              key={index}
              href="#"
              className={`${
                isScrolled ? 'text-gray-800 hover:text-sky-600' : 'text-white   font-extrabold  hover:text-white'
              } font-medium text-sm transition-colors relative group`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {item}
              <span className="absolute inset-x-0 -bottom-1 h-0.5  bg-sky-500 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100"></span>
            </motion.a>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          button-glow px-4 py-2 rounded-lg text-sm font-medium 
          ${isScrolled ? 
            'bg-sky-600 hover:bg-sky-700 text-white shadow-sm' : 
            'bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20'
          } transition-all
        `}
        onClick={handleLogout}
      >
        {isLoggedIn ? 'Logout' : 'Signin'}
      </motion.button>
    </div>

        {/* Mobile Menu Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-900 dark:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden fixed top-16 inset-x-0 z-50 glass-dark overflow-hidden"
          >
            <div className="py-4 px-6 space-y-4">
              {['Home', 'Flights', 'Destinations', 'About Us', 'Contact'].map((item, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="block py-3 px-4 text-white hover:bg-white/10 rounded-lg transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </motion.a>
              ))}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full mt-4 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );

  // Hero Component
  const Hero = () => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      },
    };

    return (
      <section className="relative w-full h-screen overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <motion.div 
  className="absolute inset-0 z-0"
>
  <AnimatePresence mode='wait'>
    <motion.div
      key={currentImageIndex}
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="absolute inset-0"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${images[currentImageIndex]}')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent" />
    </motion.div>
  </AnimatePresence>
</motion.div>

        {/* Content */}
        <div className="relative h-full z-10 container mx-auto px-4 flex flex-col justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.span 
              variants={itemVariants}
              className="inline-block px-3 py-1 mb-6 text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-white"
            >
              Journey Beyond the Ordinary
            </motion.span>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            >
              Welcome to <span className="text-gradient">Skybeats</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-white/80 mb-10 max-w-xl"
            >
              Experience the harmony of luxury travel and cutting-edge innovation. Where every journey becomes an unforgettable symphony.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="button-glow px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow-lg flex items-center"
              >
                <Link href='/user/flight/listflights'>
                Book Your Flight
                </Link>
               
                <ChevronRight className="ml-1 h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }} 
                className="button-glow px-6 py-3  hover:bg-white/20 backdrop-blur-sm border border-white/20 text-black rounded-lg font-medium flex items-center"
              >
                <Link href='/user/destination'>
                Explore Destinations

                </Link>
                <ArrowRight className="ml-1 h-5 w-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        >
          <span className="text-white/70 text-sm mb-2">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
          >
            <motion.div
              animate={{ height: [6, 12, 6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 rounded-full bg-white"
            />
          </motion.div>
        </motion.div>
      </section>
    );
  };

  // Destinations Section
  const DestinationsSection = () => (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-sky-600 mb-2 inline-block">POPULAR DESTINATIONS</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-navy-950 text-black">Explore Our Top Destinations</h2>
          <p className="text-gray-600">Discover the most beautiful places around the world with our premium flight experiences, crafted for the discerning traveler.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { 
              name: "Paris", 
              country: "France", 
              image: "https://airline-datace.s3.ap-south-1.amazonaws.com/pexels-frank-zienert-110873-342113.jpg" 
            },
            { 
              name: "Tokyo", 
              country: "Japan", 
              image: "https://airline-datace.s3.ap-south-1.amazonaws.com/pexels-vitalina-3800117.jpg" 
            },
            { 
              name: "New York", 
              country: "USA", 
              image: "https://airline-datace.s3.ap-south-1.amazonaws.com/pexels-skyriusmarketing-2129796.jpg" 
            },
          ].map((destination, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group rounded-2xl overflow-hidden shadow-lg cursor-pointer relative"
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-center absolute inset-0 transform group-hover:scale-110 transition-transform duration-700"
                  style={{ backgroundImage: `url(${destination.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-xl font-semibold text-white mb-1">{destination.name}</h3>
                <div className="flex items-center">
                  <span className="text-white/80 text-sm">{destination.country}</span>
                  <motion.div
                    initial={false}
                    animate={{ x: 5 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
                    className="ml-2 w-5 h-0.5 bg-sky-400"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <button className="px-6 py-3 bg-transparent hover:bg-sky-50 border border-sky-200 rounded-lg text-sky-600 font-medium transition-colors">
            View All Destinations
          </button>
        </motion.div>
      </div>
    </section>
  );

  // Features Section
  const FeaturesSection = () => (
    <section className="py-20 bg-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <span className="text-sm font-medium text-sky-600">WHY CHOOSE SKYBEATS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-950">Elevate Your Travel Experience</h2>
            <p className="text-gray-600">
              At Skybeats, we redefine luxury air travel, combining comfort with cutting-edge technology to provide an unparalleled flying experience.
            </p>
            
            <div className="space-y-4">
              {[
                {
                  title: "Premium Comfort",
                  description: "Ergonomically designed seats with ample legroom and advanced recline technology."
                },
                {
                  title: "Sustainable Travel",
                  description: "Our fleet operates with state-of-the-art fuel efficiency systems to minimize environmental impact."
                },
                {
                  title: "Personalized Service",
                  description: "Experience tailored service that caters to your preferences before, during, and after your flight."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  className="flex items-start"
                >
                  <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center mt-1 mr-3">
                    <div className="w-2 h-2 rounded-full bg-sky-600"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="button-glow mt-4 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow-sm"
            >
              Learn More About Us
            </motion.button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl overflow-hidden h-[500px]"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/feature-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-gray-300" />
            
            <div className="absolute bottom-6 left-6 right-6 p-6 glass bg-white rounded-xl">
              <div className="flex items-center mb-3 ">
                <div className="w-10 h-10 rounded-full bg-white  flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-sky-600"></div>
                </div>
                <div className="ml-3 ">
                  <h4 className="font-semibold text-black">Customer Satisfaction</h4>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-black">
                "The most luxurious flying experience I've ever had. The attention to detail and personalized service were exceptional."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  // Footer Component
  const Footer = () => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5 },
      },
    };

    return (
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="bg-navy-950 text-white pt-16 pb-8"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <motion.div variants={itemVariants} className="space-y-4">
              <Link href="/" className="flex items-center mb-6">
                <svg 
                  width="40" 
                  height="40" 
                  viewBox="0 0 120 120" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M60 10L10 60L60 110L110 60L60 10Z"
                    fill="url(#footerGradient)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="footerGradient" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0EA5E9" />
                      <stop offset="1" stopColor="#0369A1" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-xl font-semibold tracking-tight">
                  Skybeats
                </span>
              </Link>
              <p className="text-gray-400 text-sm">
                Experience the harmony of luxury travel and cutting-edge innovation. Where every journey becomes an unforgettable symphony.
              </p>
              <div className="flex space-x-4 pt-2">
                {[
                  { icon: <Facebook size={18} />, href: "#" },
                  { icon: <Twitter size={18} />, href: "#" },
                  { icon: <Instagram size={18} />, href: "#" },
                  { icon: <Linkedin size={18} />, href: "#" },
                  { icon: <Github size={18} />, href: "#" },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ y: -3 }}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-navy-800 hover:bg-sky-600 transition-colors"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {[
              {
                title: "Resources",
                links: ["Skybeats Inc.", "Airbus", "Boeing", "Travel Guide", "Flight Status"]
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Partners", "Press", "Blog"]
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms & Conditions", "Cookie Policy", "FAQ", "Support"]
              }
            ].map((section, sectionIndex) => (
              <motion.div key={sectionIndex} variants={itemVariants} className="space-y-4">
                <h3 className="text-lg font-medium mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a 
                        href="#" 
                        className="text-gray-400 hover:text-sky-400 transition-colors text-sm inline-block relative group"
                      >
                        {link}
                        <span className="absolute inset-x-0 bottom-0 h-px bg-sky-500 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100"></span>
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div 
            variants={itemVariants}
            className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center"
          >
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2024 Skybeats™. All Rights Reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Cookies</a>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    );
  };

  return (
    <>

      <style>
        {loadingKeyframes}
      </style>
      {isLoading ? (
        <div style={loadingScreenStyle}>
          <Image
            src="/logo_airline.png" // Replace with your logo path
            alt="Logo"
            width={200}
            height={200}
          />
          <div style={loadingBarStyle}>
            <div style={loadingBarFillStyle}></div>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <AiChatBot />
          <div className="h-[80vh] relative">
  <Image
    src="https://airline-datace.s3.ap-south-1.amazonaws.com/pexels-pixabay-531756.jpg"
    layout="fill"
    alt="Loading Error"
    loading="lazy"
    className="opacity-80"
    objectFit="cover"
  />
  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
    
    <h1 className="text-white text-6xl font-bold text-center">Welcome to Skybeats</h1>
  </div>
</div>

          <footer className="bg-gray-900">
            <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
              {/* Footer content */}
              <div className="md:flex md:justify-between">
                <div className="mb-6 md:mb-0">
                  <Link href="/" className="flex items-center">
                    <Image src="/logo_airline.png" width={140} height={12} className="h-8" alt="Flowbite Logo" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
                  {[
                    { title: 'Resources', links: ['Skybeats Inc.', 'Airbus', 'Boeing'] },
                    { title: 'Follow us', links: ['Github', 'Discord'] },
                    { title: 'Legal', links: ['Privacy Policy', 'Terms & Conditions'] }
                  ].map((section, index) => (
                    <div key={index}>
                      <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                        {section.title}
                      </h2>
                      <ul className="text-gray-500 dark:text-gray-400 font-medium">
                        {section.links.map((link, idx) => (
                          <li key={idx} className="mb-4">
                            <Link href="#" className="hover:underline">
                              {link}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
              <div className="sm:flex sm:items-center sm:justify-between">
                <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                  © 2024 <Link href="/" className="hover:underline">Skybeats™</Link>. All Rights Reserved.
                </span>
                <div className="flex mt-4 sm:justify-center sm:mt-0">
                  {/* Social media links */}
                  {[
                    { href: '#', svgPath: 'M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z', title: 'Facebook page' },
                    { href: '#', svgPath: 'M16.942 1.556a16.3 16.3 0 0 0-4.126-1.3 12.04 12.04 0 0 0-.529 1.1 15.175 15.175 0 0 0-4.573 0 11.585 11.585 0 0 0-.535-1.1 16.274 16.274 0 0 0-4.129 1.3A17.392 17.392 0 0 0 .182 13.218a15.785 15.785 0 0 0 4.963 2.521c.41-.564.773-1.16 1.084-1.785a10.63 10.63 0 0 1-1.706-.83c.143-.106.283-.217.418-.33a11.664 11.664 0 0 0 10.118 0c.137.113.277.224.418.33-.544.328-1.116.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595 17.286 17.286 0 0 0-2.973-11.59Z', title: 'Discord community' },
                    { href: '#', svgPath: 'M20 1.892a8.178 8.178 0 0 1-2.355.635 4.074 4.074 0 0 0 1.8-2.235 8.344 8.344 0 0 1-2.605.98A4.13 4.13 0 0 0 13.85 0a4.068 4.068 0 0 0-4.1 4.038 4 4 0 0 0 .105.919A11.705 11.705 0 0 1 1.4.734a4.006 4.006 0 0 0 1.268 5.392 4.165 4.165 0 0 1-1.859-.5v.05A4.057 4.057 0 0 0 4.1 9.635a4.19 4.19 0 0 1-1.856.07 4.108 4.108 0 0 0 3.831 2.807A8.36 8.36 0 0 1 0 14.184 11.732 11.732 0 0 0 6.291 16 11.502 11.502 0 0 0 17.964 4.5c0-.179-.005-.357-.014-.534A8.18 8.18 0 0 0 20 1.892Z', title: 'Twitter page' },
                    { href: '#', svgPath: 'M20 0H0v20h20V0ZM8.25 15H5.5V8.25H8.25V15Zm-1.375-7.188A1.688 1.688 0 1 1 8.25 6.125a1.682 1.682 0 0 1-1.687 1.688Zm9.625 7.188h-2.75v-3.375c0-.813-.014-1.875-1.125-1.875-1.125 0-1.313.88-1.313 1.813V15H9.875V8.25h2.625v.938h.037a2.88 2.88 0 0 1 2.588-1.425c2.775 0 3.288 1.825 3.288 4.2V15Z', title: 'LinkedIn profile' }
                  ].map((icon, index) => (
                    <Link href={icon.href} className="text-gray-500 hover:text-gray-900 dark:hover:text-white" key={index}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d={icon.svgPath} />
                      </svg>
                      <span className="sr-only">{icon.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      <AnimatePresence>
        {isLoading ? (
          <Loader />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            <Navbar />
            <Hero />
            <DestinationsSection />
            <FeaturesSection />
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};

export default Index;   