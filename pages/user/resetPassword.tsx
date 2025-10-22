'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../Components/Navbar';
import Swal from 'sweetalert2';
import Link from 'next/link';
import axiosInstance from '../api/utils/axiosInstance';
import axios from 'axios'
export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const response = await axios.post('/api/resetPassword', {
        token,
        newPassword,
      });
  
      Swal.fire({
        title: 'Success',
        text: 'Password successfully updated',
        icon: 'success',
      });
  
      router.push('/user/signin');
    } catch (err: any) {
      console.error(err);
  
      const errorMessage =
        err.response?.data?.error || err.message || 'Password Reset Failed';
  
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
      });
  
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <Navbar />
      <div className="mt-52">
        <section className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-full">
          <div className="w-full max-w-md bg-white text-black lg:w-[450px] rounded-lg shadow">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight text-black md:text-2xl">
                Add New Password
              </h1>
              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block mb-2 text-sm font-medium text-black"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    onChange={(e) => setNewPassword(e.target.value)}
                    name="newPassword"
                    id="newPassword"
                    className="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400"
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="text-white font-extrabold h-[50px] rounded-lg w-[150px] bg-blue-950"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>

                {error && (
                  <div className="w-full flex justify-center items-center">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                  </div>
                )}

                <div className="text-sm font-medium text-gray-500">
                  Don't have an account?{' '}
                  <Link
                    href="/user/signup"
                    className="text-blue-700 hover:underline"
                  >
                    Create account
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
