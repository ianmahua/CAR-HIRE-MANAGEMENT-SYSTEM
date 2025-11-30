import React, { useState } from 'react';
import Modal from '../base/Modal';
import Button from '../base/Button';
import { Calendar, DollarSign } from 'lucide-react';

const ExtendRentalModal = ({ isOpen, onClose, rental, onSubmit }) => {
  const [formData, setFormData] = useState({
    extension_days: 1,
    payment_status: 'Pending',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateNewEndDate = () => {
    if (!rental?.end_date) return null;
    const currentEndDate = new Date(rental.end_date);
    currentEndDate.setDate(currentEndDate.getDate() + parseInt(formData.extension_days));
    return currentEndDate.toLocaleDateString();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, action: 'extend' });
    handleClose();
  };

  const handleClose = () => {
    setFormData({ extension_days: 1, payment_status: 'Pending', notes: '' });
    onClose();
  };

  if (!rental) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Extend Rental Period" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rental Info */}
        <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-300">
          <h3 className="font-bold text-gray-900 mb-2">
            {rental.vehicle_ref?.license_plate || rental.license_plate} - {rental.customer_ref?.name || rental.customer_name}
          </h3>
          <p className="text-sm text-gray-600">
            Current End Date: {new Date(rental.end_date).toLocaleDateString()}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Extension Days *
            </label>
            <input
              type="number"
              name="extension_days"
              value={formData.extension_days}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {calculateNewEndDate() && (
              <p className="text-sm text-emerald-600 font-semibold mt-2">
                New End Date: {calculateNewEndDate()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Status for Extension *
            </label>
            <select
              name="payment_status"
              value={formData.payment_status}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending Payment</option>
              <option value="Partial">Partial Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any notes about this extension..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Extend Rental
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExtendRentalModal;

