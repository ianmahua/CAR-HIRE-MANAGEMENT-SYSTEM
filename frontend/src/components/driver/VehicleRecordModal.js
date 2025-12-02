import React from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Grid
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const VehicleRecordModal = ({ open, onClose, vehicleId, vehicle }) => {
  const { data: rentals, isLoading } = useQuery(
    ['vehicleRecords', vehicleId],
    async () => {
      try {
        const response = await api.get('/api/rentals');
        const allRentals = response.data.data || [];
        // Filter rentals for this specific vehicle
        return allRentals.filter(rental => 
          rental.vehicle_ref?._id === vehicleId || rental.vehicle_ref === vehicleId
        );
      } catch (error) {
        return [];
      }
    },
    { enabled: open && !!vehicleId }
  );

  const getStatusColor = (status) => {
    const colors = {
      'Active': { bg: '#eff6ff', color: '#2563eb' },
      'Completed': { bg: '#ecfdf5', color: '#059669' },
      'Cancelled': { bg: '#fef2f2', color: '#dc2626' },
      'Pending': { bg: '#fffbeb', color: '#d97706' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const getPaymentColor = (status) => {
    const colors = {
      'Paid': { bg: '#ecfdf5', color: '#059669' },
      'Pending': { bg: '#fffbeb', color: '#d97706' },
      'Partial': { bg: '#eff6ff', color: '#2563eb' },
      'Unpaid': { bg: '#fef2f2', color: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  // Calculate statistics
  const stats = {
    totalRentals: rentals?.length || 0,
    totalRevenue: rentals?.reduce((sum, r) => sum + (r.total_fee_gross || 0), 0) || 0,
    averageDuration: rentals?.length > 0
      ? Math.round(rentals.reduce((sum, r) => sum + (r.duration_days || 0), 0) / rentals.length)
      : 0
  };

  if (!vehicle) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1E3A8A', width: 40, height: 40 }}>
          <CarIcon />
        </Avatar>
        Vehicle Records - {vehicle.license_plate}
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <LinearProgress sx={{ width: 300 }} />
          </Box>
        ) : (
          <Box>
            {/* Vehicle Info */}
            <Card sx={{ mb: 3, bgcolor: '#f9fafb', borderRadius: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Category</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {vehicle.category}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Daily Rate</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#059669' }}>
                      KES {vehicle.daily_rate?.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={vehicle.availability_status}
                      size="small"
                      sx={{
                        bgcolor: vehicle.availability_status === 'Parking' ? '#ecfdf5' : '#f3f4f6',
                        color: vehicle.availability_status === 'Parking' ? '#059669' : '#6b7280',
                        fontWeight: 600
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: '#eff6ff', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Rentals</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                      {stats.totalRentals}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: '#ecfdf5', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                      KES {stats.totalRevenue.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: '#fffbeb', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Avg. Duration</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>
                      {stats.averageDuration} days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Rental History */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Rental History
            </Typography>

            {rentals && rentals.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rentals.map((rental, index) => (
                  <Card key={rental._id || index} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            Rental #{rentals.length - index}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {rental.rental_id || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={rental.rental_status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(rental.rental_status).bg,
                              color: getStatusColor(rental.rental_status).color,
                              fontWeight: 600
                            }}
                          />
                          <Chip
                            label={rental.payment_status || 'Unpaid'}
                            size="small"
                            sx={{
                              bgcolor: getPaymentColor(rental.payment_status).bg,
                              color: getPaymentColor(rental.payment_status).color,
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                            <Typography variant="body2" color="text.secondary">Customer</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {rental.customer_ref?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rental.customer_ref?.phone || 'N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                            <Typography variant="body2" color="text.secondary">Dates</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rental.start_date ? new Date(rental.start_date).toLocaleDateString() : 'N/A'} - {rental.end_date ? new Date(rental.end_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Duration: {rental.duration_days || 0} days
                          </Typography>
                        </Grid>

                        {rental.destination && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <LocationIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                              <Typography variant="body2" color="text.secondary">Destination</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {rental.destination}
                            </Typography>
                          </Grid>
                        )}

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PaymentIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                            <Typography variant="body2" color="text.secondary">Total Fee</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#059669' }}>
                            KES {rental.total_fee_gross?.toLocaleString() || '0'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CarIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No rental history found for this vehicle
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleRecordModal;


