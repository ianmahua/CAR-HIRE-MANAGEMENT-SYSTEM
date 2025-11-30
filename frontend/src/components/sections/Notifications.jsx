import React from 'react';
import { Bell, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import Card from '../base/Card';

const Notifications = ({ notifications }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'warning': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default: return <Bell className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'critical': return 'bg-rose-50 border-rose-200';
      default: return 'bg-indigo-50 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600">All alerts and reminders</p>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications && notifications.length > 0 ? (
          notifications.map((notif, idx) => (
            <Card
              key={idx}
              className={`border-2 ${getNotificationColor(notif.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {notif.title || notif.message}
                  </h3>
                  {notif.description && (
                    <p className="text-sm text-gray-600 mb-2">{notif.description}</p>
                  )}
                  {notif.timestamp && (
                    <p className="text-xs text-gray-500">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;

