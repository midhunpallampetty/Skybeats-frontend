import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import adminAxios from '../api/utils/adminAxiosInstance';
const backgroundStyle: React.CSSProperties = {
  backgroundImage: 'url(\'/admin-bg.png\')',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  height: '100vh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const formContainerStyle: React.CSSProperties = {
  width: '80%',
  marginTop: '150px',
  maxWidth: '800px',
  padding: '20px',
  display: 'flex',
  gap: '20px',
};

const gridBackgroundStyle = {
  backgroundImage: 'url(\'/admin-bg.png\')',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  height: '100vh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
};

function AddJobs() {
  const [designation, setDesignation] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    designation: '',
    description: '',
    salary: '',
    image: '',
  });
const router=useRouter()
  const AdminNavbar = dynamic(() => import('../../components/AdminNavbar'));
  
  const validateForm = () => {
    let valid = true;
    let newErrors = { designation: '', description: '', salary: '', image: '' };
  
    if (!designation) {
      newErrors.designation = 'Please select a job designation.';
      valid = false;
    }
  
    if (!description) {
      newErrors.description = 'Description is required.';
      valid = false;
    }
  
    if (!salary) {
      newErrors.salary = 'Salary is required.';
      valid = false;
    } else if (isNaN(Number(salary))) {
      newErrors.salary = 'Please enter a valid number for salary.';
      valid = false;
    } else if (Number(salary) <= 0) {
      newErrors.salary = 'Salary must be greater than zero.';
      valid = false;
    }
  
    if (!image) {
      newErrors.image = 'Please upload an image.';
      valid = false;
    }
  
    setErrors(newErrors);
    return valid;
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const getPresignedUrl = async (filename: string, filetype: string) => {
    const response = await fetch('/api/awss3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename, filetype }),
    });

    if (!response.ok) {
      throw new Error('Failed to get pre-signed URL');
    }

    const data = await response.json();
    return data.uploadUrl;
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
      setImageUrl(uploadUrl.split('?')[0]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (image) {
        await uploadToS3(image);
      }

      const jobData = {
        designation,
        description,
        salary:parseInt(salary),
        Image: imageUrl,
      };

      const response = await fetch('/api/createJob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        Swal.fire('Job Posted Successfully!');
        setDesignation('');
        setDescription('');
        setSalary('');
        setImage(null);
        setImagePreview(null);
        setImageUrl('');
        setTimeout(()=>{
router.push('/admin/dashboard')
        },300)
      } else {
        console.error('Failed to add job');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const token = Cookies.get('accessToken');

  useEffect(()=>{
    if(!token){
      router.push('/admin/signin');
    }
    },[token]);
      useEffect(() => {
         if (!token) {
            router.push('/admin/signin');
         }
      }, [token, router]);
  return (
    <>
      <AdminNavbar />
      <div className="flex justify-center h-screen" style={gridBackgroundStyle}>
        <div style={formContainerStyle}>
          <form onSubmit={handleSubmit} className="flex-1">
            {/* Job Designation Field */}
            <div className="mb-6">
              <label className="block mb-2 text-white font-extrabold text-xl">
                Select Job Designation
              </label>
              <select
                id="large-select"
                className="block w-full p-4 border border-white/10 rounded-lg bg-blue-900/30 text-xl text-white"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              >
                <option className="text-white font-extrabold" value="">Choose an option</option>
                <option value="Flight Cleaner">Flight Cleaner</option>
                <option value="Air Cabin Crew">Air Cabin Crew</option>
                <option value="First Class Pilot">First Class Pilot</option>
              </select>
              {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
            </div>

            {/* Description Field */}
            <div className="mb-6">
              <label className="block mb-2 text-xl font-extrabold text-white">Description</label>
              <input
                type="text"
                className="block w-full p-4 border border-white/10 rounded-lg bg-blue-900/30 text-base text-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add Your Job Description"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Salary Field */}
            <div className="mb-6">
              <label className="block mb-2 text-xl font-extrabold text-white">Salary</label>
              <input
                type="text"
                className="block w-full p-4 border border-white/10 rounded-lg bg-blue-900/30 text-base text-white"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Enter Salary"
              />
              {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
            </div>

            {/* Image Upload Field */}
            <label className="text-xl font-extrabold text-white">Add An Image</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-blue-950/30 hover:bg-blue-800/35">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
              </label>
              {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-blue-950 mt-10 w-28 h-12 hover:bg-blue-700/30 rounded-lg border border-blue-900 text-white font-extrabold"
            >
              Add
            </button>
          </form>

          {/* Image Preview Section */}
          {imagePreview && (
            <div className="flex-1 ml-4">
              <p className="text-white font-extrabold mb-2">Image Preview:</p>
              <img src={imagePreview} alt="Image preview" className="w-full h-auto rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AddJobs;
