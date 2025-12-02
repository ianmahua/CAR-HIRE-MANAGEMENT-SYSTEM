import React from 'react';
import { CheckCircle, Mail, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * Custom success toast for vehicle hire out with contract
 * @param {string} customerEmail - Customer email address
 * @param {string} rentalId - Rental ID for viewing details
 * @param {Function} onViewDetails - Callback when "View Details" is clicked
 */
export const showHireOutSuccessToast = (customerEmail, rentalId = null, onViewDetails = null) => {
  const ToastContent = ({ closeToast }) => (
    <div className="flex items-start gap-4 p-4">
      {/* Success Icon */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Main Message */}
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Vehicle hired out successfully!
            </h3>
            
            {/* Sub-message */}
            {customerEmail && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Contract sent to <span className="font-semibold text-gray-900">{customerEmail}</span></span>
              </div>
            )}

            {/* View Details Button */}
            {onViewDetails && (
              <button
                onClick={() => {
                  onViewDetails();
                  closeToast();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <ExternalLink className="w-4 h-4" />
                View Booking Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  toast.success(ToastContent, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: 'custom-success-toast',
    bodyClassName: 'p-0',
    style: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      padding: '0',
      overflow: 'hidden',
      minWidth: '380px',
      maxWidth: '420px'
    }
  });
};

export default showHireOutSuccessToast;

