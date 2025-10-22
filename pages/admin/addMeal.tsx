import React, { ChangeEvent, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

interface S3UploadResponse {
  uploadUrl: string;
  key: string;
}
interface FoodImage {
  SaveImage: {
    imageUrl: string;
  };
}

function AddMeal() {
  const AdminNavbar = dynamic(() => import('../_components/AdminNavbar'));
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [itemName, setItemName] = useState('');
  const [stock, setStock] = useState(0);
  const [foodType, setFoodType] = useState('');
  const [price, setPrice] = useState(0);
  const [foodImage, setFoodImage] = useState<FoodImage | null>(null);

  const [itemNameError, setItemNameError] = useState('');
  const [stockError, setStockError] = useState('');
  const [foodTypeError, setFoodTypeError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [imageError, setImageError] = useState('');

  const router = useRouter();
  const token = Cookies.get('adminaccessToken');

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      router.push('/admin/signin');
    }
  }, [token, router]);

  // Validation function
  const validateFields = (): boolean => {
    let isValid = true;

    if (!itemName) {
      setItemNameError('Item Name is required');
      isValid = false;
    } else {
      setItemNameError('');
    }

    if (!stock || stock <= 0) {
      setStockError('Stock must be greater than zero');
      isValid = false;
    } else {
      setStockError('');
    }

    if (!foodType) {
      setFoodTypeError('Please select a Food Type');
      isValid = false;
    } else {
      setFoodTypeError('');
    }

    if (!price || price <= 0) {
      setPriceError('Price must be greater than zero');
      isValid = false;
    } else {
      setPriceError('');
    }

    if (!image) {
      setImageError('Please upload an image');
      isValid = false;
    } else {
      setImageError('');
    }

    return isValid;
  };

  const handleAddMeal = async (imageUrl: string) => {
    try {
      const mealData = {
        itemName,
        stock,
        hotOrCold: foodType,
        ImageUrl: imageUrl, // Use the passed imageUrl
        price,
      };
  
      await axios.post('/api/addMeal', mealData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      Swal.fire('Success!', 'Meal added successfully!', 'success').then(() => {
        router.push('/admin/menu');
      });
    } catch (error) {
      console.error('Error adding meal:', error);
      Swal.fire('Error!', 'There was an error adding the meal', 'error');
    }
  };
  

  const handleUploadToS3 = async () => {
    if (!validateFields()) return;
  
    const fileType = encodeURIComponent(image?.type || '');
  
    try {
      setUploading(true);
  
      // Step 1: Get the S3 upload URL
      const { data } = await axios.get<S3UploadResponse>(`/api/media?fileType=${fileType}`);
      const { uploadUrl, key } = data;
  
      // Step 2: Upload the file to S3
      await axios.put(uploadUrl, image);
  
      // Step 3: Save the image URL in your database
      const formatedImage = { imageUrl: `https://airline-datace.s3.ap-south-1.amazonaws.com/${key}` };
      const response = await axios.post('/api/saveCloud', formatedImage, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      setFoodImage(response.data); // Update the state
  
      // Step 4: Wait for the state to be updated before calling handleAddMeal
      setUploading(false);
      Swal.fire('Uploaded!', 'Image uploaded successfully', 'success').then(() => {
        handleAddMeal(response.data.SaveImage.imageUrl); // Pass the image URL directly
      });
    } catch (error) {
      console.error('Error during upload:', error);
      setUploading(false);
      Swal.fire('Error!', 'Error uploading the image', 'error');
    }
  };
  

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFoodType(e.target.value);
  };

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: 'url(\'/admin-bg.png\')',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  };

  const formContainerStyle: React.CSSProperties = {
    width: '80%',
    maxWidth: '600px',
    padding: '20px',
  };

  return (
    <div style={backgroundStyle}>
    <AdminNavbar />
    <div className="flex w-4/5 max-w-screen-lg items-start justify-between">
      {/* Form Section */}
      <div style={formContainerStyle} className="w-3/5">
        {/* Item Name */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-extrabold text-white">Item Name</label>
          <input
            type="text"
            onChange={(e) => setItemName(e.target.value)}
            className="block w-full p-4 text-white font-extrabold border border-white/10 rounded-lg bg-blue-900/30"
          />
          {itemNameError && <p className="text-red-500 text-sm mt-1">{itemNameError}</p>}
        </div>

        {/* Stock */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-extrabold text-white">Stock</label>
          <input
            type="number"
            onChange={(e) => setStock(Number(e.target.value))}
            className="block w-full p-4 text-white font-extrabold border border-white/10 rounded-lg bg-blue-900/30"
          />
          {stockError && <p className="text-red-500 text-sm mt-1">{stockError}</p>}
        </div>

        {/* Price */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-extrabold text-white">Price</label>
          <input
            type="number"
            onChange={(e) => setPrice(Number(e.target.value))}
            className="block w-full p-4 text-white font-extrabold border border-white/10 rounded-lg bg-blue-900/30"
          />
          {priceError && <p className="text-red-500 text-sm mt-1">{priceError}</p>}
        </div>

        {/* Food Type */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-extrabold text-white">Food Type</label>
          <select
            value={foodType}
            onChange={handleTemperatureChange}
            className="block w-full p-4 text-white border border-white/10 rounded-lg bg-blue-900/30"
          >
            <option value="">Select Temperature</option>
            <option value="hot">Hot</option>
            <option value="cold">Cold</option>
          </select>
          {foodTypeError && <p className="text-red-500 text-sm mt-1">{foodTypeError}</p>}
        </div>

        {/* File Upload */}
        <div className="flex items-center justify-center w-full mb-6">
          <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-blue-950/30 hover:bg-blue-800/35">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload an image</p>
            </div>
            <input onChange={handleFileChange} type="file" className="hidden" />
          </label>
        </div>
        {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}

        {/* Submit Button */}
        <button onClick={handleUploadToS3} className="bg-blue-950 mt-6 w-28 h-12 hover:bg-blue-700/30 rounded-lg text-white font-extrabold">
          {uploading ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Image Preview Section */}
      <div className="w-2/5 mt-40 flex justify-center items-center">
        {image ? (
          <img
            className="rounded-lg shadow-lg w-64 h-64 object-cover"
            src={URL.createObjectURL(image)}
            alt="Preview"
          />
        ) : (
          <p className="text-gray-500 text-sm">Image preview will appear here</p>
        )}
      </div>
    </div>
  </div>
  );
}

export default AddMeal;
