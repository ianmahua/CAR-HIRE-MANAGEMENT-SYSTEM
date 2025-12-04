import React, { useState } from 'react';
import Modal from '../base/Modal';
import Button from '../base/Button';
import { CheckCircle, AlertCircle } from 'lucide-react';

const ReturnVehicleModal = ({ isOpen, onClose, rental, onSubmit }) => {
  const [formData, setFormData] = useState({
    payment_status: 'Paid',
    notes: '',
    condition: 'Good'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, action: 'return' });
    handleClose();
  };

  const handleClose = () => {
    setFormData({ payment_status: 'Paid', notes: '', condition: 'Good' });
    onClose();
  };

  if (!rental) return null;

  const isOverdue = new Date(rental.end_date) < new Date();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mark Vehicle as Returned" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rental Info */}
        <div className={`p-4 rounded-2xl border-2 ${
          isOverdue ? 'bg-rose-50 border-rose-300' : 'bg-indigo-50 border-indigo-300'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isOverdue ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-indigo-600" />
            )}
            <h3 className="font-bold text-gray-900">
              {rental.vehicle_ref?.license_plate || rental.license_plate} - {rental.customer_ref?.name || rental.customer_name}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Expected Return: {new Date(rental.end_date).toLocaleDateString()}
            {isOverdue && <span className="text-rose-600 font-semibold ml-2">(OVERDUE)</span>}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Status *
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
              Vehicle Condition
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Good">Good</option>
              <option value="Minor Damage">Minor Damage</option>
              <option value="Major Damage">Major Damage</option>
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
              placeholder="Add any notes about the return..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="success" className="flex-1">
            Confirm Return
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReturnVehicleModal;





