'use client';

import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import Cookies from 'js-cookie';
import axios from 'axios';

export default function WalletModal({ isOpen, onClose }) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState(null);
  const [currentPage, setCurrentPage] = useState(0); // New state for pagination
  const transactionsPerPage = 3; // Number of transactions to display per page
  const userId = Cookies.get('userId');

  // Fetch wallet balance and transactions
  useEffect(() => {
    const fetchTransactions = async () => {     
      try {
        const response = await axios.post('/api/transactionHistory', { userId }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setTransactions(response.data.ListTransactions); // Access ListTransactions array
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      }
    };

    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  useEffect(() => {
    const fetchBalance = async () => {     
      try {
        const response = await axios.post('/api/getWallet', { userId }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setBalance(response.data.walletBalance); // Access ListTransactions array
        console.log(response.data.walletBalance);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      }
    };

    if (userId) {
      fetchBalance();
    }
  }, [userId]);


  // Handle withdraw


  // Toggle showing transactions
  const toggleTransactions = () => {
    setShowTransactions(!showTransactions);
  };

  // Pagination: Calculate start and end index for the current page
  const startIndex = currentPage * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = transactions ? transactions.slice(startIndex, endIndex) : [];

  // Handle pagination
  const handleNextPage = () => {                  
    if (endIndex < transactions.length) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  if (!isOpen) return null; // Don't render modal if it's not open

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2 text-xl font-bold mb-1">
            <Wallet className="h-6 w-6" />
            My Wallet
          </div>
          <p className="text-sm text-gray-500 mb-6">Manage your funds and transactions</p>

          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-4xl font-bold">₹{balance.toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            
                                                                          
          </div>

          {/* Toggle button for transactions */}
          <div className="mt-6">
            <button
              onClick={toggleTransactions}
              className="flex items-center justify-center w-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md"
            >
              {showTransactions ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" /> Hide Transactions
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" /> Show Transactions
                </>
              )}
            </button>
          </div>

          {/* Conditionally render paginated transactions */}
          {showTransactions && paginatedTransactions.length > 0 ? (
            <div className="mt-4 space-y-4">
              <h3 className="text-lg font-bold text-gray-700">Transaction History</h3>
              <ul className="space-y-2">
                {paginatedTransactions.map((transaction, index) => (
                  <li key={transaction.transactionId} className="flex justify-between items-center">
                    <span className={`text-sm ${transaction.transactionType === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1)}
                    </span>
                    <span className="text-sm font-medium">₹{transaction.amount.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>

              {/* Pagination controls */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className={`text-sm font-medium ${currentPage === 0 ? 'text-gray-300' : 'text-blue-600'}`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={endIndex >= transactions.length}
                  className={`text-sm font-medium ${endIndex >= transactions.length ? 'text-gray-300' : 'text-blue-600'}`}
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            showTransactions && <p className="mt-4 text-sm text-gray-500">No transactions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}