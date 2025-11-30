import React from 'react';
import { Car, CheckCircle, TrendingUp, Clock, Bell, AlertCircle, Calendar } from 'lucide-react';
import StatBadge from '../base/StatBadge';
import Card from '../base/Card';
import Button from '../base/Button';

const Dashboard = ({ 
  stats, 
  upcomingReturns, 
  upcomingBookings, 
  notifications,
  onViewVehicles,
  onViewBookings,
  onViewReturns,
  onViewNotifications,
  onProcessReturn,
  onExtendRental
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'critical': return 'bg-rose-50 border-rose-200 text-rose-800';
      default: return 'bg-indigo-50 border-indigo-200 text-indigo-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-bold mb-2">{getGreeting()}</h1>
        <p className="text-indigo-100 text-lg">Here's your operational overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBadge
          label="Active Rentals"
          value={stats.activeRentals}
          icon={Car}
          color="indigo"
          onClick={onViewBookings}
        />
        <StatBadge
          label="Available Vehicles"
          value={stats.availableVehicles}
          icon={CheckCircle}
          color="emerald"
          onClick={onViewVehicles}
        />
        <StatBadge
          label="Revenue This Week"
          value={`KES ${(stats.revenueThisWeek / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          color="amber"
        />
        <StatBadge
          label="Returns Today"
          value={stats.returnsToday}
          icon={Clock}
          color="rose"
          onClick={onViewReturns}
        />
      </div>

      {/* Notifications Panel */}
      {notifications && notifications.length > 0 && (
        <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Bell className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Important Notifications</h3>
                <p className="text-sm text-gray-600">{notifications.length} new notification{notifications.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onViewNotifications}>
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notif, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border-2 ${getNotificationColor(notif.type)} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-3">
                  {notif.type === 'critical' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-semibold">{notif.title || notif.message}</p>
                    {notif.timestamp && (
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Returns & Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Returns Panel */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              Upcoming Returns
            </h3>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              {upcomingReturns.length}
            </span>
          </div>
          <div className="space-y-3">
            {upcomingReturns.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No upcoming returns</p>
              </div>
            ) : (
              upcomingReturns.map((returnItem, idx) => {
                const isOverdue = returnItem.daysUntil < 0;
                const isToday = returnItem.daysUntil === 0;
                const bgColor = isOverdue ? 'bg-rose-50 border-rose-300' : isToday ? 'bg-amber-50 border-amber-300' : 'bg-indigo-50 border-indigo-300';
                const textColor = isOverdue ? 'text-rose-800' : isToday ? 'text-amber-800' : 'text-indigo-800';
                
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-2 ${bgColor} transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{returnItem.licensePlate}</p>
                        <p className="text-sm text-gray-600">{returnItem.customerName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${textColor} ${bgColor}`}>
                        {isOverdue ? 'OVERDUE' : isToday ? 'TODAY' : `${returnItem.daysUntil} DAYS`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Return: {new Date(returnItem.endDate).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onProcessReturn && onProcessReturn(returnItem)}
                        className="flex-1"
                      >
                        Process Return
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onExtendRental && onExtendRental(returnItem)}
                        className="flex-1"
                      >
                        Extend
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Booking Reminders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Booking Reminders
            </h3>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              {upcomingBookings.length}
            </span>
          </div>
          <div className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No upcoming bookings</p>
              </div>
            ) : (
              upcomingBookings.map((booking, idx) => {
                const isToday = booking.daysUntil === 0;
                const bgColor = isToday ? 'bg-amber-50 border-amber-300' : 'bg-indigo-50 border-indigo-300';
                const textColor = isToday ? 'text-amber-800' : 'text-indigo-800';
                
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-2 ${bgColor} transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {booking.licensePlate} • {new Date(booking.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${textColor} ${bgColor}`}>
                        {isToday ? 'TODAY' : `${booking.daysUntil} DAYS`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Amount: KES {(booking.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

