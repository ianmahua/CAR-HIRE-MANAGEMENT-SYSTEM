import React from 'react';
import { Bell, X, Clock, AlertCircle, CheckCircle, Wrench, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({ notifications, onClose, onNotificationClick, onViewAll }) => {
  // Get recent 5 unread notifications
  const recentNotifications = notifications
    .filter(n => !n.isRead)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_reminder':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'return_due':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'extension_request':
        return <DollarSign className="w-5 h-5 text-purple-600" />;
      case 'service_due':
        return <Wrench className="w-5 h-5 text-red-600" />;
      case 'mileage_check':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-amber-500 bg-amber-50';
      case 'low':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-white" />
          <h3 className="font-bold text-white">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notification) => (
            <button
              key={notification._id}
              onClick={() => {
                onNotificationClick(notification);
                onClose();
              }}
              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                    {notification.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No new notifications</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => {
            onViewAll();
            onClose();
          }}
          className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all text-sm"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;


