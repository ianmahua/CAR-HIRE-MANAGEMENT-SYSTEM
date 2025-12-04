import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Car, User, Phone, Clock, Calendar, MapPin } from 'lucide-react';
import Card from '../base/Card';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VehiclesDueSoon = ({ onBack }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDueSoonRentals();
  }, []);

  const fetchDueSoonRentals = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/driver/rentals/due-soon`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setRentals(response.data.data || []);
      } else {
        setError('Failed to load vehicles due soon');
      }
    } catch (err) {
      console.error('Error fetching due-soon rentals:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles due soon');
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(rental => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const customerName = rental.customer_ref?.name || '';
    const customerPhone = rental.customer_ref?.phone || '';
    const vehiclePlate = rental.vehicle_ref?.license_plate || '';
    const destination = rental.destination || '';

    return (
      customerName.toLowerCase().includes(searchLower) ||
      customerPhone.toLowerCase().includes(searchLower) ||
      vehiclePlate.toLowerCase().includes(searchLower) ||
      destination.toLowerCase().includes(searchLower)
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

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h2 className="text-3xl font-bold text-gray-900">Vehicles Due Soon</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading vehicles due soon...</p>
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
          <h2 className="text-3xl font-bold text-gray-900">Vehicles Due Soon</h2>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={fetchDueSoonRentals}
              className="px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Vehicles Due Soon
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredRentals.length} vehicle{filteredRentals.length !== 1 ? 's' : ''} due back tomorrow
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card hover={false}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, vehicle plate, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </Card>

      {/* Rentals List */}
      {filteredRentals.length === 0 ? (
        <Card hover={false}>
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No vehicles match your search' : 'No vehicles due back tomorrow'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-amber-600 hover:underline font-semibold"
              >
                Clear search
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRentals.map((rental) => {
            const plate = rental.vehicle_ref?.license_plate || 'N/A';
            const customerName = rental.customer_ref?.name || 'N/A';
            const daysRemaining = rental.days_remaining ?? 1;

            return (
              <Card
                key={rental._id || rental.rental_id}
                className="hover:shadow-lg transition-shadow border border-amber-200 bg-amber-50/60"
                hover={false}
              >
                <div className="p-6 space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {plate}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {rental.vehicle_ref?.make || ''}{' '}
                          {rental.vehicle_ref?.model || ''}
                          {rental.vehicle_ref?.year && ` (${rental.vehicle_ref.year})`}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 text-amber-800 border-amber-200">
                      {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Customer Info */}
                    <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
                      <User className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Customer</p>
                        <p className="font-bold text-gray-900 truncate">
                          {customerName}
                        </p>
                        {rental.customer_ref?.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {rental.customer_ref.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expected Return */}
                    <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
                      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Expected Return</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(rental.expected_return_time || rental.end_date)}
                        </p>
                        <p className="text-sm text-gray-700">
                          {formatTime(rental.expected_return_time || rental.end_date)}
                        </p>
                      </div>
                    </div>

                    {/* Destination */}
                    <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
                      <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Destination</p>
                        <p className="font-semibold text-gray-900">
                          {rental.destination || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Rental Duration */}
                    <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
                      <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Rental Duration</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {rental.duration_days || '-'} day{rental.duration_days !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          From {formatDate(rental.start_date)} to {formatDate(rental.end_date)}
                        </p>
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

export default VehiclesDueSoon;





