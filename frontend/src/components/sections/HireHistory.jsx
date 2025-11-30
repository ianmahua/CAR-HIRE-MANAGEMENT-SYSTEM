import React, { useState } from 'react';
import { History, Search, Car, User, Calendar, DollarSign } from 'lucide-react';
import Card from '../base/Card';

const HireHistory = ({ rentals }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and validate rentals
  const validRentals = (rentals || []).filter(rental => {
    // Only show completed rentals, or rentals that have both start and end dates
    return rental && (
      rental.rental_status === 'Completed' || 
      (rental.start_date && rental.end_date && rental.rental_status !== 'Active' && rental.rental_status !== 'Pending')
    );
  });

  const filteredRentals = validRentals.filter(rental => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const vehiclePlate = rental.vehicle_ref?.license_plate?.toLowerCase() || '';
    const vehicleMake = rental.vehicle_ref?.make?.toLowerCase() || '';
    const vehicleModel = rental.vehicle_ref?.model?.toLowerCase() || '';
    const customerName = rental.customer_ref?.name?.toLowerCase() || '';
    const rentalId = rental.rental_id?.toLowerCase() || rental._id?.toString().toLowerCase() || '';
    
    return (
      vehiclePlate.includes(searchLower) ||
      vehicleMake.includes(searchLower) ||
      vehicleModel.includes(searchLower) ||
      customerName.includes(searchLower) ||
      rentalId.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Hire History</h2>
          <p className="text-gray-600">Complete record of all past rentals</p>
        </div>
        {filteredRentals.length > 0 && (
          <div className="bg-indigo-100 px-4 py-2 rounded-xl border-2 border-indigo-200">
            <p className="text-sm text-gray-600 font-semibold">Total Records</p>
            <p className="text-2xl font-bold text-indigo-600">{filteredRentals.length}</p>
          </div>
        )}
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, customer, or rental ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </Card>

      {/* History Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Vehicle</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Customer</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Start Date</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Return Date</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Duration</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRentals.map((rental, idx) => {
                const startDate = rental.start_date ? new Date(rental.start_date) : null;
                const endDate = rental.end_date ? new Date(rental.end_date) : null;
                const duration = startDate && endDate 
                  ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
                  : null;
                
                return (
                  <tr
                    key={rental._id || rental.rental_id || idx}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold">
                          {rental.vehicle_ref?.license_plate || 
                          (rental.vehicle_ref?.make && rental.vehicle_ref?.model
                            ? `${rental.vehicle_ref.make} ${rental.vehicle_ref.model}`
                            : 'N/A')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{rental.customer_ref?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {startDate ? startDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      {endDate ? endDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      {duration !== null ? (
                        <span className="font-bold text-emerald-600">
                          {duration} {duration === 1 ? 'day' : 'days'}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rental.rental_status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : rental.rental_status === 'Active'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {rental.rental_status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredRentals.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No rental history found</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HireHistory;

