import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Search, AlertCircle } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';
import BookingCard from './BookingCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BookingsList = ({ onCreateBooking }) => {
  const [activeTab, setActiveTab] = useState('future'); // 'future' | 'past'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_URL}/api/driver/bookings?filter=${activeTab}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch bookings');
      }
      setBookings(data.data || []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.customerPhone?.toLowerCase().includes(q) ||
      b.customerIdNumber?.toLowerCase().includes(q)
    );
  });

  // Edit modal helpers
  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      customerName: booking.customerName || '',
      customerIdNumber: booking.customerIdNumber || '',
      customerPhone: booking.customerPhone || '',
      customerEmail: booking.customerEmail || '',
      vehicleMake: booking.vehicleMake || '',
      vehicleModel: booking.vehicleModel || '',
      bookingDate: booking.bookingDate
        ? new Date(booking.bookingDate).toISOString().split('T')[0]
        : '',
      numberOfDays: booking.numberOfDays || 1,
      destination: booking.destination || '',
      dailyRate: booking.dailyRate || 0,
      notes: booking.notes || '',
      status: booking.status || 'pending'
    });
    setEditErrors({});
  };

  const closeEditModal = () => {
    setEditingBooking(null);
    setEditForm({});
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateEdit = () => {
    const newErrors = {};
    const f = editForm;
    if (!f.customerName) newErrors.customerName = 'Required';
    if (!f.customerIdNumber) newErrors.customerIdNumber = 'Required';
    if (!f.customerPhone) newErrors.customerPhone = 'Required';
    if (!f.customerEmail) newErrors.customerEmail = 'Required';
    if (!f.vehicleMake) newErrors.vehicleMake = 'Required';
    if (!f.vehicleModel) newErrors.vehicleModel = 'Required';
    if (!f.bookingDate) newErrors.bookingDate = 'Required';
    if (!f.numberOfDays) newErrors.numberOfDays = 'Required';
    if (!f.destination) newErrors.destination = 'Required';
    if (!f.dailyRate) newErrors.dailyRate = 'Required';

    const phoneRegex = /^\+?\d{9,15}$/;
    if (f.customerPhone && !phoneRegex.test(String(f.customerPhone))) {
      newErrors.customerPhone = 'Invalid phone number';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (f.customerEmail && !emailRegex.test(String(f.customerEmail))) {
      newErrors.customerEmail = 'Invalid email';
    }

    if (f.bookingDate) {
      const start = new Date(f.bookingDate);
      if (isNaN(start.getTime())) {
        newErrors.bookingDate = 'Invalid date';
      }
    }

    const days = Number(f.numberOfDays);
    if (Number.isNaN(days) || days <= 0) {
      newErrors.numberOfDays = 'Must be greater than 0';
    }

    const rate = Number(f.dailyRate);
    if (Number.isNaN(rate) || rate < 0) {
      newErrors.dailyRate = 'Must be non-negative';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    if (!validateEdit()) return;

    try {
      setEditSubmitting(true);
      const res = await fetch(
        `${API_URL}/api/driver/bookings/${editingBooking._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...editForm,
            numberOfDays: Number(editForm.numberOfDays),
            dailyRate: Number(editForm.dailyRate)
          })
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update booking');
      }
      closeEditModal();
      fetchBookings();
    } catch (err) {
      console.error('Update booking error:', err);
      setEditErrors((prev) => ({
        ...prev,
        form: err.message || 'Failed to update booking'
      }));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const reason = window.prompt(
      `Cancel booking for ${booking.customerName}? Please enter a reason:`
    );
    if (reason === null) return; // user cancelled prompt

    try {
      const res = await fetch(
        `${API_URL}/api/driver/bookings/${booking._id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ reason })
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel booking');
      }
      fetchBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const handleConfirmBooking = async (booking) => {
    try {
      const res = await fetch(
        `${API_URL}/api/driver/bookings/${booking._id}/confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to confirm booking');
      }
      fetchBookings();
    } catch (err) {
      console.error('Confirm booking error:', err);
      alert(err.message || 'Failed to confirm booking');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            Bookings
          </h2>
          <p className="text-gray-600">
            Manage future and past client bookings
          </p>
        </div>
        <Button variant="primary" onClick={onCreateBooking}>
          <Plus className="w-5 h-5 mr-2" />
          Create Booking
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'future'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('future')}
        >
          Future Bookings
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past Bookings
        </button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <Card>
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-semibold">
              Loading bookings...
            </p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="py-8 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {activeTab === 'future'
                ? 'No future bookings found'
                : 'No past bookings found'}
            </p>
            {activeTab === 'future' && (
              <Button variant="primary" onClick={onCreateBooking}>
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Booking
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onEdit={openEditModal}
              onCancel={handleCancelBooking}
              onConfirm={handleConfirmBooking}
            />
          ))}
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Edit Booking
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {editingBooking.customerName}
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-4">
              {editErrors.form && (
                <p className="text-sm text-red-600">{editErrors.form}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={editForm.customerName || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.customerName
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.customerName && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.customerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    name="customerIdNumber"
                    value={editForm.customerIdNumber || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.customerIdNumber
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.customerIdNumber && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.customerIdNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={editForm.customerPhone || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.customerPhone
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.customerPhone && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.customerPhone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={editForm.customerEmail || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.customerEmail
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.customerEmail && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.customerEmail}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Vehicle Make *
                  </label>
                  <input
                    type="text"
                    name="vehicleMake"
                    value={editForm.vehicleMake || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.vehicleMake
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.vehicleMake && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.vehicleMake}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Vehicle Model *
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={editForm.vehicleModel || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.vehicleModel
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.vehicleModel && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.vehicleModel}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    name="bookingDate"
                    value={editForm.bookingDate || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.bookingDate
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.bookingDate && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.bookingDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Number of Days *
                  </label>
                  <input
                    type="number"
                    name="numberOfDays"
                    min="1"
                    value={editForm.numberOfDays || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.numberOfDays
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.numberOfDays && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.numberOfDays}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Daily Rate (KES) *
                  </label>
                  <input
                    type="number"
                    name="dailyRate"
                    min="0"
                    value={editForm.dailyRate || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.dailyRate
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.dailyRate && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.dailyRate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={editForm.destination || ''}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-orange ${
                      editErrors.destination
                        ? 'border-rose-500'
                        : 'border-gray-200'
                    }`}
                  />
                  {editErrors.destination && (
                    <p className="text-xs text-rose-600 mt-1">
                      {editErrors.destination}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={editForm.notes || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;





