'use client';
import React, { useState, useEffect,useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
import axiosInstance from '@/pages/api/utils/axiosInstance';
const JobApplicationForm = () => {
    const Navbar = dynamic(() => import('../../../components/Navbar'), { ssr: false });
    const selectedJob = useSelector((state: RootState) => state.job.selectedJob);
    const router = useRouter();
    const isSubmitting = useRef(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        coverLetter: '',
        cv: null as File | null,
    });

    const userId = Cookies.get('userId');

    useEffect(() => {
        if (!selectedJob) {
            router.push('/');
        }
    }, [selectedJob]);

    useEffect(() => {
        if (!userId) {
            router.push('/');
        }
    }, [userId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedExtensions = /\.(pdf|doc|docx)$/i;
            if (!allowedExtensions.test(file.name)) {
                Swal.fire('Error!', 'Only PDF, DOC, or DOCX files are allowed.', 'error');
                return;
            }
            setFormData({ ...formData, cv: file });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        const { name, email, phone, coverLetter, cv } = formData;

        // Name validation: At least 4 letters
        if (!/^[A-Za-z]{4,}$/.test(name)) {
            Swal.fire('Error!', 'Name must be at least 4 letters long and contain only alphabets.', 'error');
            return false;
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Swal.fire('Error!', 'Please enter a valid email address.', 'error');
            return false;
        }

        // Phone validation: Positive numbers only
        if (!/^[0-9]+$/.test(phone)) {
            Swal.fire('Error!', 'Phone number must be a positive numeric value.', 'error');
            return false;
        }

        // Cover letter validation: Non-empty
        if (!coverLetter.trim()) {
            Swal.fire('Error!', 'Cover letter cannot be empty.', 'error');
            return false;
        }

        // CV validation: File presence
        if (!cv) {
            Swal.fire('Error!', 'Please upload a CV in PDF, DOC, or DOCX format.', 'error');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // Ref to track submission state
        
    
        // Prevent duplicate submissions
        if (isSubmitting.current) return;
    
        // Validate form before submission
        if (!validateForm()) return;
    
        const { name, email, phone, coverLetter, cv } = formData;
    
        try {
            isSubmitting.current = true; // Set submitting state
    
            let cvUrl = '';
            if (cv) {
                cvUrl = await uploadToS3(cv); // Upload CV and get S3 URL
            }
    
            const applicationData = {
                name,
                email,
                phone,
                coverLetter,
                cv: cvUrl,
                userId,
                jobPost: selectedJob?.designation,
            };
    
            // Send the POST request
            const response = await axiosInstance.post('/applyJob', applicationData, {
                headers: { 'Content-Type': 'application/json' },
            });
    
            if (response.status === 200) {
                const data = response.data;
                Swal.fire({
                    icon: 'success',
                    title: 'Application Submitted!',
                    text: `Your application for the position of ${selectedJob?.designation} has been submitted successfully.`,
                });
                router.push('/');
            }
        } catch (error: unknown) {
            console.error('Error:', error);
        
            if (error instanceof Error && 'response' in error) {
                const { response } = error as { response: { status: number; data: { error: string } } };
        
                const { status, data } = response;
                console.log('Status code:', status);
        
                if (status === 400 && data.error === 'All fields are required.') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Incomplete Data',
                        text: 'Please fill out all required fields before submitting your application.',
                    });
                } else if (status === 500) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Already Applied!',
                        text: 'You have already applied for this job.',
                    });
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Unexpected Error',
                    text: 'An unexpected error occurred. Please try again later.',
                });
            }
        }
         finally {
            isSubmitting.current = false; // Reset submitting state
        }
    }
    
    
    const isFetching2 = useRef(false);
    const urlCache = useRef<{ [key: string]: string }>({});

    const getPresignedUrl = async (filename: string, filetype: string) => {
        // Ref to track the ongoing API call and cache the result
        
        
    
        // Generate a unique key for the request based on filename and filetype
        const cacheKey = `${filename}_${filetype}`;
    
        // Return the cached URL if it exists
        if (urlCache.current[cacheKey]) {
            return urlCache.current[cacheKey];
        }
    
        // Prevent duplicate API calls
        if (isFetching2.current) {
            throw new Error('Already fetching pre-signed URL');
        }
    
        try {
            isFetching2.current = true; // Set fetching state to true
    
            const response = await axiosInstance.post(
                '/awss3',
                { filename, filetype },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
    
            const uploadUrl = response.data.uploadUrl;
    
            // Cache the result
            urlCache.current[cacheKey] = uploadUrl;
    
            return uploadUrl;
        } catch (error: any) {
            console.error('Error fetching pre-signed URL:', error.message);
            throw new Error('Failed to get pre-signed URL');
        } finally {
            isFetching2.current = false; // Reset fetching state
        }
    };

    const uploadToS3 = async (file: File) => {
        const filename = file.name;
        const filetype = file.type;

        try {
            const uploadUrl = await getPresignedUrl(filename, filetype);
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': filetype,
                },
            });
            return uploadUrl.split('?')[0]; // Return the URL without query parameters
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };
    const truncateDescription = (text: string, wordLimit: number) => {
        const words = text.split(' ');
        if (words.length > wordLimit) {
            return words.slice(0, wordLimit).join(' ') + '...';
        }
        return text;
    };

    return (
        <>
            <Navbar />
            <div className="max-w-5xl mt-24 mx-auto p-6 grid grid-cols-1 md:grid-cols-2 text-black gap-8">
                {/* Left Side: Job Details */}
                <div className="bg-white shadow-md rounded-md p-4">
                    <h2 className="text-2xl font-semibold mb-4">Job Details</h2>
                    <div className="space-y-3">
                        <p><strong>Job Title:</strong> {selectedJob?.designation}</p>
                        <p><strong>Location:</strong> FullTime</p>
                        <p><strong>Employment Type:</strong> In Flight</p>
                        <p><strong>Job Description:</strong> {selectedJob?.description ? truncateDescription(selectedJob.description, 100) : 'Description not available'}</p>
                    </div>
                </div>

                {/* Right Side: Job Application Form */}
                <div className="bg-white shadow-md rounded-md p-4">
                    <h2 className="text-2xl font-semibold mb-4">Apply for this Job</h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                placeholder="John Doe"
                                
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                placeholder="johndoe@example.com"
                              
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                placeholder="+1 234 567 890"
                              
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                            <textarea
                                name="coverLetter"
                                value={formData.coverLetter}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                placeholder="Write your cover letter here..."
                                rows="4"
                              
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Upload CV</label>
                            <input
                                type="file"
                                name="cv"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-gray-700"
                                
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                            >
                                Submit Application
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer Code */}
            <footer className="bg-gray-800/20 shadow-white/50 shadow-inner rounded-lg text-white py-8">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">About Us</h3>
                        <p className="text-sm text-gray-400">
                            We are a leading company providing top-notch services across various
                            industries. Our goal is to deliver high-quality solutions tailored
                            to the needs of our customers.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Services</h3>
                        <ul className="text-sm text-black space-y-2">
                            <li><a href="#" className="hover:underline">Consulting</a></li>
                            <li><a href="#" className="hover:underline">Development</a></li>
                            <li><a href="#" className="hover:underline">Support</a></li>
                            <li><a href="#" className="hover:underline">Training</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
                        <p className="text-sm text-gray-400">
                            Email: info@example.com <br />
                            Phone: +1 234 567 890
                        </p>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-500">
                    © 2024 Your Company Name. All rights reserved.
                </div>
            </footer>
        </>
    );
};

export default JobApplicationForm;
