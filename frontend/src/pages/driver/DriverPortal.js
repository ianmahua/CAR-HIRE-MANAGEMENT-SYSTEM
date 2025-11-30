import React, { useState, useEffect } from 'react';
import { 
  Car, CheckCircle, Wrench, FileText, Search, Edit, Plus, X,
  LogOut, Menu, Calendar, DollarSign, User, Clock, AlertCircle,
  Bell, ArrowRight, TrendingUp, MapPin, Phone, Mail, History,
  CheckSquare, XCircle, RefreshCw, Eye, Users, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DriverPortal() {
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Dialogs
  const [hireOutDialogOpen, setHireOutDialogOpen] = useState(false);
  const [vehicleDetailsOpen, setVehicleDetailsOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [returnExtensionOpen, setReturnExtensionOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [futureBookingOpen, setFutureBookingOpen] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, activeFilter, searchQuery]);

  // Recalculate customer stats when bookings change
  useEffect(() => {
    if (bookings.length > 0 && customers.length > 0) {
      const updatedCustomers = customers.map(customer => {
        const totalBookings = customer.hire_history?.length || 0;
        const activeBookings = bookings.filter(b => 
          (b.customer_id === customer._id || b.customer_id === customer.customer_id) && 
          b.rental_status === 'Active'
        ).length;
        const totalSpent = customer.hire_history?.reduce((sum, h) => sum + (h.total_fee || 0), 0) || 0;
        
        return {
          ...customer,
          total_bookings: totalBookings,
          active_bookings: activeBookings,
          total_spent: totalSpent,
          phone_msisdn: customer.phone || customer.phone_msisdn
        };
      });
      setCustomers(updatedCustomers);
    }
  }, [bookings]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchVehicles(),
      fetchCustomers(),
      fetchBookings(),
      fetchNotifications()
    ]);
    setLoading(false);
  };

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setVehicles(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        // Transform customers to include basic computed stats
        const transformedCustomers = (response.data.data || []).map(customer => {
          const totalBookings = customer.hire_history?.length || 0;
          const totalSpent = customer.hire_history?.reduce((sum, h) => sum + (h.total_fee || 0), 0) || 0;
          
          return {
            ...customer,
            total_bookings: totalBookings,
            active_bookings: 0, // Will be updated when bookings are loaded
            total_spent: totalSpent,
            phone_msisdn: customer.phone || customer.phone_msisdn
          };
        });
        setCustomers(transformedCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use rentals endpoint as bookings are stored as rentals
      const response = await axios.get(`${API_URL}/api/rentals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        // Transform rentals to match frontend booking structure
        const transformedBookings = (response.data.data || []).map(rental => ({
          booking_id: rental.rental_id || rental._id,
          rental_id: rental.rental_id,
          vehicle_id: rental.vehicle_ref?._id || rental.vehicle_ref,
          customer_id: rental.customer_ref?._id || rental.customer_ref,
          license_plate: rental.vehicle_ref?.license_plate || 'N/A',
          customer_name: rental.customer_ref?.name || 'Unknown',
          customer_phone: rental.customer_ref?.phone_msisdn || rental.customer_ref?.phone || 'N/A',
          start_date: rental.start_date,
          end_date: rental.end_date,
          status: rental.rental_status,
          rental_status: rental.rental_status,
          payment_status: rental.payment_status,
          total_amount: rental.total_fee_gross || 0,
          notes: rental.destination || ''
        }));
        setBookings(transformedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/notifications/driver`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    if (activeFilter !== 'all') {
      const statusMap = {
        'available': 'Parking',
        'rented out': 'Rented Out',
        'in garage': 'In Garage'
      };
      const backendStatus = statusMap[activeFilter.toLowerCase()] || activeFilter;
      filtered = filtered.filter(vehicle => 
        vehicle.availability_status?.toLowerCase() === backendStatus.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.license_plate?.toLowerCase().includes(query) ||
        vehicle.make?.toLowerCase().includes(query) ||
        vehicle.model?.toLowerCase().includes(query) ||
        vehicle.category?.toLowerCase().includes(query)
      );
    }

    setFilteredVehicles(filtered);
  };

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.availability_status?.toLowerCase() === 'parking').length,
    rented: vehicles.filter(v => v.availability_status?.toLowerCase() === 'rented out').length,
    garage: vehicles.filter(v => v.availability_status?.toLowerCase() === 'in garage').length,
    totalCustomers: customers.length,
    activeBookings: bookings.filter(b => b.rental_status === 'Active').length,
    upcomingBookings: bookings.filter(b => b.rental_status === 'Pending' && new Date(b.start_date) > new Date()).length
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'parking': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Available' },
      'available': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Available' },
      'rented out': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Car, label: 'Rented Out' },
      'in garage': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Wrench, label: 'In Garage' }
    };

    const statusLower = status?.toLowerCase();
    const statusConfig = statusMap[statusLower] || { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: FileText,
      label: status || 'Unknown'
    };
    const StatusIcon = statusConfig.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${statusConfig.color}`}>
        <StatusIcon size={14} />
        {statusConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold text-lg">Loading Driver Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Car className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Driver Portal</h1>
                    <p className="text-xs text-gray-500">THE RESSEY TOURS CRMS</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell size={24} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setHireOutDialogOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg font-semibold"
                >
                  <Plus size={20} />
                  Hire Out Car
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-t border-gray-200 pt-2 pb-3 overflow-x-auto">
              <TabButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')}
                icon={Activity}
                label="Dashboard"
              />
              <TabButton 
                active={activeTab === 'fleet'} 
                onClick={() => setActiveTab('fleet')}
                icon={Car}
                label="Fleet Management"
              />
              <TabButton 
                active={activeTab === 'customers'} 
                onClick={() => setActiveTab('customers')}
                icon={Users}
                label="Customers"
              />
              <TabButton 
                active={activeTab === 'bookings'} 
                onClick={() => setActiveTab('bookings')}
                icon={Calendar}
                label="Future Bookings"
              />
            </div>
          </div>
        </nav>

        {/* Mobile Hire Out Button */}
        <div className="sm:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setHireOutDialogOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 transition-all font-semibold"
          >
            <Plus size={24} />
            Hire Out
          </button>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && <DashboardTab {...{ notifications, stats, bookings, setReturnExtensionOpen, setSelectedBooking }} />}
          {activeTab === 'fleet' && <FleetTab {...{ vehicles, filteredVehicles, stats, activeFilter, searchQuery, setActiveFilter, setSearchQuery, getStatusBadge, setVehicleDetailsOpen, setSelectedVehicle }} />}
          {activeTab === 'customers' && <CustomersTab {...{ customers, setCustomerDetailsOpen, setSelectedCustomer }} />}
          {activeTab === 'bookings' && <BookingsTab {...{ bookings, setFutureBookingOpen }} />}
        </div>
      </div>

      {/* Dialogs - Will be defined in Part 2 */}
      <HireOutDialog open={hireOutDialogOpen} onClose={() => setHireOutDialogOpen(false)} onSuccess={fetchAllData} vehicles={vehicles.filter(v => v.availability_status?.toLowerCase() === 'parking')} />
      <VehicleDetailsDialog open={vehicleDetailsOpen} onClose={() => setVehicleDetailsOpen(false)} vehicle={selectedVehicle} bookings={bookings} />
      <ReturnExtensionDialog open={returnExtensionOpen} onClose={() => setReturnExtensionOpen(false)} booking={selectedBooking} onSuccess={fetchAllData} />
      <CustomerDetailsDialog open={customerDetailsOpen} onClose={() => setCustomerDetailsOpen(false)} customer={selectedCustomer} bookings={bookings} />
      <FutureBookingDialog open={futureBookingOpen} onClose={() => setFutureBookingOpen(false)} onSuccess={fetchAllData} vehicles={vehicles} customers={customers} />
    </>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="inline mr-2" size={18} />
      {label}
    </button>
  );
}

// ============================================
// DASHBOARD TAB - NOTIFICATIONS & ALERTS
// ============================================
function DashboardTab({ notifications, stats, bookings, setReturnExtensionOpen, setSelectedBooking }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const returningToday = bookings.filter(b => {
    if (b.rental_status !== 'Active') return false;
    const returnDate = new Date(b.end_date);
    returnDate.setHours(0, 0, 0, 0);
    return returnDate.getTime() === today.getTime();
  });

  const overdueReturns = bookings.filter(b => {
    if (b.rental_status !== 'Active') return false;
    const returnDate = new Date(b.end_date);
    returnDate.setHours(0, 0, 0, 0);
    return returnDate < today;
  });

  const upcomingBookings = bookings.filter(b => {
    if (b.rental_status !== 'Pending') return false;
    const startDate = new Date(b.start_date);
    const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 2;
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 text-lg">Real-time notifications and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Car} value={stats.total} label="Total Vehicles" color="blue" />
        <StatCard icon={Activity} value={stats.activeBookings} label="Active Rentals" color="orange" />
        <StatCard icon={Users} value={stats.totalCustomers} label="Total Customers" color="purple" />
        <StatCard icon={Calendar} value={stats.upcomingBookings} label="Upcoming Bookings" color="green" />
      </div>

      {/* Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Returns Due Today */}
        <NotificationCard
          title="Returns Due Today"
          icon={Clock}
          color="blue"
          count={returningToday.length}
          items={returningToday}
          onAction={(booking) => {
            setSelectedBooking(booking);
            setReturnExtensionOpen(true);
          }}
          emptyMessage="No returns due today"
          buttonText="Process Return/Extension"
          badgeText="TODAY"
        />

        {/* Overdue Returns */}
        <NotificationCard
          title="Overdue Returns"
          icon={AlertCircle}
          color="red"
          count={overdueReturns.length}
          items={overdueReturns}
          onAction={(booking) => {
            setSelectedBooking(booking);
            setReturnExtensionOpen(true);
          }}
          emptyMessage="No overdue returns! 🎉"
          buttonText="Process Urgently"
          isOverdue={true}
        />
      </div>

      {/* Upcoming Bookings Reminders */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="text-green-600" size={28} />
            Upcoming Bookings (Reminders)
          </h3>
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold">
            {upcomingBookings.length}
          </span>
        </div>

        {upcomingBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.map((booking) => {
              const daysUntil = Math.ceil((new Date(booking.start_date) - today) / (1000 * 60 * 60 * 24));
              const colorMap = { 0: 'orange', 1: 'yellow', 2: 'green' };
              const color = colorMap[daysUntil] || 'green';
              
              return (
                <div
                  key={booking.booking_id}
                  className={`border-2 border-${color}-200 rounded-xl p-4 hover:border-${color}-400 transition-all bg-${color}-50`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className={`text-${color}-600`} size={20} />
                      <div>
                        <p className="font-bold text-gray-900">{booking.customer_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">expects {booking.license_plate || 'N/A'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 bg-${color}-600 text-white rounded-lg font-bold text-sm`}>
                      {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `IN ${daysUntil} DAYS`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Date:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
                    <p><strong>Duration:</strong> {Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} days</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming bookings in the next 2 days</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, value, label, color }) {
  const colorMap = {
    blue: 'border-blue-500',
    orange: 'border-orange-500',
    purple: 'border-purple-500',
    green: 'border-green-500'
  };

  const iconColorMap = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    green: 'text-green-600'
  };

  const textColorMap = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    green: 'text-green-600'
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${colorMap[color]} transform hover:scale-105 transition-all`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={iconColorMap[color]} size={32} />
      </div>
      <h3 className={`text-3xl font-bold ${textColorMap[color]}`}>{value}</h3>
      <p className="text-gray-600 font-medium">{label}</p>
    </div>
  );
}

// Notification Card Component
function NotificationCard({ title, icon: Icon, color, count, items, onAction, emptyMessage, buttonText, badgeText, isOverdue }) {
  const colorClasses = {
    blue: {
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
      border: 'border-blue-200 hover:border-blue-400 bg-blue-50',
      button: 'bg-blue-600 hover:bg-blue-700',
      tagBg: 'bg-blue-600'
    },
    red: {
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-800',
      border: 'border-red-300 hover:border-red-400 bg-red-50',
      button: 'bg-red-600 hover:bg-red-700',
      tagBg: 'bg-red-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Icon className={classes.icon} size={28} />
          {title}
        </h3>
        <span className={`px-4 py-2 ${classes.badge} rounded-lg font-bold`}>
          {count}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => {
            const daysOverdue = isOverdue 
              ? Math.ceil((new Date() - new Date(item.end_date)) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={item.booking_id}
                className={`border-2 ${classes.border} rounded-xl p-4 transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isOverdue ? <AlertCircle className={classes.icon} size={20} /> : <Car className={classes.icon} size={20} />}
                    <div>
                      <p className="font-bold text-gray-900">{item.license_plate || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{item.customer_name || 'Unknown'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 ${classes.tagBg} text-white rounded-lg font-bold text-sm`}>
                    {isOverdue ? `${daysOverdue} DAY${daysOverdue > 1 ? 'S' : ''} LATE` : badgeText}
                  </span>
                </div>
                <button
                  onClick={() => onAction(item)}
                  className={`w-full px-4 py-2 ${classes.button} text-white rounded-lg transition-colors font-semibold`}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle size={48} className="text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// FLEET MANAGEMENT TAB
// ============================================
function FleetTab({ vehicles, filteredVehicles, stats, activeFilter, searchQuery, setActiveFilter, setSearchQuery, getStatusBadge, setVehicleDetailsOpen, setSelectedVehicle }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Fleet Management</h2>
        <p className="text-gray-600 text-lg">Manage vehicle fleet and track availability</p>
      </div>

      {/* Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <FilterCard
          icon={Car}
          value={stats.total}
          label="Total Vehicles"
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
          color="blue"
        />
        <FilterCard
          icon={CheckCircle}
          value={stats.available}
          label="Available"
          active={activeFilter === 'available'}
          onClick={() => setActiveFilter('available')}
          color="green"
        />
        <FilterCard
          icon={FileText}
          value={stats.rented}
          label="Rented Out"
          active={activeFilter === 'rented out'}
          onClick={() => setActiveFilter('rented out')}
          color="orange"
        />
        <FilterCard
          icon={Wrench}
          value={stats.garage}
          label="In Garage"
          active={activeFilter === 'in garage'}
          onClick={() => setActiveFilter('in garage')}
          color="blue"
        />
      </div>

      {/* Active Filter Badge */}
      {activeFilter !== 'all' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Showing:</span>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold text-sm flex items-center gap-2">
            {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Vehicles
            <button
              onClick={() => setActiveFilter('all')}
              className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by plate, make, model, or category..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-base"
          />
        </div>
      </div>

      {/* Results Count */}
      <div>
        <p className="text-gray-600 font-medium">
          Showing <span className="font-bold text-gray-900">{filteredVehicles.length}</span> of{' '}
          <span className="font-bold text-gray-900">{vehicles.length}</span> vehicles
        </p>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">License Plate</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Category</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Daily Rate</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Car className="text-blue-600" size={20} />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">{vehicle.license_plate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</div>
                      <div className="text-sm text-gray-500">{vehicle.year}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">
                        {vehicle.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600 text-lg">
                        KES {vehicle.daily_rate?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(vehicle.availability_status)}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setVehicleDetailsOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye size={20} />
                        <span className="text-sm font-semibold">View History</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Car size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-lg">
                      {searchQuery ? 'No vehicles found' : 'No vehicles available'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Filter Card Component
function FilterCard({ icon: Icon, value, label, active, onClick, color }) {
  const colorMap = {
    blue: active ? 'border-blue-500 ring-4 ring-blue-100' : 'border-transparent',
    green: active ? 'border-green-500 ring-4 ring-green-100' : 'border-transparent',
    orange: active ? 'border-orange-500 ring-4 ring-orange-100' : 'border-transparent'
  };

  const iconBgMap = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100'
  };

  const iconColorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  };

  const valueColorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-left transform hover:scale-105 border-2 ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 ${iconBgMap[color]} rounded-xl`}>
          <Icon className={iconColorMap[color]} size={28} />
        </div>
        {active && <div className={`w-3 h-3 bg-${color === 'blue' ? 'blue' : color === 'green' ? 'green' : 'orange'}-500 rounded-full animate-pulse`}></div>}
      </div>
      <h3 className={`text-4xl font-bold ${valueColorMap[color]} mb-1`}>{value}</h3>
      <p className="text-gray-600 font-medium">{label}</p>
      {active && <p className={`text-xs text-${color === 'blue' ? 'blue' : color === 'green' ? 'green' : 'orange'}-600 font-semibold mt-2`}>✓ Active Filter</p>}
    </button>
  );
}

