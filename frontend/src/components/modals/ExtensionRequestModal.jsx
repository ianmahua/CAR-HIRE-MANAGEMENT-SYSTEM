import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../base/Button';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ExtensionRequestModal = ({ rental, onClose, onSuccess }) => {
  const [additionalDays, setAdditionalDays] = useState('');
  const [newDailyRate, setNewDailyRate] = useState(rental?.daily_rate || '');
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);

  // Calculate new total cost
  const extensionAmount = additionalDays && newDailyRate 
    ? parseInt(additionalDays) * parseFloat(newDailyRate)
    : 0;

  const currentEndDate = rental?.end_date ? new Date(rental.end_date) : new Date();
  const newEndDate = additionalDays 
    ? new Date(currentEndDate.getTime() + parseInt(additionalDays) * 24 * 60 * 60 * 1000)
    : currentEndDate;

  useEffect(() => {
    // Auto-fill payment amount with extension amount
    if (extensionAmount > 0) {
      setPaymentAmount(extensionAmount.toString());
    }
  }, [extensionAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!additionalDays || parseInt(additionalDays) <= 0) {
      toast.error('Please enter a valid number of additional days');
      return;
    }

    if (!hasPaid) {
      toast.error('Please confirm that the customer has paid');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/driver/rentals/${rental._id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          additionalDays: parseInt(additionalDays),
          newDailyRate: parseFloat(newDailyRate),
          paymentAmount: parseFloat(paymentAmount),
          paymentMethod,
          hasPaid
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to extend rental');
      }

      toast.success('Rental extended successfully!');
      if (onSuccess) {
        onSuccess(data.data);
      }
      onClose();
    } catch (error) {
      console.error('Error extending rental:', error);
      toast.error(error.message || 'Failed to extend rental');
    } finally {
      setLoading(false);
    }
  };

  if (!rental) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Request Rental Extension</h2>
            <p className="text-purple-100 text-sm mt-1">
              {rental.vehicle_ref?.license_plate || 'Vehicle'} - {rental.customer_ref?.name || 'Customer'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Rental Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">Current Rental Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current End Date</p>
              <p className="font-semibold text-gray-900">
                {currentEndDate.toLocaleDateString()} at {currentEndDate.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Daily Rate</p>
              <p className="font-semibold text-gray-900">KES {rental.daily_rate?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Days (Current)</p>
              <p className="font-semibold text-gray-900">{rental.total_days || 0} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount (Current)</p>
              <p className="font-semibold text-gray-900">KES {rental.total_amount?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Extension Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Additional Days */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Additional Days *
            </label>
            <input
              type="number"
              min="1"
              value={additionalDays}
              onChange={(e) => setAdditionalDays(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="Enter number of days"
              required
            />
          </div>

          {/* New Daily Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Daily Rate (KES)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newDailyRate}
              onChange={(e) => setNewDailyRate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="Daily rate for extension"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to use current rate</p>
          </div>

          {/* Calculated Extension Amount */}
          {extensionAmount > 0 && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-semibold">Extension Amount</p>
                  <p className="text-xs text-indigo-500">{additionalDays} days × KES {newDailyRate}</p>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  KES {extensionAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* New End Date */}
          {additionalDays && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-semibold">New End Date</p>
                  <p className="text-xs text-purple-500">After extension</p>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {newEndDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Payment Confirmation */}
          <div className="border-t-2 border-gray-200 pt-6">
            <h4 className="font-bold text-gray-900 mb-4">Payment Confirmation</h4>
            
            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>

            {/* Payment Amount */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Amount (KES) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="Amount paid by customer"
                required
              />
            </div>

            {/* Has Paid Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <input
                type="checkbox"
                id="hasPaid"
                checked={hasPaid}
                onChange={(e) => setHasPaid(e.target.checked)}
                className="mt-1 w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="hasPaid" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  {hasPaid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="font-semibold text-gray-900">
                    Customer has paid for the extension
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  You must confirm payment before approving the extension
                </p>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading || !hasPaid}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Approve Extension'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtensionRequestModal;


