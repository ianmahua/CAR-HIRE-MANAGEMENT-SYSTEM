import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip,
  IconButton,
  Badge,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Fade,
  Zoom,
  Tooltip,
  Paper,
  Stack
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import VehicleRecordModal from '../../components/driver/VehicleRecordModal';
import BookingsList from '../../components/driver/BookingsList';
import CustomersList from '../../components/driver/CustomersList';
import NotificationsPanel from '../../components/driver/NotificationsPanel';
import ExtensionDialog from '../../components/driver/ExtensionDialog';
import NewBookingDialog from '../../components/NewBookingDialog';
import HireOutCarDialog from '../../components/HireOutCarDialog';

const drawerWidth = 280;

// Time-based greeting function
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function DriverPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Dialog states
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [hireOutDialogOpen, setHireOutDialogOpen] = useState(false);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Filters and search
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [vehiclesRes, customersRes, rentalsRes, notificationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/vehicles`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/customers`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/rentals`, { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API_URL}/api/notifications/driver`, { headers }).catch(() => ({ data: { success: false } }))
      ]);

      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data || []);
      if (customersRes.data.success) setCustomers(customersRes.data.data || []);
      if (rentalsRes.data.success) {
        const rentalsData = rentalsRes.data.data || [];
        setRentals(rentalsData);
        // Transform rentals to bookings format
        setBookings(rentalsData.map(r => ({
          ...r,
          booking_id: r.rental_id || r._id,
          rental_id: r.rental_id,
          vehicle_id: r.vehicle_ref?._id || r.vehicle_ref,
          customer_id: r.customer_ref?._id || r.customer_ref,
          license_plate: r.vehicle_ref?.license_plate || 'N/A',
          customer_name: r.customer_ref?.name || 'Unknown',
          start_date: r.start_date,
          end_date: r.end_date,
          rental_status: r.rental_status,
          total_amount: r.total_fee_gross || 0
        })));
      }
      if (notificationsRes.data.success) setNotifications(notificationsRes.data.notifications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleModalOpen(true);
  };

  const handleReturnExtension = (booking) => {
    setSelectedBooking(booking);
    setExtensionDialogOpen(true);
  };

  // Calculate dashboard stats
  const stats = {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter(v => v.availability_status?.toLowerCase() === 'parking').length,
    rentedVehicles: vehicles.filter(v => v.availability_status?.toLowerCase() === 'rented out').length,
    activeRentals: bookings.filter(b => b.rental_status === 'Active').length,
    totalCustomers: customers.length,
    revenueThisWeek: bookings
      .filter(b => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(b.start_date || 0) >= weekAgo && b.rental_status === 'Completed';
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
    pendingPayments: bookings
      .filter(b => b.payment_status === 'Pending' || b.payment_status === 'Partial')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
    returnsToday: bookings.filter(b => {
      if (b.rental_status !== 'Active') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(b.end_date);
      returnDate.setHours(0, 0, 0, 0);
      return returnDate.getTime() === today.getTime();
    }).length
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = !vehicleSearch || 
      v.license_plate?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.make?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model?.toLowerCase().includes(vehicleSearch.toLowerCase());
    
    const matchesFilter = vehicleFilter === 'all' ||
      (vehicleFilter === 'available' && v.availability_status?.toLowerCase() === 'parking') ||
      (vehicleFilter === 'rented' && v.availability_status?.toLowerCase() === 'rented out') ||
      (vehicleFilter === 'garage' && v.availability_status?.toLowerCase() === 'in garage');
    
    return matchesSearch && matchesFilter;
  });

  // Get upcoming returns and reminders
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReturns = bookings.filter(b => {
    if (b.rental_status !== 'Active') return false;
    const returnDate = new Date(b.end_date);
    returnDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 3;
  }).map(b => {
    const returnDate = new Date(b.end_date);
    returnDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
    return { ...b, daysUntil, isOverdue: daysUntil < 0, isToday: daysUntil === 0 };
  });

  const upcomingBookings = bookings.filter(b => {
    if (!['Pending', 'Confirmed'].includes(b.rental_status)) return false;
    const startDate = new Date(b.start_date);
    startDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 2;
  }).map(b => {
    const startDate = new Date(b.start_date);
    startDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    return { ...b, daysUntil, isToday: daysUntil === 0 };
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'vehicles', label: 'Vehicles', icon: CarIcon },
    { id: 'customers', label: 'Customers', icon: PeopleIcon },
    { id: 'bookings', label: 'Upcoming Bookings', icon: CalendarIcon },
    { id: 'history', label: 'Hire History', icon: HistoryIcon },
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ 
        background: 'linear-gradient(135deg, #007BFF 0%, #00A6FF 100%)',
        color: 'white',
        minHeight: '80px !important',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexDirection: 'column',
        py: 2
      }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56, mb: 1 }}>
          <CarIcon />
        </Avatar>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            RESSEY TOURS
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Driver Portal
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.95, fontWeight: 500 }}>
              {user.name || 'Driver'}
            </Typography>
          )}
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => setActiveView(item.id)}
                sx={{
                  borderRadius: 3,
                  bgcolor: isActive ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                  color: isActive ? '#007BFF' : '#6b7280',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(0, 123, 255, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.25s ease'
                  },
                  transition: 'all 0.25s ease',
                  py: 1.5
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? '#007BFF' : 'inherit' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem'
                  }}
                />
                {item.id === 'notifications' && notifications.length > 0 && (
                  <Badge badgeContent={notifications.length} color="error" />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            color: '#dc2626',
            '&:hover': {
              bgcolor: 'rgba(220, 38, 38, 0.1)'
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  const renderDashboard = () => (
    <Box>
      {/* Stats Cards - Clickable */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={300}>
            <Card 
              onClick={() => setActiveView('bookings')}
              sx={{ 
                borderRadius: 4,
                background: 'linear-gradient(135deg, #007BFF 0%, #00A6FF 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(0, 123, 255, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 16px 40px rgba(0, 123, 255, 0.5)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Active Rentals
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {stats.activeRentals}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      Click to view →
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <CarIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={400}>
            <Card 
              onClick={() => {
                setActiveView('vehicles');
                setVehicleFilter('available');
              }}
              sx={{ 
                borderRadius: 4,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 16px 40px rgba(16, 185, 129, 0.5)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Vehicles Free
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {stats.availableVehicles}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      Click to view →
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={500}>
            <Card 
              onClick={() => setActiveView('vehicles')}
              sx={{ 
                borderRadius: 4,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 16px 40px rgba(245, 158, 11, 0.5)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Revenue This Week
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      KES {(stats.revenueThisWeek / 1000).toFixed(0)}K
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      View details →
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <TrendingUpIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={600}>
            <Card 
              onClick={() => {
                setActiveView('bookings');
                // Filter to show returns today
              }}
              sx={{ 
                borderRadius: 4,
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 16px 40px rgba(239, 68, 68, 0.5)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Returns Today
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {stats.returnsToday}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                      Click to process →
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <ScheduleIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Notifications Panel - Prominent */}
      {notifications.length > 0 && (
        <Card sx={{ 
          borderRadius: 4, 
          mb: 4, 
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
          border: '2px solid #FEE2E2',
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon sx={{ fontSize: 32, color: '#EF4444' }} />
                </Badge>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    Important Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notifications.length} new notification{notifications.length > 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                onClick={() => setActiveView('notifications')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                View All
              </Button>
            </Box>
            <Stack spacing={1.5}>
              {notifications.slice(0, 3).map((notif, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'white',
                    borderLeft: '4px solid #EF4444',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {notif.message || notif.title || 'New notification'}
                  </Typography>
                  {notif.timestamp && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.timestamp).toLocaleString()}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Fleet Management Section */}
      <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
                Fleet Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quick view of all company vehicles
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setActiveView('vehicles')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              View All Vehicles
            </Button>
          </Box>

          {/* Fleet Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card 
                onClick={() => {
                  setActiveView('vehicles');
                  setVehicleFilter('all');
                }}
                sx={{ 
                  borderRadius: 3,
                  border: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: '#1E3A8A',
                    boxShadow: '0 8px 24px rgba(30, 58, 138, 0.2)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <CarIcon sx={{ fontSize: 32, color: '#1E3A8A', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {stats.totalVehicles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Fleet
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card 
                onClick={() => {
                  setActiveView('vehicles');
                  setVehicleFilter('available');
                }}
                sx={{ 
                  borderRadius: 3,
                  border: '2px solid #e5e7eb',
                  bgcolor: '#ECFDF5',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: '#059669',
                    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.2)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: '#059669', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                    {stats.availableVehicles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card 
                onClick={() => {
                  setActiveView('vehicles');
                  setVehicleFilter('rented');
                }}
                sx={{ 
                  borderRadius: 3,
                  border: '2px solid #e5e7eb',
                  bgcolor: '#FFFBEB',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: '#D97706',
                    boxShadow: '0 8px 24px rgba(217, 119, 6, 0.2)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <CarIcon sx={{ fontSize: 32, color: '#D97706', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#D97706' }}>
                    {stats.rentedVehicles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rented Out
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card 
                onClick={() => {
                  setActiveView('vehicles');
                  setVehicleFilter('garage');
                }}
                sx={{ 
                  borderRadius: 3,
                  border: '2px solid #e5e7eb',
                  bgcolor: '#EFF6FF',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: '#2563EB',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <WarningIcon sx={{ fontSize: 32, color: '#2563EB', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563EB' }}>
                    {vehicles.filter(v => v.availability_status?.toLowerCase() === 'in garage').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Garage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Vehicle List */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E3A8A' }}>
              Recent Vehicles
            </Typography>
            <Grid container spacing={2}>
              {vehicles.slice(0, 6).map((vehicle, idx) => (
                <Grid item xs={12} sm={6} md={4} key={vehicle._id || vehicle.vehicle_id}>
                  <Card
                    onClick={() => handleVehicleClick(vehicle)}
                    sx={{
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e5e7eb',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        borderColor: '#007BFF'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar sx={{ bgcolor: '#007BFF', width: 40, height: 40 }}>
                          <CarIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {vehicle.license_plate}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {vehicle.make} {vehicle.model}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={vehicle.availability_status}
                        size="small"
                        sx={{
                          bgcolor: vehicle.availability_status === 'Parking' ? '#ECFDF5' : 
                                   vehicle.availability_status === 'Rented Out' ? '#FEF2F2' : '#EFF6FF',
                          color: vehicle.availability_status === 'Parking' ? '#059669' : 
                                 vehicle.availability_status === 'Rented Out' ? '#DC2626' : '#2563EB',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Upcoming Returns & Reminders */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                  Upcoming Returns
                </Typography>
                <Badge badgeContent={upcomingReturns.length} color="error">
                  <WarningIcon sx={{ color: '#F59E0B' }} />
                </Badge>
              </Box>
              <Stack spacing={2}>
                {upcomingReturns.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                    <Typography color="text.secondary">No upcoming returns</Typography>
                  </Box>
                ) : (
                  upcomingReturns.map((booking, idx) => {
                    const color = booking.isOverdue ? '#EF4444' : booking.isToday ? '#F59E0B' : '#3B82F6';
                    const bgColor = booking.isOverdue ? '#FEF2F2' : booking.isToday ? '#FFFBEB' : '#EFF6FF';
  return (
                      <Zoom in timeout={300 + idx * 100} key={booking.booking_id || idx}>
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: bgColor,
                            borderLeft: `4px solid ${color}`,
                            transition: 'all 0.25s ease',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {booking.license_plate}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {booking.customer_name}
                              </Typography>
                            </Box>
                            <Chip
                              label={booking.isOverdue ? 'OVERDUE' : booking.isToday ? 'TODAY' : `${booking.daysUntil} DAYS`}
                              size="small"
                              sx={{
                                bgcolor: color,
                                color: 'white',
                                fontWeight: 700
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Return: {new Date(booking.end_date).toLocaleDateString()}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleReturnExtension(booking)}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                borderColor: color,
                                color: color,
                                '&:hover': { borderColor: color, bgcolor: `${color}10` }
                              }}
                            >
                              Process
                            </Button>
                          </Box>
                        </Paper>
                      </Zoom>
                    );
                  })
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                  Booking Reminders
                </Typography>
                <Badge badgeContent={upcomingBookings.length} color="info">
                  <InfoIcon sx={{ color: '#3B82F6' }} />
                </Badge>
              </Box>
              <Stack spacing={2}>
                {upcomingBookings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CalendarIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                    <Typography color="text.secondary">No upcoming bookings</Typography>
                  </Box>
                ) : (
                  upcomingBookings.map((booking, idx) => {
                    const color = booking.isToday ? '#F59E0B' : '#3B82F6';
                    const bgColor = booking.isToday ? '#FFFBEB' : '#EFF6FF';
  return (
                      <Zoom in timeout={300 + idx * 100} key={booking.booking_id || idx}>
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: bgColor,
                            borderLeft: `4px solid ${color}`,
                            transition: 'all 0.25s ease',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {booking.customer_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {booking.license_plate} • {new Date(booking.start_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Chip
                              label={booking.isToday ? 'TODAY' : `${booking.daysUntil} DAYS`}
                              size="small"
                              sx={{
                                bgcolor: color,
                                color: 'white',
                                fontWeight: 700
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Amount: KES {(booking.total_amount || 0).toLocaleString()}
                          </Typography>
                        </Paper>
                      </Zoom>
                    );
                  })
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderVehicles = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
            Vehicle Records
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all company vehicles and their rental history
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchAllData}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Refresh
        </Button>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search by plate, make, model..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter Status</InputLabel>
                <Select
                  value={vehicleFilter}
                  label="Filter Status"
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Vehicles</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="rented">Rented Out</MenuItem>
                  <MenuItem value="garage">In Garage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <Grid container spacing={3}>
        {filteredVehicles.map((vehicle, idx) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle._id || vehicle.vehicle_id}>
            <Fade in timeout={200 + idx * 50}>
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardActionArea onClick={() => handleVehicleClick(vehicle)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#007BFF', width: 56, height: 56 }}>
                        <CarIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {vehicle.license_plate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={vehicle.availability_status}
                        size="small"
                        sx={{
                          bgcolor: vehicle.availability_status === 'Parking' ? '#ECFDF5' : 
                                   vehicle.availability_status === 'Rented Out' ? '#FEF2F2' : '#EFF6FF',
                          color: vehicle.availability_status === 'Parking' ? '#059669' : 
                                 vehicle.availability_status === 'Rented Out' ? '#DC2626' : '#2563EB',
                          fontWeight: 600
                        }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                        KES {vehicle.daily_rate?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: '#007BFF',
                        color: '#007BFF',
                        '&:hover': {
                          borderColor: '#0056B3',
                          bgcolor: '#EFF6FF'
                        }
                      }}
                    >
                      View History
                    </Button>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {filteredVehicles.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CarIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No vehicles found
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (loading) {
  return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ width: 300, mb: 2 }} />
          <Typography>Loading Driver Portal...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid #e5e7eb'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f9fafb'
        }}
      >
        {/* Top App Bar */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                bgcolor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: '#f3f4f6' }
              }}
            >
              <MenuIcon />
            </IconButton>
            {activeView === 'dashboard' && user && (
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 0.5 }}>
                  {getGreeting()}, {user.name?.split(' ')[0] || 'Driver'}! 👋
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Here's your operational overview
                </Typography>
              </Box>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setHireOutDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(16, 185, 129, 0.5)',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              }
            }}
          >
            Hire Out Car
          </Button>
        </Box>

        <Container maxWidth="xl">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'vehicles' && renderVehicles()}
          {activeView === 'customers' && <CustomersList customers={customers} />}
          {activeView === 'bookings' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
                    Upcoming Bookings
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Manage future reservations and bookings
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setBookingDialogOpen(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #007BFF 0%, #00A6FF 100%)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    boxShadow: '0 4px 16px rgba(0, 123, 255, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 24px rgba(0, 123, 255, 0.4)'
                    }
                  }}
                >
          Create Booking
                </Button>
              </Box>
              <BookingsList />
            </Box>
          )}
          {activeView === 'history' && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 4 }}>
                Hire History
              </Typography>
              <Typography color="text.secondary">Historical rental records will be displayed here</Typography>
            </Box>
          )}
          {activeView === 'notifications' && <NotificationsPanel notifications={notifications} />}
          {activeView === 'settings' && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 4 }}>
                Settings
              </Typography>
              <Typography color="text.secondary">Settings panel coming soon</Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Modals and Dialogs */}
      {selectedVehicle && (
        <VehicleRecordModal
          open={vehicleModalOpen}
          onClose={() => {
            setVehicleModalOpen(false);
            setSelectedVehicle(null);
          }}
          vehicleId={selectedVehicle._id || selectedVehicle.vehicle_id}
          vehicle={selectedVehicle}
        />
      )}

      <NewBookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
      />

      <HireOutCarDialog
        open={hireOutDialogOpen}
        onClose={() => setHireOutDialogOpen(false)}
      />

      {selectedBooking && (
        <ExtensionDialog
          open={extensionDialogOpen}
          onClose={() => {
            setExtensionDialogOpen(false);
            setSelectedBooking(null);
          }}
          rental={selectedBooking}
        />
      )}
    </Box>
  );
}
