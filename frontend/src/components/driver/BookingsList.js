import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import NewBookingDialog from '../NewBookingDialog';

const BookingsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const { data: rentals, isLoading } = useQuery('rentals', async () => {
    try {
      const response = await api.get('/api/rentals');
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  });

  // Filter for future/pending bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = rentals?.filter(rental => {
    if (!rental.start_date) return false;
    const bookingDate = new Date(rental.start_date);
    return bookingDate >= today || rental.rental_status === 'Pending';
  }) || [];

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.rental_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_ref?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vehicle_ref?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || booking.rental_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Pending': { bg: '#fffbeb', color: '#d97706' },
      'Active': { bg: '#eff6ff', color: '#2563eb' },
      'Completed': { bg: '#ecfdf5', color: '#059669' },
      'Cancelled': { bg: '#fef2f2', color: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: 300 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
            Bookings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage future bookings and reservations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setBookingDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #3b82f6 100%)',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5
          }}
        >
          Create Booking
        </Button>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search by booking ID, customer, or vehicle..."
              variant="outlined"
              size="medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white',
                  '&:hover fieldset': {
                    borderColor: '#1E3A8A',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1E3A8A',
                    borderWidth: '2px',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="medium"
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white',
                },
              }}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Booking ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Total Fee</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Contract</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CalendarIcon sx={{ fontSize: 64, color: '#d1d5db' }} />
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No bookings found
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setBookingDialogOpen(true)}
                        sx={{
                          mt: 1,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: '#1E3A8A',
                          color: '#1E3A8A',
                          '&:hover': {
                            borderColor: '#1e40af',
                            bgcolor: '#eff6ff'
                          }
                        }}
                      >
                        Create First Booking
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => {
                  const statusColors = getStatusColor(booking.rental_status);
                  const baseURL = api.defaults?.baseURL || '';
                  const contractFile = booking.contract_url
                    ? booking.contract_url.split(/[/\\]/).pop()
                    : null;
                  const contractHref = contractFile
                    ? `${baseURL.replace(/\/+$/, '')}/contracts/${contractFile}`
                    : null;
                  return (
                    <TableRow
                      key={booking._id}
                      sx={{
                        '&:hover': {
                          bgcolor: '#eff6ff',
                          transform: 'scale(1.01)',
                          transition: 'all 0.2s ease-in-out'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                          {booking.rental_id || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: '#1E3A8A', width: 32, height: 32 }}>
                            <PersonIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {booking.customer_ref?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CarIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {booking.vehicle_ref?.make} {booking.vehicle_ref?.model}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.vehicle_ref?.license_plate}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.start_date ? new Date(booking.start_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                          KES {booking.total_fee_gross?.toLocaleString() || '0'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.rental_status}
                          size="small"
                          sx={{
                            bgcolor: statusColors.bg,
                            color: statusColors.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {contractHref ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(contractHref, '_blank', 'noopener');
                            }}
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                              fontWeight: 600,
                              borderColor: '#1E3A8A',
                              color: '#1E3A8A',
                              '&:hover': {
                                borderColor: '#1e40af',
                                bgcolor: '#eff6ff'
                              }
                            }}
                          >
                            View Contract
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Not generated
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Booking Dialog */}
      <NewBookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
      />
    </Box>
  );
};

export default BookingsList;


