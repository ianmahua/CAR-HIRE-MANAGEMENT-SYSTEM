import React, { useState } from 'react';
import { Bell, AlertCircle, CheckCircle, Clock, DollarSign, X, CheckCheck } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Notifications = ({ notifications, onRefresh, onActionCallback }) => {
  const [dismissing, setDismissing] = useState({});
  const [processing, setProcessing] = useState({});
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const navigate = useNavigate();

  // Debug: Log notifications received
  console.log('[Notifications] Received notifications:', notifications);
  console.log('[Notifications] Token exists:', !!token);
  console.log('[Notifications] Action callback available:', !!onActionCallback);

  const handleMarkAsRead = async (notificationId) => {
    console.log('[Notifications] Marking as read:', notificationId);
    try {
      const res = await fetch(`${API_URL}/api/driver/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Notifications] Mark as read response:', res.status, res.ok);

      if (res.ok && onRefresh) {
        console.log('[Notifications] Calling onRefresh...');
        onRefresh();
        toast.success('Notification marked as read');
      } else {
        const errorData = await res.json();
        console.error('[Notifications] Mark as read failed:', errorData);
        toast.error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleDismiss = async (notificationId) => {
    console.log('[Notifications] Dismissing:', notificationId);
    try {
      setDismissing(prev => ({ ...prev, [notificationId]: true }));
      
      const res = await fetch(`${API_URL}/api/driver/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Notifications] Dismiss response:', res.status, res.ok);

      if (res.ok && onRefresh) {
        console.log('[Notifications] Calling onRefresh after dismiss...');
        onRefresh();
        toast.success('Notification dismissed');
      } else {
        const errorData = await res.json();
        console.error('[Notifications] Dismiss failed:', errorData);
        toast.error('Failed to dismiss notification');
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Failed to dismiss notification');
    } finally {
      setDismissing(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  const handleMarkAllRead = async () => {
    console.log('[Notifications] Marking all as read...');
    try {
      const res = await fetch(`${API_URL}/api/driver/notifications-mark-all-read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Notifications] Mark all as read response:', res.status, res.ok);

      if (res.ok && onRefresh) {
        console.log('[Notifications] Calling onRefresh after mark all...');
        onRefresh();
        toast.success('All notifications marked as read!');
      } else {
        const errorData = await res.json();
        console.error('[Notifications] Mark all as read failed:', errorData);
        toast.error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleActionButton = async (notification, action) => {
    console.log('[Notifications] Action button clicked:', action, 'for notification:', notification._id);
    
    // Set processing state
    setProcessing(prev => ({ ...prev, [notification._id]: action }));

    try {
      // First, mark the notification as read
      await handleMarkAsRead(notification._id);

      // If parent provides action callback, use it to trigger the actual action
      if (onActionCallback) {
        console.log('[Notifications] Calling parent action callback');
        try {
          await onActionCallback(action, notification.relatedId);
          // Action was handled by parent, we're done
          setProcessing(prev => ({ ...prev, [notification._id]: null }));
          return;
        } catch (err) {
          console.error('[Notifications] Action callback error:', err);
          // Continue with fallback navigation
        }
      }

      // Fallback: Navigate to the appropriate tab
      // Then perform the specific action
      switch (action) {
        case 'confirm_client':
          console.log('[Notifications] Navigating to bookings to confirm client...');
          toast.info('Opening booking confirmation...');
          // Navigate to bookings page with action parameter
          if (notification.relatedId) {
            navigate(`/driver?tab=bookings&action=confirm&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=bookings');
          }
          break;

        case 'view_booking':
          console.log('[Notifications] Navigating to view booking...');
          toast.info('Opening booking details...');
          if (notification.relatedId) {
            navigate(`/driver?tab=bookings&action=view&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=bookings');
          }
          break;

        case 'process_return':
          console.log('[Notifications] Opening return vehicle form...');
          toast.info('Opening return vehicle form...');
          if (notification.relatedId) {
            navigate(`/driver?tab=active-rentals&action=return&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=active-rentals');
          }
          break;

        case 'update_mileage':
          console.log('[Notifications] Opening mileage update form...');
          toast.info('Opening mileage update form...');
          if (notification.relatedId) {
            navigate(`/driver?tab=vehicles&action=mileage&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=vehicles');
          }
          break;

        case 'mark_serviced':
          console.log('[Notifications] Opening service form...');
          toast.info('Opening service form...');
          if (notification.relatedId) {
            navigate(`/driver?tab=vehicles&action=service&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=vehicles');
          }
          break;

        case 'schedule_service':
          console.log('[Notifications] Opening service scheduling...');
          toast.info('Opening service scheduling...');
          if (notification.relatedId) {
            navigate(`/driver?tab=vehicles&action=schedule&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=vehicles');
          }
          break;

        case 'approve_extension':
        case 'request_extension':
          console.log('[Notifications] Opening extension approval form...');
          toast.info('Opening extension approval...');
          if (notification.relatedId) {
            navigate(`/driver?tab=active-rentals&action=extend&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=active-rentals');
          }
          break;

        case 'no_extension':
          console.log('[Notifications] Confirming no extension needed...');
          if (notification.relatedId) {
            navigate(`/driver?tab=active-rentals&action=no-extension&id=${notification.relatedId}`);
          } else {
            navigate('/driver?tab=active-rentals');
          }
          break;

        case 'contact_customer':
          console.log('[Notifications] Opening contact customer dialog...');
          toast.info('Contact customer feature coming soon!');
          // This would open a contact modal or dial phone number
          break;

        default:
          console.log('[Notifications] Unknown action:', action);
          toast.warning(`Action "${action}" is not yet implemented`);
          // For any action with a URL, navigate to it
          if (notification.actionUrl) {
            navigate(notification.actionUrl);
          }
      }
    } catch (error) {
      console.error('[Notifications] Error handling action:', error);
      toast.error('Failed to perform action');
    } finally {
      setProcessing(prev => ({ ...prev, [notification._id]: null }));
    }
  };

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

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  const readNotifications = notifications?.filter(n => n.isRead) || [];
  const hasUnread = unreadNotifications.length > 0;
  const [showRead, setShowRead] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Notifications
            {hasUnread && (
              <span className="ml-3 px-3 py-1 text-sm bg-red-500 text-white rounded-full">
                {unreadNotifications.length} New
              </span>
            )}
          </h2>
          <p className="text-gray-600">All alerts and reminders</p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* UNREAD Notifications Section */}
      {hasUnread && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">Unread</h3>
            <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full font-semibold">
              {unreadNotifications.length}
            </span>
          </div>
          {unreadNotifications.map((notif) => (
            <Card
              key={notif._id}
              className={`border-2 ${getNotificationColor(notif.type || notif.priority)} ${
                !notif.isRead ? 'ring-2 ring-brand-orange ring-opacity-30' : 'opacity-70'
              } transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl">
                  {getNotificationIcon(notif.type || notif.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {notif.title || notif.message}
                        {!notif.isRead && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-brand-orange text-white rounded-full">
                            NEW
                          </span>
                        )}
                      </h3>
                      {notif.message && notif.title && (
                        <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                      )}
                      {notif.description && (
                        <p className="text-sm text-gray-600 mb-2">{notif.description}</p>
                      )}
                      {(notif.timestamp || notif.createdAt) && (
                        <p className="text-xs text-gray-500">
                          {new Date(notif.timestamp || notif.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDismiss(notif._id)}
                      disabled={dismissing[notif._id]}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  {notif.actionButtons && notif.actionButtons.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {notif.actionButtons.map((btn, idx) => {
                        const isProcessing = processing[notif._id] === btn.action;
                        return (
                          <Button
                            key={idx}
                            variant={idx === 0 ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleActionButton(notif, btn.action)}
                            disabled={isProcessing || processing[notif._id]}
                            className="flex items-center gap-2"
                          >
                            {isProcessing && (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                            {btn.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* Mark as read button if unread */}
                  {!notif.isRead && !notif.actionButtons?.length && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="text-xs text-brand-orange hover:text-brand-orange-dark font-semibold"
                      >
                        Mark as Read
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* READ Notifications Section (Collapsible) */}
      {readNotifications.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowRead(!showRead)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <h3 className="text-xl font-bold">Read</h3>
            <span className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-full font-semibold">
              {readNotifications.length}
            </span>
            <span className="text-sm text-gray-500">
              {showRead ? '(Click to collapse)' : '(Click to expand)'}
            </span>
          </button>
          
          {showRead && (
            <div className="space-y-4">
              {readNotifications.map((notif) => (
                <Card
                  key={notif._id}
                  className={`border-2 ${getNotificationColor(notif.type || notif.priority)} opacity-70 transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl">
                      {getNotificationIcon(notif.type || notif.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-700 mb-1">
                            {notif.title || notif.message}
                          </h3>
                          {notif.message && notif.title && (
                            <p className="text-sm text-gray-500 mb-2">{notif.message}</p>
                          )}
                          {notif.description && (
                            <p className="text-sm text-gray-500 mb-2">{notif.description}</p>
                          )}
                          {(notif.timestamp || notif.createdAt) && (
                            <p className="text-xs text-gray-400">
                              {new Date(notif.timestamp || notif.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDismiss(notif._id)}
                            disabled={dismissing[notif._id]}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                          >
                            {dismissing[notif._id] ? (
                              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Notifications;




