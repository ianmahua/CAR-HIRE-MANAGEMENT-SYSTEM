import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Search, Car } from 'lucide-react';
import { toast } from 'react-toastify';
import VehicleCalendar from '../../components/sections/VehicleCalendar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function VehicleRecords() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle =>
        vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [searchTerm, vehicles]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setVehicles(data.data || []);
        setFilteredVehicles(data.data || []);
      } else {
        toast.error('Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Available: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Available' },
      Rented: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Rented Out' },
      'Under Maintenance': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'In Garage' },
      'Out of Service': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', label: 'Out of Service' }
    };

    const style = statusMap[status] || statusMap['Available'];
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text} border ${style.border}`}>
        {style.label}
      </span>
    );
  };

  if (selectedVehicle) {
    return (
      <VehicleCalendar
        vehicle={selectedVehicle}
        onBack={() => setSelectedVehicle(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Records</h1>
        <p className="text-gray-600">View detailed calendar records for each vehicle</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by plate number, make, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle Grid */}
      {!loading && filteredVehicles.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No vehicles found matching your search' : 'No vehicles available'}
          </p>
        </div>
      )}

      {!loading && filteredVehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(vehicle => (
            <div
              key={vehicle._id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Vehicle Image/Icon */}
              <div className="h-40 bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-blue-200 transition-all">
                <Car className="w-20 h-20 text-indigo-600" />
              </div>

              {/* Vehicle Info */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {vehicle.license_plate || 'N/A'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {vehicle.make} {vehicle.model}
                </p>

                {/* Status Badge */}
                <div className="mb-4">
                  {getStatusBadge(vehicle.current_status)}
                </div>

                {/* View Calendar Button */}
                <button
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="w-full bg-gradient-to-r from-brand-orange to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-brand-orange/90 hover:to-orange-600/90 transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  <Calendar className="w-5 h-5" />
                  View Calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


