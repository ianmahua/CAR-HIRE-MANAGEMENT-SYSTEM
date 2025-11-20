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
  Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const BookingManagement = () => {
  const { data: rentals, isLoading } = useQuery('rentals', async () => {
    const response = await api.get('/api/rentals');
    return response.data.data;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'default',
      'Active': 'primary',
      'Completed': 'success',
      'Cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Awaiting': 'warning',
      'Paid': 'success',
      'Partial': 'info',
      'Reversed': 'error'
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Booking Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Booking
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rental ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Total Fee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rentals?.map((rental) => (
              <TableRow key={rental._id}>
                <TableCell>{rental.rental_id}</TableCell>
                <TableCell>{rental.customer_ref?.name || 'N/A'}</TableCell>
                <TableCell>
                  {rental.vehicle_ref?.make} {rental.vehicle_ref?.model}
                </TableCell>
                <TableCell>{new Date(rental.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(rental.end_date).toLocaleDateString()}</TableCell>
                <TableCell>KES {rental.total_fee_gross?.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={rental.rental_status}
                    color={getStatusColor(rental.rental_status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={rental.payment_status}
                    color={getPaymentStatusColor(rental.payment_status)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BookingManagement;

