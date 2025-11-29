import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Card,
  TextField,
  InputAdornment,
  MenuItem,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import NewBookingDialog from '../../components/NewBookingDialog';
import HireOutCarDialog from '../../components/HireOutCarDialog';

const BookingManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [hireOutDialogOpen, setHireOutDialogOpen] = useState(false);

  const { data: rentals, isLoading } = useQuery('rentals', async () => {
    const response = await api.get('/api/rentals');
    return response.data.data;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Pending': { bg: '#f3f4f6', color: '#6b7280' },
      'Active': { bg: '#eff6ff', color: '#2563eb' },
      'Completed': { bg: '#ecfdf5', color: '#059669' },
      'Cancelled': { bg: '#fef2f2', color: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Awaiting': { bg: '#fffbeb', color: '#d97706' },
      'Paid': { bg: '#ecfdf5', color: '#059669' },
      'Partial': { bg: '#eff6ff', color: '#2563eb' },
      'Reversed': { bg: '#fef2f2', color: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const filteredRentals = rentals?.filter(rental => {
    const matchesSearch = 
      rental.rental_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.customer_ref?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.vehicle_ref?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rental.rental_status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
              Booking Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all rental bookings and track their status
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setHireOutDialogOpen(true)}
              sx={{
                background: '#ea580c',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                '&:hover': {
                  background: '#c2410c',
                  boxShadow: '0 6px 16px rgba(234, 88, 12, 0.4)',
                }
              }}
            >
              Hire Out a Car
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewBookingDialogOpen(true)}
              sx={{
                background: '#1E3A8A',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                '&:hover': {
                  background: '#1e40af',
                  boxShadow: '0 6px 16px rgba(30, 58, 138, 0.4)',
                }
              }}
            >
              New Booking
            </Button>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search by rental ID, customer, or vehicle..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#1E3A8A',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1E3A8A',
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
            size="small"
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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
      </Box>

      {/* Bookings Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Rental ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Total Fee</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No bookings found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRentals.map((rental) => {
                  const statusColors = getStatusColor(rental.rental_status);
                  const paymentColors = getPaymentStatusColor(rental.payment_status);
                  return (
                    <TableRow
                      key={rental._id}
                      sx={{
                        '&:hover': {
                          bgcolor: '#f9fafb'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                          {rental.rental_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: '#1E3A8A', width: 32, height: 32 }}>
                            <PersonIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {rental.customer_ref?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CarIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {rental.vehicle_ref?.make} {rental.vehicle_ref?.model}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {rental.vehicle_ref?.license_plate}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ color: '#9ca3af', fontSize: 16 }} />
                          <Typography variant="body2">
                            {new Date(rental.start_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ color: '#9ca3af', fontSize: 16 }} />
                          <Typography variant="body2">
                            {new Date(rental.end_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                          KES {rental.total_fee_gross?.toLocaleString() || '0'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rental.rental_status || 'N/A'}
                          size="small"
                          sx={{
                            bgcolor: statusColors.bg,
                            color: statusColors.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rental.payment_status || 'N/A'}
                          size="small"
                          sx={{
                            bgcolor: paymentColors.bg,
                            color: paymentColors.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* New Booking Dialog */}
      <NewBookingDialog
        open={newBookingDialogOpen}
        onClose={() => setNewBookingDialogOpen(false)}
      />

      {/* Hire Out Car Dialog */}
      <HireOutCarDialog
        open={hireOutDialogOpen}
        onClose={() => setHireOutDialogOpen(false)}
      />
    </Box>
  );
};

export default BookingManagement;
