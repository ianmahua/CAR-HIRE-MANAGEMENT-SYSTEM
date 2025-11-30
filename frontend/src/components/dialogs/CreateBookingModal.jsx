import React, { useState } from 'react';
import Modal from '../base/Modal';
import Button from '../base/Button';
import { Calendar, Car, User, MapPin } from 'lucide-react';

const CreateBookingModal = ({ isOpen, onClose, vehicles, customers, onSubmit }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    vehicle_make: '',
    vehicle_model: '',
    start_date: '',
    end_date: '',
    price_per_day: '',
    notes: '',
    destination: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customer_name) newErrors.customer_name = 'Required';
    if (!formData.customer_phone) newErrors.customer_phone = 'Required';
    if (!formData.vehicle_make) newErrors.vehicle_make = 'Required';
    if (!formData.vehicle_model) newErrors.vehicle_model = 'Required';
    if (!formData.start_date) newErrors.start_date = 'Required';
    if (!formData.end_date) newErrors.end_date = 'Required';
    if (!formData.price_per_day) newErrors.price_per_day = 'Required';
    
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      vehicle_make: '',
      vehicle_model: '',
      start_date: '',
      end_date: '',
      price_per_day: '',
      notes: '',
      destination: ''
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
                Customer Name *
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customer_name ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customer_name && (
                <p className="text-rose-600 text-sm mt-1">{errors.customer_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                placeholder="254712345678"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customer_phone ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customer_phone && (
                <p className="text-rose-600 text-sm mt-1">{errors.customer_phone}</p>
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
                name="vehicle_make"
                value={formData.vehicle_make}
                onChange={handleChange}
                placeholder="e.g., Toyota, Nissan, Subaru"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.vehicle_make ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.vehicle_make && (
                <p className="text-rose-600 text-sm mt-1">{errors.vehicle_make}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" />
                Vehicle Model *
              </label>
              <input
                type="text"
                name="vehicle_model"
                value={formData.vehicle_model}
                onChange={handleChange}
                placeholder="e.g., Prado, X-Trail, Forester"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.vehicle_model ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.vehicle_model && (
                <p className="text-rose-600 text-sm mt-1">{errors.vehicle_model}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price Per Day (KES) *
              </label>
              <input
                type="number"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                min="0"
                step="100"
                placeholder="e.g., 5000"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.price_per_day ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.price_per_day && (
                <p className="text-rose-600 text-sm mt-1">{errors.price_per_day}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.start_date ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.start_date && (
                <p className="text-rose-600 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.end_date ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.end_date && (
                <p className="text-rose-600 text-sm mt-1">{errors.end_date}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Destination (Optional)
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

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="success" className="flex-1">
            Create Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBookingModal;

