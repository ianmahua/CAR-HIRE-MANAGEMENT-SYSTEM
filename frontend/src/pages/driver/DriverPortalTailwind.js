import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Car, Users, History, Calendar, Bell, Settings, 
  LogOut, Menu, X, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

// Import Components
import Dashboard from '../../components/sections/Dashboard';
import Vehicles from '../../components/sections/Vehicles';
import Customers from '../../components/sections/Customers';
import Bookings from '../../components/sections/Bookings';
import HireHistory from '../../components/sections/HireHistory';
import Notifications from '../../components/sections/Notifications';
import VehicleRecords from '../../components/sections/VehicleRecords';

// Import Dialogs
import HireOutModal from '../../components/dialogs/HireOutModal';
import ReturnVehicleModal from '../../components/dialogs/ReturnVehicleModal';
import ExtendRentalModal from '../../components/dialogs/ExtendRentalModal';
import CustomerInfoModal from '../../components/dialogs/CustomerInfoModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Notification Automation Logic
const generateNotifications = (rentals, bookings) => {
  const notifications = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for returns due
  rentals.forEach(rental => {
    if (rental.rental_status === 'Active' && rental.end_date) {
      const returnDate = new Date(rental.end_date);
      returnDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        notifications.push({
          type: 'critical',
          title: 'Overdue Return',
          message: `${rental.vehicle_ref?.license_plate || 'Vehicle'} is overdue for return`,
          timestamp: new Date(),
          rental_id: rental._id
        });
      } else if (daysUntil === 0) {
        notifications.push({
          type: 'warning',
          title: 'Return Due Today',
          message: `${rental.vehicle_ref?.license_plate || 'Vehicle'} is due for return today`,
          timestamp: new Date(),
          rental_id: rental._id
        });
      } else if (daysUntil === 1) {
        notifications.push({
          type: 'warning',
          title: 'Return Due Tomorrow',
          message: `${rental.vehicle_ref?.license_plate || 'Vehicle'} is due for return tomorrow`,
          timestamp: new Date(),
          rental_id: rental._id
        });
      }
    }
  });

  // Check for upcoming bookings
  bookings.forEach(booking => {
    if (['Pending', 'Confirmed'].includes(booking.rental_status || booking.status)) {
      const startDate = new Date(booking.start_date);
      startDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil === 2) {
        notifications.push({
          type: 'warning',
          title: 'Booking Reminder',
          message: `Booking for ${booking.customer_name} starts in 2 days`,
          timestamp: new Date(),
          booking_id: booking._id || booking.booking_id
        });
      } else if (daysUntil === 1) {
        notifications.push({
          type: 'warning',
          title: 'Booking Tomorrow',
          message: `Booking for ${booking.customer_name} starts tomorrow`,
          timestamp: new Date(),
          booking_id: booking._id || booking.booking_id
        });
      } else if (daysUntil === 0) {
        notifications.push({
          type: 'critical',
          title: 'Booking Starts Today',
          message: `Booking for ${booking.customer_name} starts today`,
          timestamp: new Date(),
          booking_id: booking._id || booking.booking_id
        });
      }
    }
  });

  // Check for pending payments
  rentals.forEach(rental => {
    if (rental.payment_status === 'Pending' || rental.payment_status === 'Partial') {
      notifications.push({
        type: 'warning',
        title: 'Pending Payment',
        message: `Payment pending for ${rental.customer_ref?.name || 'customer'}`,
        timestamp: new Date(),
        rental_id: rental._id
      });
    }
  });

  return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export default function DriverPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Dialog states
  const [hireOutModalOpen, setHireOutModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [vehiclesRes, customersRes, rentalsRes] = await Promise.all([
        axios.get(`${API_URL}/api/vehicles`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/customers`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/rentals`, { headers }).catch(() => ({ data: { success: false } }))
      ]);

      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data || []);
      if (customersRes.data.success) setCustomers(customersRes.data.data || []);
      if (rentalsRes.data.success) {
        const rentalsData = rentalsRes.data.data || [];
        setRentals(rentalsData);
        
        // Transform rentals to bookings format
        const bookingsData = rentalsData
          .filter(r => ['Pending', 'Confirmed'].includes(r.rental_status))
          .map(r => ({
            ...r,
            booking_id: r.rental_id || r._id,
            customer_name: r.customer_ref?.name || 'Unknown',
            license_plate: r.vehicle_ref?.license_plate || 'N/A',
            start_date: r.start_date,
            end_date: r.end_date,
            total_amount: r.total_fee_gross || 0
          }));
        setBookings(bookingsData);
      }

      // Generate notifications
      const autoNotifications = generateNotifications(rentalsRes.data.data || [], bookings);
      setNotifications(autoNotifications);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const stats = {
    activeRentals: rentals.filter(r => r.rental_status === 'Active').length,
    availableVehicles: vehicles.filter(v => v.availability_status === 'Parking').length,
    revenueThisWeek: rentals
      .filter(r => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(r.start_date || 0) >= weekAgo && r.rental_status === 'Completed';
      })
      .reduce((sum, r) => sum + (r.total_fee_gross || 0), 0),
    returnsToday: rentals.filter(r => {
      if (r.rental_status !== 'Active') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(r.end_date);
      returnDate.setHours(0, 0, 0, 0);
      return returnDate.getTime() === today.getTime();
    }).length
  };

  // Upcoming returns
  const upcomingReturns = rentals
    .filter(r => {
      if (r.rental_status !== 'Active') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(r.end_date);
      returnDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 3;
    })
    .map(r => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(r.end_date);
      returnDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
      return {
        ...r,
        licensePlate: r.vehicle_ref?.license_plate || 'N/A',
        customerName: r.customer_ref?.name || 'Unknown',
        endDate: r.end_date,
        daysUntil,
        isOverdue: daysUntil < 0,
        isToday: daysUntil === 0
      };
    });

  // Upcoming bookings
  const upcomingBookings = bookings
    .filter(b => {
      const startDate = new Date(b.start_date);
      startDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 2;
    })
    .map(b => {
      const startDate = new Date(b.start_date);
      startDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
      return {
        ...b,
        daysUntil,
        isToday: daysUntil === 0
      };
    });

  // Handlers
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleHireOut = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/rentals`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Car hired out successfully!');
        fetchAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to hire out car');
    }
  };

  const handleReturn = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/api/rentals/${selectedRental._id}/return`, data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Vehicle marked as returned');
        fetchAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark vehicle as returned');
    }
  };

  const handleExtend = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/api/rentals/${selectedRental._id}/extend`, data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Rental extended successfully');
        fetchAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to extend rental');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'records', label: 'Vehicle Records', icon: Car },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'history', label: 'Hire History', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading Driver Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-bold text-indigo-600">Driver Portal</h1>
          <button
            onClick={() => setHireOutModalOpen(true)}
            className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Car className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">RESSEY TOURS</h2>
                  <p className="text-sm text-indigo-100">Driver Portal</p>
                </div>
              </div>
              {user && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-indigo-100">Welcome back,</p>
                  <p className="font-semibold">{user.name || 'Driver'}</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold">{item.label}</span>
                        {item.id === 'notifications' && notifications.length > 0 && (
                          <span className="ml-auto px-2 py-1 bg-rose-500 text-white text-xs rounded-full font-bold">
                            {notifications.length}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-white shadow-lg sticky top-0 z-30">
            <div className="flex items-center justify-between p-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
                </h1>
              </div>
              <button
                onClick={() => setHireOutModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Hire Out Car
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                upcomingReturns={upcomingReturns}
                upcomingBookings={upcomingBookings}
                notifications={notifications}
                onViewVehicles={() => setActiveTab('vehicles')}
                onViewBookings={() => setActiveTab('bookings')}
                onViewReturns={() => setActiveTab('bookings')}
                onViewNotifications={() => setActiveTab('notifications')}
              />
            )}

            {activeTab === 'vehicles' && (
              <Vehicles
                vehicles={vehicles}
                onVehicleClick={(vehicle) => {
                  setSelectedVehicle(vehicle);
                  setActiveTab('records');
                }}
              />
            )}

            {activeTab === 'customers' && (
              <Customers
                customers={customers}
                onCustomerClick={(customer) => {
                  setSelectedCustomer(customer);
                  setCustomerModalOpen(true);
                }}
              />
            )}

            {activeTab === 'records' && (
              <VehicleRecords
                vehicle={selectedVehicle}
                rentals={rentals}
              />
            )}

            {activeTab === 'bookings' && (
              <Bookings
                bookings={bookings}
                onCreateBooking={() => setBookingModalOpen(true)}
              />
            )}

            {activeTab === 'history' && (
              <HireHistory rentals={rentals.filter(r => r.rental_status === 'Completed')} />
            )}

            {activeTab === 'notifications' && (
              <Notifications notifications={notifications} />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
                <p className="text-gray-600">Settings panel coming soon</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <HireOutModal
        isOpen={hireOutModalOpen}
        onClose={() => setHireOutModalOpen(false)}
        vehicles={vehicles}
        customers={customers}
        onSubmit={handleHireOut}
      />

      <ReturnVehicleModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedRental(null);
        }}
        rental={selectedRental}
        onSubmit={handleReturn}
      />

      <ExtendRentalModal
        isOpen={extendModalOpen}
        onClose={() => {
          setExtendModalOpen(false);
          setSelectedRental(null);
        }}
        rental={selectedRental}
        onSubmit={handleExtend}
      />

      <CustomerInfoModal
        isOpen={customerModalOpen}
        onClose={() => {
          setCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        rentals={rentals}
      />
    </div>
  );
}

