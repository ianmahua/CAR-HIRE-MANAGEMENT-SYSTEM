import React, { useState } from 'react';
import { Car, Search, Calendar, DollarSign, User, MapPin } from 'lucide-react';
import Card from '../base/Card';

const VehicleRecords = ({ vehicle, rentals = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!vehicle) {
    return (
      <Card>
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Select a vehicle to view records</p>
        </div>
      </Card>
    );
  }

  const vehicleRentals = rentals.filter(r => 
    r.vehicle_ref?._id === vehicle._id || 
    r.vehicle_ref === vehicle._id ||
    r.vehicle_id === vehicle.vehicle_id
  );

  const filteredRentals = vehicleRentals.filter(rental => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rental.customer_ref?.name?.toLowerCase().includes(searchLower) ||
      rental.rental_id?.toLowerCase().includes(searchLower) ||
      rental.destination?.toLowerCase().includes(searchLower)
    );
  });

  const totalRevenue = vehicleRentals.reduce((sum, r) => sum + (r.total_fee_gross || r.total_amount || 0), 0);
  const totalRentals = vehicleRentals.length;

  return (
    <div className="space-y-6">
      {/* Vehicle Header */}
      <Card className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-white/20 rounded-3xl backdrop-blur-sm">
            <Car className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{vehicle.license_plate}</h2>
            <p className="text-indigo-100 text-lg">
              {vehicle.make} {vehicle.model} • {vehicle.year} • {vehicle.category}
            </p>
            <p className="text-indigo-100 mt-2">
              Daily Rate: KES {vehicle.daily_rate?.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-indigo-600">{totalRentals}</p>
            <p className="text-sm text-gray-600">Total Rentals</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-600">KES {totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Car className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-amber-600">
              {vehicle.availability_status}
            </p>
            <p className="text-sm text-gray-600">Current Status</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rental history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </Card>

      {/* Rental History */}
      <div className="space-y-4">
        {filteredRentals.length > 0 ? (
          filteredRentals.map((rental, idx) => (
            <Card key={idx}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {rental.customer_ref?.name || rental.customer_name || 'Unknown Customer'}
                    </h3>
                    <p className="text-sm text-gray-600">Rental ID: {rental.rental_id || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  rental.rental_status === 'Completed' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : rental.rental_status === 'Active'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {rental.rental_status || 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Start Date</p>
                  <p className="font-semibold text-gray-900">
                    {rental.start_date ? new Date(rental.start_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Return Date</p>
                  <p className="font-semibold text-gray-900">
                    {rental.end_date ? new Date(rental.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Destination
                  </p>
                  <p className="font-semibold text-gray-900">{rental.destination || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Revenue</p>
                  <p className="font-bold text-emerald-600">
                    KES {(rental.total_fee_gross || rental.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {rental.dispatched_by && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Dispatched by: <span className="font-semibold">{rental.dispatched_by}</span>
                  </p>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No rental history found</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VehicleRecords;

