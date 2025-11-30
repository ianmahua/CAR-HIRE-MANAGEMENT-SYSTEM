import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Car, Users, History, Calendar, Bell, Settings, 
  LogOut, Menu, X, Plus, User, CheckCircle, RefreshCw
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
import CreateBookingModal from '../../components/dialogs/CreateBookingModal';
import ProfilePictureDialog from '../../components/dialogs/ProfilePictureDialog';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Notification Automation Logic
const generateNotifications = (rentals = [], bookings = []) => {
  const notifications = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Ensure rentals and bookings are arrays
  const rentalsArray = Array.isArray(rentals) ? rentals : [];
  const bookingsArray = Array.isArray(bookings) ? bookings : [];

  // Check for returns due
  rentalsArray.forEach(rental => {
    if (!rental) return;
    
    if (rental.rental_status === 'Active' && rental.end_date) {
      try {
        const returnDate = new Date(rental.end_date);
        if (isNaN(returnDate.getTime())) return; // Invalid date
        
        returnDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));

        const vehicleInfo = rental.vehicle_ref?.license_plate || 
          (rental.vehicle_ref?.make && rental.vehicle_ref?.model 
            ? `${rental.vehicle_ref.make} ${rental.vehicle_ref.model}` 
            : 'Vehicle');

        if (daysUntil < 0) {
          notifications.push({
            type: 'critical',
            title: 'Overdue Return',
            message: `${vehicleInfo} is overdue for return`,
            description: `Return was due ${Math.abs(daysUntil)} day${Math.abs(daysUntil) > 1 ? 's' : ''} ago`,
            timestamp: new Date(),
            rental_id: rental._id || rental.rental_id
          });
        } else if (daysUntil === 0) {
          notifications.push({
            type: 'warning',
            title: 'Return Due Today',
            message: `${vehicleInfo} is due for return today`,
            description: rental.customer_ref?.name ? `Customer: ${rental.customer_ref.name}` : '',
            timestamp: new Date(),
            rental_id: rental._id || rental.rental_id
          });
        } else if (daysUntil === 1) {
          notifications.push({
            type: 'warning',
            title: 'Return Due Tomorrow',
            message: `${vehicleInfo} is due for return tomorrow`,
            description: rental.customer_ref?.name ? `Customer: ${rental.customer_ref.name}` : '',
            timestamp: new Date(),
            rental_id: rental._id || rental.rental_id
          });
        }
      } catch (error) {
        console.error('Error processing rental notification:', error);
      }
    }
  });

  // Check for upcoming bookings
  bookingsArray.forEach(booking => {
    if (!booking) return;
    
    if (['Pending', 'Confirmed'].includes(booking.rental_status || booking.status)) {
      try {
        if (!booking.start_date) return;
        
        const startDate = new Date(booking.start_date);
        if (isNaN(startDate.getTime())) return; // Invalid date
        
        startDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

        const customerName = booking.customer_name || booking.customer_ref?.name || 'Customer';

        if (daysUntil === 2) {
          notifications.push({
            type: 'warning',
            title: 'Booking Reminder',
            message: `Booking for ${customerName} starts in 2 days`,
            description: booking.vehicle_request || booking.license_plate || '',
            timestamp: new Date(),
            booking_id: booking._id || booking.booking_id
          });
        } else if (daysUntil === 1) {
          notifications.push({
            type: 'warning',
            title: 'Booking Tomorrow',
            message: `Booking for ${customerName} starts tomorrow`,
            description: booking.vehicle_request || booking.license_plate || '',
            timestamp: new Date(),
            booking_id: booking._id || booking.booking_id
          });
        } else if (daysUntil === 0) {
          notifications.push({
            type: 'critical',
            title: 'Booking Starts Today',
            message: `Booking for ${customerName} starts today`,
            description: booking.vehicle_request || booking.license_plate || '',
            timestamp: new Date(),
            booking_id: booking._id || booking.booking_id
          });
        }
      } catch (error) {
        console.error('Error processing booking notification:', error);
      }
    }
  });

  // Check for pending payments
  rentalsArray.forEach(rental => {
    if (!rental) return;
    
    if (rental.payment_status === 'Pending' || rental.payment_status === 'Partial') {
      const customerName = rental.customer_ref?.name || 'customer';
      notifications.push({
        type: 'warning',
        title: 'Pending Payment',
        message: `Payment pending for ${customerName}`,
        description: rental.vehicle_ref?.license_plate || '',
        timestamp: new Date(),
        rental_id: rental._id || rental.rental_id
      });
    }
  });

  // Remove duplicates based on rental_id/booking_id and type
  const uniqueNotifications = [];
  const seen = new Set();
  
  notifications.forEach(notif => {
    const key = `${notif.type}-${notif.rental_id || notif.booking_id || notif.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNotifications.push(notif);
    }
  });

  return uniqueNotifications.sort((a, b) => {
    // Sort by priority: critical > warning > success
    const priority = { critical: 3, warning: 2, success: 1 };
    const priorityDiff = (priority[b.type] || 0) - (priority[a.type] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    // Then by timestamp
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};

export default function DriverPortal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false);
  const [driverProfile, setDriverProfile] = useState(null);

  // Fetch all data
  const fetchAllData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [vehiclesRes, customersRes, rentalsRes] = await Promise.all([
        axios.get(`${API_URL}/api/vehicles`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/customers`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/rentals`, { headers }).catch(() => ({ data: { success: false } }))
      ]);

      if (vehiclesRes.data.success) {
        setVehicles(vehiclesRes.data.data || []);
      } else {
        // Fallback mock data for testing
        setVehicles([
          { _id: '1', license_plate: 'KDA 001A', make: 'Toyota', model: 'Prado', year: 2020, category: 'SUV', daily_rate: 6500, availability_status: 'Parking' },
          { _id: '2', license_plate: 'KDC 002B', make: 'Nissan', model: 'X-Trail', year: 2018, category: 'SUV', daily_rate: 4500, availability_status: 'Rented Out' },
          { _id: '3', license_plate: 'KBB 333Z', make: 'Subaru', model: 'Forester', year: 2019, category: 'Compact', daily_rate: 4000, availability_status: 'Parking' }
        ]);
      }

      if (customersRes.data.success) {
        setCustomers(customersRes.data.data || []);
      } else {
        setCustomers([
          { _id: '1', name: 'John Doe', phone: '254712345678', email: 'john@example.com', total_bookings: 5, total_spent: 150000 },
          { _id: '2', name: 'Jane Smith', phone: '254723456789', email: 'jane@example.com', total_bookings: 3, total_spent: 90000 }
        ]);
      }

      let rentalsData = [];
      let bookingsData = [];

      if (rentalsRes.data.success) {
        rentalsData = rentalsRes.data.data || [];
        setRentals(rentalsData);
        
        // Transform rentals to bookings format
        bookingsData = rentalsData
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
      } else {
        // Mock rental data for testing
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const mockRentals = [
          {
            _id: '1',
            rental_status: 'Active',
            start_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: today.toISOString(),
            total_fee_gross: 35000,
            vehicle_ref: { license_plate: 'KDC 002B', _id: '2' },
            customer_ref: { name: 'John Doe', _id: '1' }
          }
        ];
        rentalsData = mockRentals;
        bookingsData = [];
        setRentals(mockRentals);
        setBookings([]);
      }

      // Generate notifications using the current data
      const autoNotifications = generateNotifications(rentalsData, bookingsData);
      setNotifications(autoNotifications);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (showLoading) {
        toast.error('Failed to load data');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initial load with loading indicator
    fetchAllData(true);
    
    // Auto-refresh every 2 minutes (120000ms) without showing loading
    const interval = setInterval(() => {
      fetchAllData(false); // Silent refresh - no loading state
    }, 120000); // Changed to 2 minutes for less frequent updates
    
    return () => clearInterval(interval);
  }, []);

  // Calculate stats (NO REVENUE - Driver should not see money)
  const stats = {
    activeRentals: rentals.filter(r => r.rental_status === 'Active').length || 0,
    availableVehicles: vehicles.filter(v => v.availability_status === 'Parking').length || 0,
    totalCustomers: customers.length || 0,
    returnsToday: rentals.filter(r => {
      if (r.rental_status !== 'Active' || !r.end_date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(r.end_date);
      returnDate.setHours(0, 0, 0, 0);
      return returnDate.getTime() === today.getTime();
    }).length || 0
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
    try {
      // Clear all auth data
      logout(); // Clear token and user state from AuthContext
      localStorage.removeItem('token'); // Ensure token is removed
      
      // Clear any other stored data if needed
      localStorage.removeItem('user');
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Navigate to login - use window.location for a clean redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if there's an error
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleHireOut = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/rentals`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Car hired out successfully!');
        fetchAllData(false); // Silent refresh after action
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
        fetchAllData(false); // Silent refresh after action
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
        fetchAllData(false); // Silent refresh after action
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to extend rental');
    }
  };

  const handleCreateBooking = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Format the booking data
      const bookingData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: '', // Optional, can be added to form later
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_request: `${formData.vehicle_make} ${formData.vehicle_model}`, // Combined for display
        start_date: formData.start_date,
        end_date: formData.end_date,
        price_per_day: parseFloat(formData.price_per_day),
        destination: formData.destination || '',
        notes: formData.notes || ''
      };
      
      const response = await axios.post(`${API_URL}/api/bookings/create`, bookingData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success('Booking created successfully!');
        fetchAllData(false); // Silent refresh after action
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create booking';
      toast.error(errorMessage);
    }
  };

  // Mark vehicle as returned
  const handleMarkAsReturned = async (booking) => {
    const confirmed = window.confirm(
      `Confirm that ${booking.customerName} has returned ${booking.licensePlate}?`
    );
    
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const bookingId = booking.booking_id || booking._id || booking.rental_id;
      
      const response = await axios.post(
        `${API_URL}/api/bookings/${bookingId}/mark-returned`,
        {
          actual_return_date: new Date(),
          notes: 'Vehicle returned on time'
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`${booking.licensePlate} marked as returned! Status changed to Available.`);
        fetchAllData(false); // Silent refresh after action
      }
    } catch (error) {
      console.error('Error marking as returned:', error);
      toast.error('Failed to mark vehicle as returned');
    }
  };

  // Client extending rental
  const handleClientExtending = (booking) => {
    setSelectedRental(booking);
    setExtendModalOpen(true);
  };

  // Fetch driver profile
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/driver/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setDriverProfile(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching driver profile:', error);
        // Use user from auth context as fallback
        if (user) {
          setDriverProfile({ name: user.name, email: user.email });
        }
      }
    };

    if (user) {
      fetchDriverProfile();
    }
  }, [user]);

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
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setHireOutModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Hire Out Car
                </button>
                
                {/* Notification Bell */}
                <button 
                  onClick={() => setActiveTab('notifications')} 
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Bell size={24} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Profile Picture */}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {driverProfile?.profile_picture ? (
                      <img
                        src={`${API_URL}${driverProfile.profile_picture}`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {driverProfile?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'D'}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-gray-900">{driverProfile?.name || user?.name || 'Driver'}</p>
                      <p className="text-xs text-gray-500">Driver</p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setProfilePictureDialogOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <User size={18} />
                        <span>Change Picture</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
                onProcessReturn={(rental) => {
                  setSelectedRental(rental);
                  setReturnModalOpen(true);
                }}
                onExtendRental={(rental) => {
                  setSelectedRental(rental);
                  setExtendModalOpen(true);
                }}
                onMarkAsReturned={handleMarkAsReturned}
                onClientExtending={handleClientExtending}
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
                vehicles={vehicles}
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
        onSuccess={() => {
          fetchAllData(false); // Silent refresh after action
          setExtendModalOpen(false);
          setSelectedRental(null);
        }}
      />
      
      {/* Profile Picture Dialog */}
      {profilePictureDialogOpen && (
        <ProfilePictureDialog
          open={profilePictureDialogOpen}
          onClose={() => setProfilePictureDialogOpen(false)}
          onSuccess={() => {
            fetchAllData(false); // Silent refresh after action
            // Re-fetch profile
            const token = localStorage.getItem('token');
            axios.get(`${API_URL}/api/driver/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
              if (res.data.success) {
                setDriverProfile(res.data.data);
              }
            }).catch(err => {
              console.error('Error fetching profile after upload:', err);
            });
          }}
        />
      )}

      <CustomerInfoModal
        isOpen={customerModalOpen}
        onClose={() => {
          setCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        rentals={rentals}
      />

      <CreateBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        vehicles={vehicles}
        customers={customers}
        onSubmit={handleCreateBooking}
      />
    </div>
  );
}

