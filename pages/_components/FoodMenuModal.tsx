'use client';
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, gql } from '@apollo/client';
import { RootState } from '../../redux/store';
import { addItem, removeItem } from '../../redux/slices/foodSlice';

const LIST_FOODS = gql`
  query {
    listFoods {
      id
      hotOrCold
      ImageUrl
      itemName
      price
      stock
      createdAt
    }
  }
`;

function FoodMenuModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    { id: number; name: string; price: number }[]
  >([]);
  const { loading, error, data } = useQuery(LIST_FOODS);
  const [foods, setFoods] = useState<any[]>([]);
  const selectedItem = useSelector((state: RootState) => state.food.selectedItems);
  const dispatch = useDispatch();

  const handleAddItem = (item: { id: number; name: string; price: number }) => {
    setSelectedItems([...selectedItems, item]);
    dispatch(addItem(item));
  };

  const handleRemoveItem = (id: number) => {
    const updatedItems = selectedItems.filter((item) => item.id !== id);
    setSelectedItems(updatedItems);
    dispatch(removeItem(id)); // Make sure your slice supports removing items by id
  };

  const handleCloseModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (data) {
      setFoods(data.listFoods);
    }
  }, [data]);

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition"
      >
        Show Food Menu
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        className="custom-modal"
        overlayClassName="custom-overlay"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Food Menu</h2>

          {loading && <p>Loading...</p>}
          {error && <p>Error loading menu</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {foods.map((item) => (
              <div
                key={item.id}
                className="rounded-lg overflow-hidden bg-blue-900/15 shadow-lg hover:shadow-xl transition"
              >
                <img
                  src={item.ImageUrl}
                  alt={item.itemName}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg text-white font-extrabold">
                    {item.itemName}
                  </h3>
                  <p className="text-white font-extrabold text-sm mb-2">
                    ${item.price?.toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Available: {item.stock > 0 ? 'Yes' : 'No'}
                  </p>
                  <button
                    onClick={() =>
                      handleAddItem({
                        id: item.id,
                        name: item.itemName,
                        price: item.price,
                      })
                    }
                    className="mt-2 px-3 py-1 bg-green-600 text-white font-extrabold rounded hover:bg-green-700 transition"
                  >
                    Add to Order
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold">Selected Items:</h3>
            {selectedItems.length > 0 ? (
              <ul className="text-left mt-4 space-y-2">
                {selectedItems.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>${item.price}</span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="ml-4 px-2 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 mt-4">No items selected.</p>
            )}
          </div>

          <button
            onClick={handleCloseModal}
            className="mt-8 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Close
          </button>
        </div>
      </Modal>

      <style jsx>{`
        .custom-modal {
          position: absolute;
          top: 50%;
          left: 50%;
          right: auto;
          bottom: auto;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
        }
        .custom-overlay {
          background: rgba(0, 0, 0, 0.75);
        }
      `}</style>
    </div>
  );
}

export default FoodMenuModal;
