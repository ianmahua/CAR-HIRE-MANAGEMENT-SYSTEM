import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  CheckCircle as AvailableIcon,
  Assignment as RentedIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Error as AlertCircleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const DashboardOverview = () => {
  const { data, isLoading, refetch } = useQuery('adminDashboard', async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data.stats;
  }, {
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const formatCurrency = (amount) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (returnDate) => {
    if (!returnDate) return 0;
    const today = new Date();
    const returnDay = new Date(returnDate);
    const diffTime = returnDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = data || {};

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time insights and metrics
        </Typography>
      </Box>

      {/* Top Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            borderLeft: '4px solid #1976d2',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(25, 118, 210, 0.1)', borderRadius: 2 }}>
                  <CarIcon sx={{ fontSize: 28, color: '#1976d2' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                {stats.totalVehicles || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Total Vehicles
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            borderLeft: '4px solid #2e7d32',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(46, 125, 50, 0.1)', borderRadius: 2 }}>
                  <AvailableIcon sx={{ fontSize: 28, color: '#2e7d32' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32', mb: 0.5 }}>
                {stats.availableVehicles || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            borderLeft: '4px solid #ed6c02',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(237, 108, 2, 0.1)', borderRadius: 2 }}>
                  <RentedIcon sx={{ fontSize: 28, color: '#ed6c02' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02', mb: 0.5 }}>
                {stats.rentedVehicles || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Rented
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            borderLeft: '4px solid #9c27b0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 28, color: '#9c27b0' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0', mb: 0.5 }}>
                {stats.utilizationRate || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Utilization Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                  <MoneyIcon sx={{ fontSize: 32 }} />
                </Box>
                <Chip label="Today" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {formatCurrency(stats.revenueToday || 0)}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Revenue Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Box>
                <Chip label="This Month" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {formatCurrency(stats.revenueThisMonth || 0)}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Revenue This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Bookings Section */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CarIcon sx={{ fontSize: 32, color: '#ed6c02' }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Active Bookings
              </Typography>
            </Box>
            <Chip 
              label={`${stats.activeBookings?.length || 0} Active`}
              sx={{ bgcolor: '#fff3e0', color: '#ed6c02', fontWeight: 700 }}
            />
          </Box>

          {stats.activeBookings && stats.activeBookings.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.activeBookings.map((booking, index) => (
                <Paper 
                  key={booking.rental_id || index}
                  sx={{ 
                    p: 3, 
                    border: '2px solid #e0e0e0',
                    borderRadius: 2,
                    '&:hover': { borderColor: '#ed6c02', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                    transition: 'all 0.2s'
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <CarIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {booking.license_plate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.vehicle_name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <PersonIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary">Customer</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {booking.customer_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.customer_phone}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <LocationIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary">Dispatched</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDateTime(booking.dispatch_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        By: {booking.dispatched_by}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <TimeIcon sx={{ color: '#ed6c02', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary">Expected Return</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(booking.return_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getDaysRemaining(booking.return_date)} days remaining
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">Total Revenue:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                        {formatCurrency(booking.total_amount)}
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      endIcon={<ArrowForwardIcon />}
                      sx={{ 
                        bgcolor: '#1976d2',
                        '&:hover': { bgcolor: '#1565c0' }
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CarIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No active bookings at the moment
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Pending Payments & Upcoming Returns Grid */}
      <Grid container spacing={3}>
        {/* Pending Payments */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AlertCircleIcon sx={{ fontSize: 32, color: '#d32f2f' }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Pending Payments
                  </Typography>
                </Box>
                <Chip 
                  label={stats.pendingPayments?.length || 0}
                  sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }}
                />
              </Box>

              {stats.pendingPayments && stats.pendingPayments.length > 0 ? (
                <Box sx={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {stats.pendingPayments.map((payment, index) => (
                    <Paper 
                      key={payment.rental_id || index}
                      sx={{ 
                        p: 2, 
                        border: '2px solid #ffcdd2',
                        borderRadius: 2,
                        bgcolor: '#ffebee',
                        '&:hover': { borderColor: '#d32f2f' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#d32f2f' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              {payment.customer_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {payment.license_plate}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip label="OVERDUE" size="small" sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 700 }} />
                      </Box>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Amount Due</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                            {formatCurrency(payment.amount_due)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Extension Days</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {payment.extension_days} days
                          </Typography>
                        </Grid>
                      </Grid>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#c62828' } }}
                      >
                        Send Reminder
                      </Button>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AvailableIcon sx={{ fontSize: 64, color: '#c8e6c9', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    All payments up to date! 🎉
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Returns */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Upcoming Returns
                  </Typography>
                </Box>
                <Chip 
                  label={stats.upcomingReturns?.length || 0}
                  sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 700 }}
                />
              </Box>

              {stats.upcomingReturns && stats.upcomingReturns.length > 0 ? (
                <Box sx={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {stats.upcomingReturns.map((returnItem, index) => (
                    <Paper 
                      key={returnItem.rental_id || index}
                      sx={{ 
                        p: 2, 
                        border: '2px solid #bbdefb',
                        borderRadius: 2,
                        bgcolor: '#e3f2fd',
                        '&:hover': { borderColor: '#1976d2' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#1976d2' }}>
                            <CarIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              {returnItem.license_plate}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {returnItem.vehicle_name}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={returnItem.is_today ? 'TODAY' : formatDate(returnItem.return_date)}
                          size="small"
                          sx={{ 
                            bgcolor: returnItem.is_today ? '#fff3e0' : '#e3f2fd',
                            color: returnItem.is_today ? '#ed6c02' : '#1976d2',
                            fontWeight: 700 
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Customer:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {returnItem.customer_name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Return Time:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {returnItem.return_time || 'Not specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Receiving:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {returnItem.receiving_by}
                          </Typography>
                        </Box>
                      </Box>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        startIcon={<AvailableIcon />}
                        sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
                      >
                        Mark as Returned
                      </Button>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CalendarIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No upcoming returns scheduled
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
