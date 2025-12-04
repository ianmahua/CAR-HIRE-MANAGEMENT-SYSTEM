import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Car, User, Calendar, MapPin, DollarSign, Clock, UserCheck } from 'lucide-react';
import Card from '../base/Card';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ActiveRentals = ({ onBack }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActiveRentals();
  }, []);

  const fetchActiveRentals = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/driver/rentals/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setRentals(response.data.data || []);
      } else {
        setError('Failed to load active rentals');
      }
    } catch (err) {
      console.error('Error fetching active rentals:', err);
      setError(err.response?.data?.message || 'Failed to load active rentals');
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(rental => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customerName = rental.customer_ref?.name || '';
    const vehiclePlate = rental.vehicle_ref?.license_plate || '';
    const destination = rental.destination || '';
    const customerId = rental.customer_ref?.ID_number || '';

    return (
      customerName.toLowerCase().includes(searchLower) ||
      vehiclePlate.toLowerCase().includes(searchLower) ||
      destination.toLowerCase().includes(searchLower) ||
      customerId.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRented = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'KSh 0';
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Active Rentals</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading active rentals...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Active Rentals</h2>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={fetchActiveRentals}
              className="px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Active Rentals</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredRentals.length} active rental{filteredRentals.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, vehicle plate, destination, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>
      </Card>

      {/* Rentals List */}
      {filteredRentals.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No rentals match your search' : 'No active rentals found'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-brand-orange hover:underline font-semibold"
              >
                Clear search
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRentals.map((rental) => {
            const daysRented = calculateDaysRented(rental.start_date, rental.end_date);
            const isOverdue = new Date(rental.end_date) < new Date();
            
            return (
              <Card key={rental._id || rental.rental_id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-brand-orange to-orange-600 rounded-2xl text-white">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {rental.vehicle_ref?.license_plate || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {rental.vehicle_ref?.make || ''} {rental.vehicle_ref?.model || ''}
                          {rental.vehicle_ref?.year && ` (${rental.vehicle_ref.year})`}
                        </p>
                      </div>
                    </div>
                    {isOverdue && (
                      <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold border-2 border-red-200">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Customer Info */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <User className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Customer</p>
                        <p className="font-bold text-gray-900 truncate">{rental.customer_ref?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">ID: {rental.customer_ref?.ID_number || 'N/A'}</p>
                        {rental.customer_ref?.phone && (
                          <p className="text-xs text-gray-500 mt-1">{rental.customer_ref.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Rental Dates */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Rental Period</p>
                        <p className="text-sm font-semibold text-gray-900">
                          Start: {formatDate(rental.start_date)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          Return: {formatDate(rental.end_date)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {daysRented} day{daysRented !== 1 ? 's' : ''} rented
                        </p>
                      </div>
                    </div>

                    {/* Destination */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Destination</p>
                        <p className="font-semibold text-gray-900">{rental.destination || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Driver */}
                    {rental.driver_assigned && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <UserCheck className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Handed Out By</p>
                          <p className="font-semibold text-gray-900">{rental.driver_assigned?.name || 'N/A'}</p>
                          {rental.driver_assigned?.phone_msisdn && (
                            <p className="text-xs text-gray-600 mt-1">{rental.driver_assigned.phone_msisdn}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <DollarSign className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Pricing</p>
                        <p className="text-sm font-semibold text-gray-900">
                          Daily Rate: {formatCurrency(rental.vehicle_ref?.daily_rate)}
                        </p>
                        <p className="text-lg font-bold text-brand-orange mt-1">
                          Total: {formatCurrency(rental.total_fee_gross)}
                        </p>
                      </div>
                    </div>

                    {/* Rental ID */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Rental ID</p>
                        <p className="font-mono text-sm font-semibold text-gray-900">{rental.rental_id || rental._id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveRentals;