// ============================================
// CUSTOMERS TAB
// ============================================
function CustomersTab({ customers, setCustomerDetailsOpen, setSelectedCustomer }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, active, past

  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_msisdn?.includes(searchQuery);

    // Type filter
    const matchesType = filterType === 'all' || 
      (filterType === 'active' && customer.active_bookings > 0) ||
      (filterType === 'past' && customer.active_bookings === 0 && customer.total_bookings > 0);

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h2>
        <p className="text-gray-600 text-lg">View all past and present customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
          <Users className="text-purple-600 mb-3" size={32} />
          <h3 className="text-3xl font-bold text-purple-600">{customers.length}</h3>
          <p className="text-gray-600 font-medium">Total Customers</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <Activity className="text-green-600 mb-3" size={32} />
          <h3 className="text-3xl font-bold text-green-600">
            {customers.filter(c => c.active_bookings > 0).length}
          </h3>
          <p className="text-gray-600 font-medium">Active Customers</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
          <History className="text-blue-600 mb-3" size={32} />
          <h3 className="text-3xl font-bold text-blue-600">
            {customers.filter(c => c.active_bookings === 0 && c.total_bookings > 0).length}
          </h3>
          <p className="text-gray-600 font-medium">Past Customers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-base"
            />
          </div>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-base font-medium"
          >
            <option value="all">All Customers</option>
            <option value="active">Active Customers</option>
            <option value="past">Past Customers</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div>
        <p className="text-gray-600 font-medium">
          Showing <span className="font-bold text-gray-900">{filteredCustomers.length}</span> of{' '}
          <span className="font-bold text-gray-900">{customers.length}</span> customers
        </p>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div
              key={customer.customer_id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-blue-400"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {customer.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{customer.name || 'Unknown'}</h3>
                  {customer.active_bookings > 0 ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                      Past Customer
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span>{customer.phone_msisdn || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span className="truncate">{customer.email || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Total Rentals</p>
                  <p className="text-lg font-bold text-blue-600">{customer.total_bookings || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="text-lg font-bold text-green-600">
                    KES {(customer.total_spent || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomer(customer);
                  setCustomerDetailsOpen(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                View Details
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">
              {searchQuery ? 'No customers found matching your search' : 'No customers available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// FUTURE BOOKINGS TAB
// ============================================
function BookingsTab({ bookings, setFutureBookingOpen }) {
  const [viewMode, setViewMode] = useState('list'); // list, calendar

  // Filter only future/upcoming bookings
  const futureBookings = bookings.filter(b => 
    b.status === 'Confirmed' || b.status === 'Pending'
  ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const today = new Date();

  // Group by timeframe
  const thisWeek = futureBookings.filter(b => {
    const days = Math.ceil((new Date(b.start_date) - today) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  });

  const nextWeek = futureBookings.filter(b => {
    const days = Math.ceil((new Date(b.start_date) - today) / (1000 * 60 * 60 * 24));
    return days > 7 && days <= 14;
  });

  const later = futureBookings.filter(b => {
    const days = Math.ceil((new Date(b.start_date) - today) / (1000 * 60 * 60 * 24));
    return days > 14;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Future Bookings</h2>
          <p className="text-gray-600 text-lg">Manage advance reservations and reminders</p>
        </div>
        <button
          onClick={() => setFutureBookingOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg font-semibold flex items-center gap-2"
        >
          <Plus size={20} />
          Create Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
          <Calendar className="text-blue-600 mb-3" size={32} />
          <h3 className="text-3xl font-bold text-blue-600">{futureBookings.length}</h3>
          <p className="text-gray-600 font-medium">Total Upcoming</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
          <Clock className="text-orange-600 mb-3" size={32} />
          <h3 className="text-3xl font-bold text-orange-600">{thisWeek.length}</h3>
          <p className="text-gray-600 font-medium">This Week</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
          <TrendingUp className="text-purple-600 mb-3" size={32} />
          <h3 className="text-3xl font-bold text-purple-600">{nextWeek.length}</h3>
          <p className="text-gray-600 font-medium">Next Week</p>
        </div>
      </div>

      {futureBookings.length > 0 ? (
        <div className="space-y-6">
          {/* This Week */}
          {thisWeek.length > 0 && (
            <BookingSection title="This Week" bookings={thisWeek} color="orange" />
          )}

          {/* Next Week */}
          {nextWeek.length > 0 && (
            <BookingSection title="Next Week" bookings={nextWeek} color="blue" />
          )}

          {/* Later */}
          {later.length > 0 && (
            <BookingSection title="Later" bookings={later} color="purple" />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <Calendar size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Future Bookings</h3>
          <p className="text-gray-500 mb-6">Create a new booking to get started</p>
          <button
            onClick={() => setFutureBookingOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Create Your First Booking
          </button>
        </div>
      )}
    </div>
  );
}

// Booking Section Component
function BookingSection({ title, bookings, color }) {
  const colorMap = {
    orange: {
      header: 'from-orange-500 to-orange-600',
      badge: 'bg-orange-100 text-orange-800',
      border: 'border-orange-200'
    },
    blue: {
      header: 'from-blue-500 to-blue-600',
      badge: 'bg-blue-100 text-blue-800',
      border: 'border-blue-200'
    },
    purple: {
      header: 'from-purple-500 to-purple-600',
      badge: 'bg-purple-100 text-purple-800',
      border: 'border-purple-200'
    }
  };

  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className={`bg-gradient-to-r ${colors.header} px-6 py-4`}>
        <h3 className="text-xl font-bold text-white flex items-center justify-between">
          <span>{title}</span>
          <span className="px-3 py-1 bg-white bg-opacity-20 rounded-lg">
            {bookings.length}
          </span>
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {bookings.map((booking) => {
          const daysUntil = Math.ceil((new Date(booking.start_date) - new Date()) / (1000 * 60 * 60 * 24));
          const duration = Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24));

          return (
            <div
              key={booking.booking_id}
              className={`border-2 ${colors.border} rounded-xl p-4 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{booking.customer_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{booking.license_plate || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 ${colors.badge} rounded-lg font-bold text-sm`}>
                  {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `IN ${daysUntil} DAYS`}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">End Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900">{duration} days</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-semibold text-green-600">
                    KES {(booking.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {booking.notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// DIALOG COMPONENTS
// ============================================

// Hire Out Dialog
function HireOutDialog({ open, onClose, onSuccess, vehicles }) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    start_date: '',
    end_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.customer_name || !formData.customer_phone || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/bookings/hire-out`, formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        toast.success('Vehicle hired out successfully!');
        onSuccess && onSuccess();
        onClose();
        setFormData({ vehicle_id: '', customer_name: '', customer_phone: '', customer_email: '', start_date: '', end_date: '', notes: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to hire out vehicle');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <DialogWrapper onClose={onClose} title="Hire Out a Car">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FormSelect
          label="Select Vehicle"
          value={formData.vehicle_id}
          onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
          options={vehicles.map(v => ({ value: v.vehicle_id, label: `${v.license_plate} - ${v.make} ${v.model}` }))}
          required
        />
        <FormInput label="Customer Name" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required />
        <FormInput label="Phone Number" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} required />
        <FormInput label="Email (Optional)" type="email" value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Start Date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
          <FormInput label="End Date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required min={formData.start_date || new Date().toISOString().split('T')[0]} />
        </div>

        <FormTextarea label="Notes (Optional)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold">
            {loading ? 'Processing...' : 'Hire Out Vehicle'}
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// Vehicle Details Dialog
function VehicleDetailsDialog({ open, onClose, vehicle, bookings }) {
  if (!open || !vehicle) return null;

  const vehicleBookings = bookings.filter(b => {
    const bookingVehicleId = b.vehicle_id || b.vehicle_ref?._id || b.vehicle_ref;
    const vehicleId = vehicle._id || vehicle.vehicle_id;
    return bookingVehicleId?.toString() === vehicleId?.toString();
  }).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  return (
    <DialogWrapper onClose={onClose} title={`Vehicle History - ${vehicle.license_plate}`}>
      <div className="p-6 space-y-6">
        {/* Vehicle Info */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <Car size={48} />
            <div>
              <h3 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h3>
              <p className="text-blue-100">{vehicle.year} • {vehicle.category}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100 text-sm">License Plate</p>
              <p className="font-bold text-lg">{vehicle.license_plate}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Daily Rate</p>
              <p className="font-bold text-lg">KES {vehicle.daily_rate?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Status</p>
              <p className="font-bold text-lg">{vehicle.availability_status}</p>
            </div>
          </div>
        </div>

        {/* Booking History */}
        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History size={24} />
            Booking History ({vehicleBookings.length})
          </h4>

          {vehicleBookings.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vehicleBookings.map((booking) => (
                <div key={booking.booking_id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{booking.customer_name || 'Unknown Customer'}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.rental_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {booking.rental_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <p><strong>From:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
                    <p><strong>To:</strong> {new Date(booking.end_date).toLocaleDateString()}</p>
                    <p><strong>Duration:</strong> {Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} days</p>
                    <p><strong>Revenue:</strong> <span className="text-green-600 font-semibold">KES {(booking.total_amount || 0).toLocaleString()}</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No booking history available</p>
          )}
        </div>
      </div>
    </DialogWrapper>
  );
}

// Return/Extension Dialog
function ReturnExtensionDialog({ open, onClose, booking, onSuccess }) {
  const [action, setAction] = useState('return');
  const [extensionDays, setExtensionDays] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (action === 'extend' && !extensionDays) {
      toast.error('Please enter extension days');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/bookings/${booking.rental_id || booking.booking_id}/return-extend`,
        { action, extension_days: extensionDays, payment_status: paymentStatus, notes },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        toast.success(action === 'return' ? 'Vehicle returned successfully!' : 'Booking extended successfully!');
        onSuccess && onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !booking) return null;

  return (
    <DialogWrapper onClose={onClose} title="Process Return/Extension">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Booking Info */}
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <p className="font-bold text-gray-900 mb-2">{booking.license_plate} - {booking.customer_name}</p>
          <p className="text-sm text-gray-600">Expected Return: {new Date(booking.end_date).toLocaleDateString()}</p>
        </div>

        {/* Action Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Select Action</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAction('return')}
              className={`p-4 rounded-lg border-2 transition-all ${action === 'return' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <CheckSquare size={24} className="mx-auto mb-2" />
              <p className="font-semibold">Mark as Returned</p>
            </button>
            <button
              type="button"
              onClick={() => setAction('extend')}
              className={`p-4 rounded-lg border-2 transition-all ${action === 'extend' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <RefreshCw size={24} className="mx-auto mb-2" />
              <p className="font-semibold">Extend Rental</p>
            </button>
          </div>
        </div>

        {/* Extension Fields */}
        {action === 'extend' && (
          <>
            <FormInput label="Extension Days" type="number" value={extensionDays} onChange={(e) => setExtensionDays(e.target.value)} required min="1" />
            <FormSelect
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              options={[{ value: 'Paid', label: 'Paid' }, { value: 'Pending', label: 'Pending' }]}
            />
          </>
        )}

        <FormTextarea label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold">Cancel</button>
          <button type="submit" disabled={loading} className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold ${action === 'return' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
            {loading ? 'Processing...' : action === 'return' ? 'Confirm Return' : 'Confirm Extension'}
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// Customer Details Dialog
function CustomerDetailsDialog({ open, onClose, customer, bookings }) {
  if (!open || !customer) return null;

  const customerBookings = bookings.filter(b => {
    const bookingCustomerId = b.customer_id || b.customer_ref?._id || b.customer_ref;
    const customerId = customer._id || customer.customer_id;
    return bookingCustomerId?.toString() === customerId?.toString();
  }).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  return (
    <DialogWrapper onClose={onClose} title="Customer Details">
      <div className="p-6 space-y-6">
        {/* Customer Info */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold">
              {customer.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{customer.name}</h3>
              <p className="text-purple-100">{customer.phone_msisdn}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-purple-100 text-sm">Total Rentals</p>
              <p className="font-bold text-lg">{customer.total_bookings || 0}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Total Spent</p>
              <p className="font-bold text-lg">KES {(customer.total_spent || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Status</p>
              <p className="font-bold text-lg">{customer.active_bookings > 0 ? 'Active' : 'Past'}</p>
            </div>
          </div>
        </div>

        {/* Booking History */}
        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-4">Rental History</h4>
          {customerBookings.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {customerBookings.map((booking) => (
                <div key={booking.booking_id} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <p className="font-bold">{booking.license_plate}</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${booking.rental_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{booking.rental_status}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Period: {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                    <p className="text-green-600 font-semibold">Amount: KES {(booking.total_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No rental history</p>
          )}
        </div>
      </div>
    </DialogWrapper>
  );
}

// Future Booking Dialog
function FutureBookingDialog({ open, onClose, onSuccess, vehicles, customers }) {
  const [formData, setFormData] = useState({ vehicle_id: '', customer_id: '', start_date: '', end_date: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.customer_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/bookings/future`, formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        toast.success('Future booking created successfully!');
        onSuccess && onSuccess();
        onClose();
        setFormData({ vehicle_id: '', customer_id: '', start_date: '', end_date: '', notes: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <DialogWrapper onClose={onClose} title="Create Future Booking">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FormSelect label="Select Vehicle" value={formData.vehicle_id} onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })} options={vehicles.map(v => ({ value: v.vehicle_id, label: `${v.license_plate} - ${v.make} ${v.model}` }))} required />
        <FormSelect label="Select Customer" value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} options={customers.map(c => ({ value: c.customer_id, label: `${c.name} - ${c.phone_msisdn}` }))} required />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Start Date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
          <FormInput label="End Date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required min={formData.start_date || new Date().toISOString().split('T')[0]} />
        </div>

        <FormTextarea label="Notes (Optional)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// Reusable Components
function DialogWrapper({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={28} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label} {props.required && <span className="text-red-500">*</span>}</label>
      <input {...props} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base" />
    </div>
  );
}

function FormSelect({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label} {props.required && <span className="text-red-500">*</span>}</label>
      <select {...props} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base">
        <option value="">-- Select --</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function FormTextarea({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <textarea {...props} rows="3" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base" />
    </div>
  );
}
