import React from 'react';
import { X, AlertCircle, Clock, Wrench, Bell, DollarSign } from 'lucide-react';
import Button from '../base/Button';

const NotificationBanner = ({ notification, onDismiss, onAction }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'service_due':
        return 'bg-red-50 border-red-500 text-red-900';
      case 'return_due':
        return 'bg-amber-50 border-amber-500 text-amber-900';
      case 'extension_request':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'booking_reminder':
        return 'bg-blue-50 border-blue-500 text-blue-900';
      case 'mileage_check':
        return 'bg-green-50 border-green-500 text-green-900';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-900';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'service_due':
        return <Wrench className="w-6 h-6" />;
      case 'return_due':
        return <AlertCircle className="w-6 h-6" />;
      case 'extension_request':
        return <DollarSign className="w-6 h-6" />;
      case 'booking_reminder':
        return <Clock className="w-6 h-6" />;
      case 'mileage_check':
        return <Bell className="w-6 h-6" />;
      default:
        return <Bell className="w-6 h-6" />;
    }
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border-l-4 shadow-md ${getTypeColor(
        notification.type
      )}`}
    >
      <div className="flex-shrink-0">{getIcon(notification.type)}</div>
      
      <div className="flex-1">
        <h4 className="font-bold text-sm mb-1">{notification.title}</h4>
        <p className="text-sm opacity-90">{notification.message}</p>
      </div>

      <div className="flex items-center gap-2">
        {notification.actionButtons && notification.actionButtons.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAction(notification)}
            className="whitespace-nowrap"
          >
            {notification.actionButtons[0].label}
          </Button>
        )}
        <button
          onClick={() => onDismiss(notification._id)}
          className="p-1 hover:bg-black/10 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;


