import React, { useState } from 'react';
import Modal from '../base/Modal';
import Button from '../base/Button';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const ConfirmClientDialog = ({ isOpen, onClose, booking, onConfirm, onCancel }) => {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  if (!booking) return null;

  const handleYes = () => {
    onConfirm(booking);
    onClose();
  };

  const handleNo = () => {
    setShowCancelPrompt(true);
  };

  const handleCancelBooking = () => {
    onCancel(booking);
    setShowCancelPrompt(false);
    onClose();
  };

  const handleKeepBooking = () => {
    setShowCancelPrompt(false);
  };

  if (showCancelPrompt) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cancel Booking?" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 mb-2">
                Would you like to cancel this booking?
              </p>
              <p className="text-sm text-gray-600">
                The booking will be marked as cancelled with reason: "Client did not confirm"
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleKeepBooking}
              className="flex-1"
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelBooking}
              className="flex-1"
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Client" size="md">
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-gray-700 mb-2">
            Has <strong>{booking.customerName}</strong> confirmed they still want the vehicle?
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Vehicle:</strong> {booking.vehicleMake} {booking.vehicleModel}
            </p>
            <p>
              <strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Duration:</strong> {booking.numberOfDays} day{booking.numberOfDays > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleNo}
            className="flex-1"
          >
            No
          </Button>
          <Button
            variant="success"
            onClick={handleYes}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Yes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmClientDialog;



