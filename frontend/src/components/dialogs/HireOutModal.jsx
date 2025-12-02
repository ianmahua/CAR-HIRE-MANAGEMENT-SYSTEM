import React, { useState } from 'react';
import Modal from '../base/Modal';
import Button from '../base/Button';
import { Car, User, Calendar, MapPin } from 'lucide-react';

const HireOutModal = ({ isOpen, onClose, vehicles, customers, onSubmit }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: 'Nairobi',
    customer_id: '',
    vehicle_ref: '',
    start_date: '',
    end_date: '',
    destination: '',
    hire_type: 'Direct Client'
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Accept Kenyan format: 07xx xxx xxx or 2547xx xxx xxx
    const phoneRegex = /^(?:254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.customer_name) newErrors.customer_name = 'Required';
    if (!formData.customer_email) {
      newErrors.customer_email = 'Required';
    } else if (!validateEmail(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }
    if (!formData.customer_phone) {
      newErrors.customer_phone = 'Required';
    } else if (!validatePhone(formData.customer_phone)) {
      newErrors.customer_phone = 'Please enter a valid Kenyan phone number (07xx xxx xxx)';
    }
    if (!formData.vehicle_ref) newErrors.vehicle_ref = 'Required';
    if (!formData.start_date) newErrors.start_date = 'Required';
    if (!formData.end_date) newErrors.end_date = 'Required';
    if (!formData.destination) newErrors.destination = 'Required';
    
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
      customer_email: '',
      customer_phone: '',
      customer_address: 'Nairobi',
      customer_id: '',
      vehicle_ref: '',
      start_date: '',
      end_date: '',
      destination: '',
      hire_type: 'Direct Client'
    });
    setErrors({});
    onClose();
  };

  const availableVehicles = vehicles?.filter(v => v.availability_status === 'Parking') || [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Hire Out a Car" size="lg">
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
                Customer Email *
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="customer@example.com"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customer_email ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customer_email && (
                <p className="text-rose-600 text-sm mt-1">{errors.customer_email}</p>
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
                placeholder="07xx xxx xxx"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.customer_phone ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.customer_phone && (
                <p className="text-rose-600 text-sm mt-1">{errors.customer_phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Address
              </label>
              <input
                type="text"
                name="customer_address"
                value={formData.customer_address}
                onChange={handleChange}
                placeholder="Nairobi"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ID/Passport Number
              </label>
              <input
                type="text"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Rental Information */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-600" />
            Rental Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Vehicle *
              </label>
              <select
                name="vehicle_ref"
                value={formData.vehicle_ref}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.vehicle_ref ? 'border-rose-500' : 'border-gray-200'
                }`}
              >
                <option value="">-- Select Vehicle --</option>
                {availableVehicles.map(vehicle => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
              {errors.vehicle_ref && (
                <p className="text-rose-600 text-sm mt-1">{errors.vehicle_ref}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hire Type
              </label>
              <select
                name="hire_type"
                value={formData.hire_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Direct Client">Direct Client</option>
                <option value="Broker Handoff">Broker Handoff</option>
                <option value="External Brokerage Rental">External Brokerage Rental</option>
              </select>
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
                <MapPin className="w-4 h-4" />
                Destination *
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., Nairobi to Mombasa"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  errors.destination ? 'border-rose-500' : 'border-gray-200'
                }`}
              />
              {errors.destination && (
                <p className="text-rose-600 text-sm mt-1">{errors.destination}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="success" className="flex-1">
            Hire Out Car
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default HireOutModal;


