import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VehiclesDue = ({ onClick }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayCount, setTodayCount] = useState(0);
  const [tomorrowCount, setTomorrowCount] = useState(0);

  useEffect(() => {
    fetchDueRentals();
  }, []);

  const fetchDueRentals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/driver/rentals/due`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTodayCount(response.data.todayCount || 0);
        setTomorrowCount(response.data.tomorrowCount || 0);
        setError(null);
      } else {
        setError('Failed to fetch due rentals');
      }
    } catch (err) {
      console.error('Error fetching due rentals:', err);
      setError(err.response?.data?.message || 'Failed to fetch due rentals');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = todayCount + tomorrowCount;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6">
        <p className="text-white text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium mb-1">Vehicles Due</p>
          <h3 className="text-4xl font-bold text-white">{totalCount}</h3>
          <p className="text-white text-sm mt-2">
            Today: {todayCount} | Tomorrow: {tomorrowCount}
          </p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full p-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VehiclesDue;
