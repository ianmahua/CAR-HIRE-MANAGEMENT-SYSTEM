import React from 'react';
import { Calendar, Clock, AlertTriangle, User, MapPin, Car } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';

const BookingCard = ({ booking, onEdit, onCancel, onConfirm }) => {
  const startDate = new Date(booking.bookingDate);
  const days = booking.numberOfDays;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startMidnight = new Date(startDate);
  startMidnight.setHours(0, 0, 0, 0);
  const diffMs = startMidnight - today;
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const startsSoon = daysUntil >= 0 && daysUntil <= 1;

  const canConfirmClient =
    booking.status === 'pending' && (isToday || isTomorrow);

  const statusBadgeClass = (() => {
    switch (booking.status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  })();

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-orange/10 rounded-2xl">
              <Calendar className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {booking.customerName}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Car className="w-4 h-4" />
                {booking.vehicleMake} {booking.vehicleModel}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <User className="w-3 h-3" />
                {booking.customerIdNumber} • {booking.customerPhone}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        {/* Main info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
              Pickup Date
            </p>
            <p className="font-semibold text-gray-900">
              {startDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
              Return Date
            </p>
            <p className="font-semibold text-gray-900">
              {endDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
              Duration
            </p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {days} day{days !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
              Destination
            </p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-brand-orange" />
              {booking.destination}
            </p>
          </div>
        </div>

        {/* Alert for bookings starting soon */}
        {startsSoon && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {isToday
                ? 'Booking starts TODAY'
                : isTomorrow
                ? 'Booking starts TOMORROW'
                : `Booking starts in ${daysUntil} days`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            variant="outline"
            className="text-sm"
            onClick={() => onEdit && onEdit(booking)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-sm border-rose-300 text-rose-700 hover:bg-rose-50"
            onClick={() => onCancel && onCancel(booking)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="text-sm"
            disabled={!canConfirmClient}
            onClick={() => canConfirmClient && onConfirm && onConfirm(booking)}
          >
            Confirm Client
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BookingCard;





