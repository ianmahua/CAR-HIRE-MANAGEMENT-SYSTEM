import React, { useState } from 'react';
import Modal from '../base/Modal';
import Button from '../base/Button';
import { Calendar, Car, User, MapPin, Phone as PhoneIcon, Mail } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CreateBookingModal = ({ isOpen, onClose, vehicles, customers, onSubmit }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerIdNumber: '',
    customerPhone: '',
    customerEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    bookingDate: '',
    numberOfDays: '',
    destination: '',
    dailyRate: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerName) newErrors.customerName = 'Required';
    if (!formData.customerIdNumber) newErrors.customerIdNumber = 'Required';
    if (!formData.customerPhone) newErrors.customerPhone = 'Required';
    if (!formData.customerEmail) newErrors.customerEmail = 'Required';
    if (!formData.vehicleMake) newErrors.vehicleMake = 'Required';
    if (!formData.vehicleModel) newErrors.vehicleModel = 'Required';
    if (!formData.bookingDate) newErrors.bookingDate = 'Required';
    if (!formData.numberOfDays) newErrors.numberOfDays = 'Required';
    if (!formData.destination) newErrors.destination = 'Required';
    if (!formData.dailyRate) newErrors.dailyRate = 'Required';

    // Phone format
    if (formData.customerPhone) {
      const phoneRegex = /^\+?\d{9,15}$/;
      if (!phoneRegex.test(String(formData.customerPhone))) {
        newErrors.customerPhone = 'Invalid phone number';
      }
    }

    // Email format
    if (formData.customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(formData.customerEmail))) {
        newErrors.customerEmail = 'Invalid email address';
      }
    }

    // Booking date must be in the future
    if (formData.bookingDate) {
      const start = new Date(formData.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(start.getTime()) || start < today) {
        newErrors.bookingDate = 'Pickup date must be in the future';
      }
    }

    // numberOfDays > 0
    if (formData.numberOfDays) {
      const days = Number(formData.numberOfDays);
      if (Number.isNaN(days) || days <= 0) {
        newErrors.numberOfDays = 'Number of days must be greater than 0';
      }
    }

    // dailyRate >= 0
    if (formData.dailyRate) {
      const rate = Number(formData.dailyRate);
      if (Number.isNaN(rate) || rate < 0) {
        newErrors.dailyRate = 'Daily rate must be a non-negative number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        ...formData,
        numberOfDays: Number(formData.numberOfDays),
        dailyRate: Number(formData.dailyRate)
      };

      const res = await fetch(
        `${API_URL}/api/driver/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create booking');
      }

      if (onSubmit) {
        onSubmit(data.data);
      }
      handleClose();
    } catch (err) {
      console.error('Create booking error:', err);
      setErrors(prev => ({
        ...prev,
        form: err.message || 'Failed to create booking'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customerName: '',
      customerIdNumber: '',
      customerPhone: '',
      customerEmail: '',
      vehicleMake: '',
      vehicleModel: '',
      bookingDate: '',
      numberOfDays: '',
      destination: '',
      dailyRate: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Future Booking" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customerName ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customerName && (
                <p className="text-rose-600 text-sm mt-1">{errors.customerName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ID Number *
              </label>
              <input
                type="text"
                name="customerIdNumber"
                value={formData.customerIdNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customerIdNumber ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customerIdNumber && (
                <p className="text-rose-600 text-sm mt-1">{errors.customerIdNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-indigo-600" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customerPhone ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customerPhone && (
                <p className="text-rose-600 text-sm mt-1">{errors.customerPhone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Email Address *
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customerEmail ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customerEmail && (
                <p className="text-rose-600 text-sm mt-1">{errors.customerEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Booking Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" />
                Vehicle Make *
              </label>
              <input
                type="text"
                name="vehicleMake"
                value={formData.vehicleMake}
                onChange={handleChange}
                placeholder="e.g., Toyota, Nissan, Subaru"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.vehicleMake ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.vehicleMake && (
                <p className="text-rose-600 text-sm mt-1">{errors.vehicleMake}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" />
                Vehicle Model *
              </label>
              <input
                type="text"
                name="vehicleModel"
                value={formData.vehicleModel}
                onChange={handleChange}
                placeholder="e.g., Prado, X-Trail, Forester"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.vehicleModel ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.vehicleModel && (
                <p className="text-rose-600 text-sm mt-1">{errors.vehicleModel}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Daily Rental Rate (KES) *
              </label>
              <input
                type="number"
                name="dailyRate"
                value={formData.dailyRate}
                onChange={handleChange}
                min="0"
                step="100"
                placeholder="e.g., 5000"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.dailyRate ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.dailyRate && (
                <p className="text-rose-600 text-sm mt-1">{errors.dailyRate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Booking Date (Pickup) *
              </label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.bookingDate ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.bookingDate && (
                <p className="text-rose-600 text-sm mt-1">{errors.bookingDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Days *
              </label>
              <input
                type="number"
                name="numberOfDays"
                value={formData.numberOfDays}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.numberOfDays ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.numberOfDays && (
                <p className="text-rose-600 text-sm mt-1">{errors.numberOfDays}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Destination *
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., Nairobi to Mombasa"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional booking notes..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {errors.form && (
          <p className="text-rose-600 text-sm">{errors.form}</p>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="success" className="flex-1" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBookingModal;

