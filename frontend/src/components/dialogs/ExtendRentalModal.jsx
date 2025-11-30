import React, { useState, useEffect } from 'react';
import Modal from '../base/Modal';
import Button from '../base/Button';
import { Calendar, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ExtendRentalModal = ({ isOpen, onClose, rental, onSuccess }) => {
  const [extensionDays, setExtensionDays] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Calculate extension cost
  useEffect(() => {
    if (extensionDays && rental?.daily_rate) {
      setPaymentAmount(parseFloat(extensionDays) * rental.daily_rate);
    } else if (extensionDays && rental?.vehicle_ref?.daily_rate) {
      setPaymentAmount(parseFloat(extensionDays) * rental.vehicle_ref.daily_rate);
    } else {
      setPaymentAmount(0);
    }
  }, [extensionDays, rental]);

  const calculateNewEndDate = () => {
    if (!rental?.end_date || !extensionDays) return null;
    const currentEndDate = new Date(rental.end_date);
    currentEndDate.setDate(currentEndDate.getDate() + parseInt(extensionDays));
    return currentEndDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!extensionDays || extensionDays < 1) {
      toast.error('Please enter valid extension days');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const bookingId = rental.booking_id || rental._id || rental.rental_id;

      const response = await axios.post(
        `${API_URL}/api/bookings/${bookingId}/extend`,
        {
          extension_days: parseInt(extensionDays),
          payment_status: paymentStatus,
          extension_amount: paymentAmount
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Rental period extended successfully!');
        onSuccess && onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Error extending rental:', error);
      toast.error(error.response?.data?.message || 'Failed to extend rental');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExtensionDays('');
    setPaymentStatus('Paid');
    setPaymentAmount(0);
    onClose();
  };

  if (!isOpen || !rental) return null;

  const dailyRate = rental?.daily_rate || rental?.vehicle_ref?.daily_rate || 0;
  const newEndDate = calculateNewEndDate();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Client Extending Rental</h2>
              <button onClick={handleClose} className="text-white hover:text-gray-200">
                <X size={28} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Booking Info */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="font-bold text-gray-900 text-lg mb-2">
                {rental.vehicle_ref?.license_plate || rental.licensePlate || 'N/A'} - {rental.customer_ref?.name || rental.customerName || 'Unknown'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Original Period</p>
                  <p className="font-semibold text-gray-900">
                    {Math.ceil((new Date(rental.end_date) - new Date(rental.start_date || rental.startDate)) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Daily Rate</p>
                  <p className="font-semibold text-green-600">
                    KES {dailyRate.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Extension Days */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                How many more days? <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                placeholder="Enter number of days"
                min="1"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
              />
            </div>

            {/* Extension Cost Display */}
            {extensionDays > 0 && paymentAmount > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-1">Extension Cost</p>
                <p className="text-3xl font-bold text-green-600">
                  KES {paymentAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ({extensionDays} days × KES {dailyRate.toLocaleString()})
                </p>
              </div>
            )}

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Has the client paid? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Paid')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentStatus === 'Paid'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle size={24} className="mx-auto mb-2" />
                  <p className="font-semibold">Paid</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pending')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentStatus === 'Pending'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Clock size={24} className="mx-auto mb-2" />
                  <p className="font-semibold">Pending</p>
                </button>
              </div>
            </div>

            {/* Warning for Pending Payment */}
            {paymentStatus === 'Pending' && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-orange-600" size={24} />
                  <div>
                    <p className="font-semibold text-orange-900">Payment Pending</p>
                    <p className="text-sm text-orange-700">
                      This will be tracked as pending payment. Follow up with customer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* New Return Date */}
            {newEndDate && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">New Return Date</p>
                <p className="text-lg font-bold text-blue-600">
                  {newEndDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !extensionDays}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {loading ? 'Processing...' : 'Confirm Extension'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExtendRentalModal;

