// pages/forgot-password.js
'use client';
import { useState,useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { REQUEST_PASSWORD_RESET } from '@/graphql/mutations/forgetPasswordMutation';
import Navbar from '../../Components/Navbar';
import Link from 'next/link';
import Swal from 'sweetalert2';
const formatTimer = (seconds:number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [requestPasswordReset, { data, loading, error }] = useMutation(REQUEST_PASSWORD_RESET);

  const handleSubmit = async (e:any) => {
    e.preventDefault();

    try {
      await requestPasswordReset({ variables: { email } });

      Swal.fire({
        title: 'Success',
        text: 'Password reset email sent. Please check your inbox.',
        icon: 'success',
      });

      setIsTimerActive(true);
      setTimer(3 * 60); 
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Failed',
        text: 'Password reset email sending failed.',
        icon: 'error',
      });
    }
  };

  useEffect(() => {
    let countdown:any;

    if (isTimerActive && timer > 0) {
      countdown = setTimeout(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }

    const preventKeyRefresh = (event:any) => {
      if (isTimerActive && (event.key === 'F5' || (event.ctrlKey && event.key === 'r'))) {
        event.preventDefault();
        Swal.fire({
          title: 'Warning',
          text: 'Page refresh is temporarily disabled!',
          icon: 'warning',
        });
      }
    };

    const preventUnloadRefresh = (event:any) => {
      if (isTimerActive) {
        event.preventDefault();
        event.returnValue = '';
        
        return '';
      }
    };

    window.addEventListener('keydown', preventKeyRefresh);
    window.addEventListener('beforeunload', preventUnloadRefresh);

    return () => {
      clearTimeout(countdown);
      window.removeEventListener('keydown', preventKeyRefresh);
      window.removeEventListener('beforeunload', preventUnloadRefresh);
    };
  }, [isTimerActive, timer]);
  return (
    <>
  <Navbar />
  <div className="mt-52">
        <section className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-full">
          <div className="w-full max-w-md bg-white text-black lg:w-[450px] rounded-lg shadow">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight text-black md:text-2xl">
                Reset Password
              </h1>
              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-black"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    onChange={(e) => setEmail(e.target.value)}
                    name="email"
                    id="email"
                    className="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="text-white font-extrabold h-[50px] rounded-lg w-[150px] bg-blue-950"
                    disabled={loading || isTimerActive}
                  >
                    {loading ? 'Sending...' : isTimerActive ? `Wait ${formatTimer(timer)}` : 'Send Reset Email'}
                  </button>
                </div>

                <div className="w-full flex justify-center items-center">
                  {error && <p className="text-red-500 mb-4">Error: {error.message}</p>}
                </div>

                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  Don't have an account?{' '}
                  <Link
                    href="/user/signup"
                    className="text-blue-700 hover:underline dark:text-blue-500"
                  >
                    Create account
                  </Link>
                </div>

                {data && data.requestPasswordReset && <p>{data.requestPasswordReset.message}</p>}
              </form>
            </div>
          </div>
        </section>
      </div>
    
    </>
  );
}
