import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Car, Filter, Wrench, DollarSign, Calendar, Gauge } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AvailableVehicles = ({ onBack, onHireOut }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rateRange, setRateRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAvailableVehicles();
  }, []);

  const fetchAvailableVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/driver/vehicles/available`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setVehicles(response.data.data || []);
      } else {
        setError('Failed to load available vehicles');
      }
    } catch (err) {
      console.error('Error fetching available vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load available vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        vehicle.license_plate?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && vehicle.category !== categoryFilter) {
      return false;
    }

    // Rate range filter
    if (rateRange.min && vehicle.daily_rate < parseFloat(rateRange.min)) {
      return false;
    }
    if (rateRange.max && vehicle.daily_rate > parseFloat(rateRange.max)) {
      return false;
    }

    return true;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'KSh 0';
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatMileage = (mileage) => {
    if (!mileage) return 'N/A';
    return `${mileage.toLocaleString('en-KE')} km`;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Economy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Executive':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleHireOut = (vehicle) => {
    if (onHireOut) {
      onHireOut(vehicle);
    }
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
          <h2 className="text-3xl font-bold text-gray-900">Available Vehicles</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading available vehicles...</p>
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
          <h2 className="text-3xl font-bold text-gray-900">Available Vehicles</h2>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={fetchAvailableVehicles}
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Vehicles</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by plate number, make, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="font-semibold">Filters</span>
            {showFilters && <span className="text-xs text-gray-500">(Click to hide)</span>}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors"
                >
                  <option value="all">All Types</option>
                  <option value="Economy">Economy</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              {/* Rate Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Daily Rate Range (KSh)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={rateRange.min}
                    onChange={(e) => setRateRange({ ...rateRange, min: e.target.value })}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={rateRange.max}
                    onChange={(e) => setRateRange({ ...rateRange, max: e.target.value })}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm || categoryFilter !== 'all' || rateRange.min || rateRange.max
                ? 'No vehicles match your filters'
                : 'No available vehicles found'}
            </p>
            {(searchTerm || categoryFilter !== 'all' || rateRange.min || rateRange.max) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setRateRange({ min: '', max: '' });
                }}
                className="text-brand-orange hover:underline font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle._id || vehicle.vehicle_id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Vehicle Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-brand-orange to-orange-600 rounded-2xl text-white">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {vehicle.license_plate || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {vehicle.make || ''} {vehicle.model || ''}
                        {vehicle.year && ` (${vehicle.year})`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getCategoryColor(vehicle.category)}`}>
                    {vehicle.category || 'N/A'}
                  </span>
                </div>

                {/* Vehicle Details */}
                <div className="space-y-3 mb-6">
                  {/* Daily Rate */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <DollarSign className="w-5 h-5 text-brand-orange flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Daily Rate</p>
                      <p className="font-bold text-gray-900">{formatCurrency(vehicle.daily_rate)}</p>
                    </div>
                  </div>

                  {/* Current Mileage */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Gauge className="w-5 h-5 text-brand-orange flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Current Mileage</p>
                      <p className="font-semibold text-gray-900">{formatMileage(vehicle.current_mileage)}</p>
                    </div>
                  </div>

                  {/* Last Service */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Wrench className="w-5 h-5 text-brand-orange flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Last Service</p>
                      <p className="font-semibold text-gray-900">{formatDate(vehicle.last_service_date)}</p>
                    </div>
                  </div>

                  {/* Next Service Due */}
                  {vehicle.next_service_due && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-brand-orange flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Next Service Due</p>
                        <p className="font-semibold text-gray-900">{formatDate(vehicle.next_service_due)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hire Out Button */}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleHireOut(vehicle)}
                >
                  <Car className="w-5 h-5 mr-2" />
                  Hire Out
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableVehicles;




