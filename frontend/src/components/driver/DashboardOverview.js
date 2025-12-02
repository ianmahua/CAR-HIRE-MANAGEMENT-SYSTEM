import React from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Assignment as RentedIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const DashboardOverview = ({ onHireOutClick, onCreateBookingClick, onViewNotifications }) => {
  // Fetch data
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery('vehicles', async () => {
    const response = await api.get('/api/vehicles');
    return response.data.data || [];
  });

  const { data: rentals, isLoading: rentalsLoading } = useQuery('rentals', async () => {
    try {
      const response = await api.get('/api/rentals');
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  });

  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const vehiclesDueToday = rentals?.filter(rental => {
    if (!rental.end_date || rental.rental_status !== 'Active') return false;
    const returnDate = new Date(rental.end_date);
    returnDate.setHours(0, 0, 0, 0);
    return returnDate.getTime() === today.getTime();
  }) || [];

  const upcomingBookings = rentals?.filter(rental => {
    if (!rental.start_date || rental.rental_status !== 'Pending') return false;
    const bookingDate = new Date(rental.start_date);
    const daysUntilBooking = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilBooking >= 0 && daysUntilBooking <= 7;
  }) || [];

  const pendingPayments = rentals?.filter(rental => 
    rental.payment_status === 'Pending' || rental.payment_status === 'Partial'
  ) || [];

  const activeRentals = rentals?.filter(rental => rental.rental_status === 'Active') || [];

  const recentActivity = rentals?.slice(0, 5) || [];

  if (vehiclesLoading || rentalsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: 300 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Vehicles
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {vehicles?.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#eff6ff', width: 56, height: 56 }}>
                  <CarIcon sx={{ color: '#1E3A8A', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Active Rentals
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>
                    {activeRentals.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#fffbeb', width: 56, height: 56 }}>
                  <RentedIcon sx={{ color: '#d97706', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: vehiclesDueToday.length > 0 ? '2px solid #dc2626' : 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Due Today
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: vehiclesDueToday.length > 0 ? '#dc2626' : '#6b7280' }}>
                    {vehiclesDueToday.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: vehiclesDueToday.length > 0 ? '#fef2f2' : '#f3f4f6', width: 56, height: 56 }}>
                  <ScheduleIcon sx={{ color: vehiclesDueToday.length > 0 ? '#dc2626' : '#6b7280', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Pending Payments
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>
                    {pendingPayments.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#fffbeb', width: 56, height: 56 }}>
                  <PaymentIcon sx={{ color: '#d97706', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 2 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<CarIcon />}
              onClick={onHireOutClick}
              sx={{
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Hire Out a Car
            </Button>
            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={onCreateBookingClick}
              sx={{
                borderColor: '#1E3A8A',
                color: '#1E3A8A',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  borderColor: '#1e40af',
                  bgcolor: '#eff6ff'
                }
              }}
            >
              Create Booking
            </Button>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={onViewNotifications}
              sx={{
                borderColor: '#1E3A8A',
                color: '#1E3A8A',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  borderColor: '#1e40af',
                  bgcolor: '#eff6ff'
                }
              }}
            >
              View Notifications
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 2 }}>
            Recent Activity
          </Typography>
          <Box>
            {recentActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No recent activity
              </Typography>
            ) : (
              recentActivity.map((rental, index) => (
                <Box key={rental._id || index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                    <Avatar sx={{ bgcolor: '#eff6ff', width: 40, height: 40 }}>
                      <CarIcon sx={{ color: '#1E3A8A', fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {rental.vehicle_ref?.license_plate || 'N/A'} - {rental.customer_ref?.name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(rental.start_date || rental.created_at).toLocaleDateString()} • {rental.rental_status}
                      </Typography>
                    </Box>
                    <Chip
                      label={rental.rental_status}
                      size="small"
                      sx={{
                        bgcolor: rental.rental_status === 'Active' ? '#ecfdf5' : '#f3f4f6',
                        color: rental.rental_status === 'Active' ? '#059669' : '#6b7280',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  {index < recentActivity.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardOverview;


