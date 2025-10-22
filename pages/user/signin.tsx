'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';  
import axios from 'axios';
import Link from 'next/link';

import {  signIn, signOut ,useSession} from 'next-auth/react';
import axiosInstance from '../api/utils/axiosInstance';
import GoogleButton from '../_components/GoogleButton';
import { useMutation } from '@apollo/client';
import { SIGNIN_MUTATION } from '@/graphql/mutations/loginMutation';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
const SignIn: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userLogin, { loading, error, data }] = useMutation(SIGNIN_MUTATION);
  const [customError, setCustomError] = useState({
    email: '',
    password: ''
  });
  const { data: session } = useSession();

  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };
  useEffect(()=>{

  })

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    return '';
  };
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
const router=useRouter();
const handleSignin = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  // Validate email and password
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  setCustomError({
    email: emailError,
    password: passwordError,
  });

  if (emailError || passwordError) {
    return;
  }

  try {
    // Send login request to the API using the Axios instance
    const response = await axios.post('/api/signin', {
      email,
      password,
    });

    // Destructure the response data
    const { token, user } = response.data;

    // Check if the user is blocked
    if (user.isBlocked) {
      Swal.fire({
        title: 'User Blocked!',
        text: 'Operation failed!',
        icon: 'error',
      });
      setCustomError((prevState) => ({
        ...prevState,
        general: 'Your account is blocked. Please contact support.',
      }));
      return;
    }

    // Set cookies for authentication
   
    Cookies.set('userId', user.id, { expires: 30 });

    // Redirect user
    if (user) {
      router.push({
        pathname: '/',
        
      });
    } else {
      router.push('/');
    }
  } catch (error: any) {
    console.error('Error during sign in:', error);
    setCustomError((prevState) => ({
      ...prevState,
      general: 'An error occurred during sign in. Please try again.',
    }));
  }
};
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  useEffect(() => {
    const handlePopState = () => {
      // Redirect user back to the locked page
      router.replace('/user/signin'); // Use your page's route
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);
  return (
    <div className={`h-screen overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#0E1139] text-white' : 'bg-white text-black'}`}>
      <div className="absolute top-0 bottom-0 right-0 mt-4 ml-4 hidden sm:block">
        <Image src='/hero-shape-2.svg' width={700} height={600} className="opacity-10" alt="Shape" />
      </div>
      <div className="absolute top-0 bottom-0 left-0 mt-4 ml-4 hidden sm:block">
        <Image src='/footer-shape-2.svg' width={500} height={300} className="opacity-10" alt="Shape" />
      </div>
      <div className="absolute top-0 bottom-0 left-0 mt-4 ml-4 hidden sm:block">
        <Image src='/hero-shape-1.svg' width={500} height={300} className="opacity-10" alt="Shape" />
      </div>
      <div className="absolute top-0 left-0 mt-4 ml-4 hidden sm:block">
        <Image src='/footer-shape-1.svg' width={500} height={300} className="opacity-10" alt="Shape" />
      </div>
      <div className="absolute top-0 right-0 mt-4 ml-4 hidden sm:block">
        <Image src='/footer-shape-1.svg' width={500} height={300} className="opacity-10" alt="Shape" />
      </div>

      <nav className={`fixed w-full z-20 top-0 left-0 ${isDarkMode ? 'bg-transparent' : 'bg-white'}`}>
        <div className="max-w-full flex flex-wrap items-center justify-between mx-auto p-4">
          <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <Image src={isDarkMode ? '/logo_airline.png' : '/logo-Photoroom-light.png'} width={140} height={40} className="h-8" alt="Logo" />
          </Link>
          <div className="flex md:order-2 space-x-3 rtl:space-x-reverse">
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} className="sr-only peer" />
              <div className={`relative w-14 h-7 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`}>
                <span className={`absolute top-0.5 left-1 flex items-center justify-center h-6 w-6 rounded-full transition-all ${isDarkMode ? 'translate-x-full bg-gray-900' : 'translate-x-0 bg-white'}`}>
                  {isDarkMode ? (
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                      <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                      <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" />
                    </svg>
                  )}
                </span>
              </div>
            </label>
            <button data-collapse-toggle="navbar-sticky" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-sticky" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1zM3 10a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1zM3 15a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-full">
        <div className={`w-full max-w-md ${isDarkMode ? 'bg-white text-black' : 'bg-[#0E1139] text-white'} lg:w-[450px] rounded-lg shadow`}>
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className={`text-xl font-bold leading-tight ${isDarkMode ? 'text-black' : 'text-white'} md:text-2xl`}>
              Sign in to your account
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSignin}>
              <div>
                <label htmlFor="email" className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-black' : 'text-white'}`}>Your email</label>
                <input
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  name="email"
                  id="email"
                  className="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="name@company.com"
                  
                />
                              {customError.email && <p className="text-red-500 text-xs mt-1">{customError.email}</p>}

              </div>
              <div>
                <label htmlFor="password" className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-black' : 'text-white'}`}>Your password</label>
                <input
                  type="password"
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  id="password"
                  className="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="••••••••"
                  
                />
                              {customError.password && <p className="text-red-500 text-xs mt-1">{customError.password}</p>}

              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 font-extrabold"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <div className='w-full' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {error && (
                  <p className="text-red-500 mb-4">Error: {error.message}</p>
                )}
<button
  className="flex items-center justify-center bg-transparent border font-semibold border-gray-800 w-full h-10 rounded-lg space-x-2 hover:bg-gray-100"
  onClick={() => signIn('google')}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 262"
    width="20"
    height="20"
  >
    
    <path
      fill="#4285F4"
      d="M255.2,133.5c0-11-1.0-22.0-3.0-32.5h-124v61.5h71c-3.0,16.0-11.5,29.5-24.0,38.5v32.0h38.5
      c22.5-20.5,35.5-50.5,35.5-99.5z"
    />
   
    <path
      fill="#34A853"
      d="M131.2,262c35.5,0,65.5-11.5,87.5-31.5l-38.5-32c-11.0,7.5-25.0,12.0-49.0,12.0
      c-37.5,0-69.0-25.0-80.0-59.0H8.5v37.5c22.0,44.5,67.5,73.0,122.7,73.0z"
    />

    <path
      fill="#FBBC05"
      d="M51.2,152.5c-2.5-7.5-4.0-15.5-4.0-23.5s1.5-16.0,4.0-23.5V68.0H8.5c-7.5,15.5-12.0,32.5-12.0,50.5
      c0,18.0,4.5,35.0,12.0,50.5l42.7-16.5z"
    />
  
    <path
      fill="#EA4335"
      d="M131.2,50c22.0,0,41.5,7.5,56.5,22.0l42.5-42.5C196.7,11.0,166.7,0,131.2,0C75.7,0,31.0,28.5,8.5,68.0
      l42.7,36.5C60.7,75.0,92.0,50,131.2,50z"
    />
  </svg>
  <span>SignIn With Google</span>
</button>
              </div>
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-300">
                             Don't have an Account? <Link href="/user/signup" className="text-blue-700 hover:underline dark:text-blue-500">Create account</Link>
              </div>
              <div className="text-[10px] font-medium text-gray-500  dark:text-gray-300">
                Forget Password? <Link href="/user/forget" className="text-blue-700 hover:underline dark:text-blue-500">Reset Password</Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SignIn;




