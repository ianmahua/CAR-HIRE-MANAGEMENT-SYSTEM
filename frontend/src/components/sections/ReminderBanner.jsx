import React from 'react';
import { Calendar, AlertCircle, X } from 'lucide-react';
import Button from '../base/Button';

const ReminderBanner = ({ reminders, onConfirm, onDismiss }) => {
  if (!reminders || reminders.length === 0) return null;

  const todayReminders = reminders.filter(r => r.isToday);
  const tomorrowReminders = reminders.filter(r => r.isTomorrow);

  return (
    <div className="mb-6 space-y-3">
      {todayReminders.map((booking) => (
        <div
          key={booking._id}
          className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-amber-100 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">
                Booking Reminder: TODAY
              </h3>
              <p className="text-sm text-amber-800">
                <strong>{booking.customerName}</strong> has a booking{' '}
                <strong>TODAY</strong> for{' '}
                <strong>
                  {booking.vehicleMake} {booking.vehicleModel}
                </strong>
                . Please confirm with client.
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(booking.bookingDate).toLocaleDateString()} •{' '}
                  {booking.numberOfDays} day{booking.numberOfDays > 1 ? 's' : ''} •{' '}
                  {booking.destination}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConfirm(booking)}
            >
              Confirm Client
            </Button>
            {onDismiss && (
              <button
                onClick={() => onDismiss(booking._id)}
                className="p-2 text-amber-600 hover:text-amber-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {tomorrowReminders.map((booking) => (
        <div
          key={booking._id}
          className="bg-brand-orange/10 border-2 border-brand-orange/30 rounded-2xl p-4 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-brand-orange/20 rounded-xl">
              <Calendar className="w-5 h-5 text-brand-orange" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">
                Booking Reminder: TOMORROW
              </h3>
              <p className="text-sm text-gray-700">
                <strong>{booking.customerName}</strong> has a booking{' '}
                <strong>TOMORROW</strong> for{' '}
                <strong>
                  {booking.vehicleMake} {booking.vehicleModel}
                </strong>
                . Please confirm with client.
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(booking.bookingDate).toLocaleDateString()} •{' '}
                  {booking.numberOfDays} day{booking.numberOfDays > 1 ? 's' : ''} •{' '}
                  {booking.destination}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConfirm(booking)}
            >
              Confirm Client
            </Button>
            {onDismiss && (
              <button
                onClick={() => onDismiss(booking._id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReminderBanner;



