import React, { useState } from 'react';
import { 
  Car, CheckCircle, Clock, Bell, AlertCircle, Calendar, 
  Users, TrendingUp, Package, ArrowRight, X 
} from 'lucide-react';
import StatBadge from '../base/StatBadge';
import Card from '../base/Card';
import Button from '../base/Button';
import NotificationBanner from './NotificationBanner';

const Dashboard = ({ 
  stats, 
  upcomingReturns, 
  upcomingBookings, 
  notifications,
  onViewVehicles,
  onViewBookings,
  onViewVehiclesDue,
  onViewActiveRentals,
  onViewAvailableVehicles,
  onViewNotifications,
  onProcessReturn,
  onExtendRental,
  onMarkAsReturned,
  onClientExtending,
  onDismissNotification,
  onNotificationAction
}) => {
  const [dismissedBanners, setDismissedBanners] = useState([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get high-priority unread notifications for banners (limit to 3)
  const highPriorityNotifications = notifications
    ?.filter(n => !n.isRead && n.priority === 'high' && !dismissedBanners.includes(n._id))
    .slice(0, 3) || [];

  const handleDismissBanner = (notificationId) => {
    setDismissedBanners(prev => [...prev, notificationId]);
    if (onDismissNotification) {
      onDismissNotification(notificationId);
    }
  };

  // Filter returns due today
  const returnsToday = upcomingReturns.filter(r => r.isToday || r.daysUntil === 0);
  const upcomingReturnsFiltered = upcomingReturns.filter(r => !r.isToday && r.daysUntil !== 0).slice(0, 5);
  const upcomingBookingsFiltered = upcomingBookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">{getGreeting()}</h1>
            <p className="text-indigo-100">Here's your operational overview for today</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-indigo-100">Today</p>
              <p className="text-xl font-bold">{new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* High-Priority Notification Banners */}
      {highPriorityNotifications.length > 0 && (
        <div className="space-y-3">
          {highPriorityNotifications.map((notification) => (
            <NotificationBanner
              key={notification._id}
              notification={notification}
              onDismiss={handleDismissBanner}
              onAction={onNotificationAction}
            />
          ))}
        </div>
      )}

      {/* Critical Alert: Returns Due Today */}
      {returnsToday.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">⚠️ {returnsToday.length} Vehicle{returnsToday.length > 1 ? 's' : ''} Due for Return Today</h3>
              <p className="text-red-100 mb-4">Immediate action required</p>
              
              <div className="space-y-3">
                {returnsToday.map((item, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-red-100">Vehicle</p>
                        <p className="font-bold">{item.licensePlate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-100">Customer</p>
                        <p className="font-bold">{item.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-100">Return Time</p>
                        <p className="font-bold">{item.returnTime || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-100">Status</p>
                        <p className="font-bold">DUE TODAY</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onProcessReturn && onProcessReturn(item)}
                        className="bg-white text-red-600 hover:bg-red-50"
                      >
                        Process Return
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExtendRental && onExtendRental(item)}
                        className="border-white text-white hover:bg-white/20"
                      >
                        Extend Rental
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBadge
            label="Active Rentals"
            value={stats.activeRentals}
            icon={Car}
            color="indigo"
            onClick={onViewActiveRentals}
          />
          <StatBadge
            label="Available Vehicles"
            value={stats.availableVehicles}
            icon={CheckCircle}
            color="emerald"
            onClick={onViewAvailableVehicles}
          />
          <StatBadge
            label="Returns Due Soon"
            value={stats.vehiclesDue || 0}
            icon={Clock}
            color="amber"
            onClick={onViewVehiclesDue}
          />
          <StatBadge
            label="Total Customers"
            value={stats.totalCustomers || 0}
            icon={Users}
            color="purple"
            onClick={onViewBookings}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Returns - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Returns</h3>
                  <p className="text-sm text-gray-500">Next 7 days</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold">
                {upcomingReturnsFiltered.length}
              </span>
            </div>

            <div className="space-y-3">
              {upcomingReturnsFiltered.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No upcoming returns</p>
                  <p className="text-sm text-gray-400 mt-1">All vehicles are on schedule</p>
                </div>
              ) : (
                upcomingReturnsFiltered.map((item, idx) => {
                  const isUrgent = item.daysUntil <= 1;
                  
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        isUrgent 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-gray-900">{item.licensePlate}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isUrgent 
                                ? 'bg-amber-200 text-amber-800' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.daysUntil === 1 ? 'Tomorrow' : `${item.daysUntil} days`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{item.customerName}</p>
                          <p className="text-xs text-gray-500">
                            Return: {new Date(item.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onProcessReturn && onProcessReturn(item)}
                          className="text-orange-600 hover:bg-orange-50"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {upcomingReturnsFiltered.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={onViewActiveRentals}
                  className="w-full text-orange-600 hover:bg-orange-50"
                >
                  View All Returns
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Bookings - Takes 1 column */}
        <div>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bookings</h3>
                  <p className="text-sm text-gray-500">Upcoming</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                {upcomingBookingsFiltered.length}
              </span>
            </div>

            <div className="space-y-3">
              {upcomingBookingsFiltered.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No upcoming bookings</p>
                  <p className="text-sm text-gray-400 mt-1">Check back later</p>
                </div>
              ) : (
                upcomingBookingsFiltered.map((booking, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-blue-50 border-2 border-blue-100 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">{booking.vehicleRequest || 'Vehicle TBD'}</p>
                      </div>
                      {booking.isToday && (
                        <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                      <span>{booking.numberOfDays} days</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {upcomingBookingsFiltered.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={onViewBookings}
                  className="w-full text-blue-600 hover:bg-blue-50"
                >
                  View All Bookings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={onViewVehicles}
            className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Car className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">View Fleet</p>
                <p className="text-xs text-gray-500">All vehicles</p>
              </div>
            </div>
          </button>

          <button
            onClick={onViewActiveRentals}
            className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Active Rentals</p>
                <p className="text-xs text-gray-500">Manage rentals</p>
              </div>
            </div>
          </button>

          <button
            onClick={onViewBookings}
            className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Bookings</p>
                <p className="text-xs text-gray-500">View & manage</p>
              </div>
            </div>
          </button>

          <button
            onClick={onViewNotifications}
            className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">View all alerts</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
