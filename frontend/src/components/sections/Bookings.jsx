import React, { useState } from 'react';
import { Calendar, Plus, Clock, DollarSign, Car, User } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';

const Bookings = ({ bookings, onCreateBooking }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.customer_name?.toLowerCase().includes(searchLower) ||
      booking.license_plate?.toLowerCase().includes(searchLower) ||
      booking.booking_id?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
      'Confirmed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Active': 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Future Bookings</h2>
          <p className="text-gray-600">Manage scheduled client bookings</p>
        </div>
        <Button variant="success" onClick={onCreateBooking}>
          <Plus className="w-5 h-5 mr-2" />
          Create Booking
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking, idx) => {
          const startDate = new Date(booking.start_date);
          const endDate = new Date(booking.end_date);
          const daysUntil = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24));
          
          return (
            <Card key={booking.booking_id || booking._id || idx}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{booking.customer_name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">{booking.license_plate || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadge(booking.rental_status || booking.status)}`}>
                  {booking.rental_status || booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Start Date</p>
                  <p className="font-bold text-gray-900">{startDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">End Date</p>
                  <p className="font-bold text-gray-900">{endDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Duration</p>
                  <p className="font-bold text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Amount</p>
                  <p className="font-bold text-emerald-600">
                    KES {(booking.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {daysUntil >= 0 && daysUntil <= 2 && (
                <div className={`p-3 rounded-2xl ${daysUntil === 0 ? 'bg-amber-50 border-2 border-amber-200' : 'bg-indigo-50 border-2 border-indigo-200'}`}>
                  <p className="text-sm font-semibold">
                    {daysUntil === 0 ? '⚠️ Booking starts TODAY' : `⏰ Booking starts in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No bookings found</p>
            <Button variant="success" onClick={onCreateBooking}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Booking
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Bookings;

