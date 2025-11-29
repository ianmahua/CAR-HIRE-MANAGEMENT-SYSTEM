import React from 'react';
import { useQuery } from 'react-query';
import api from '../utils/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

const DriverHistory = () => {
  const { data: rentals, isLoading } = useQuery('myRentals', async () => {
    const response = await api.get('/api/driver/assignments');
    return response.data.data || [];
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const completedRentals = rentals?.filter(r => r.rental_status === 'Completed') || [];
  const activeRentals = rentals?.filter(r => r.rental_status === 'Active') || [];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: '600', color: '#1E3A8A' }}>
        Vehicle Rental History
      </Typography>

      {activeRentals.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: '600' }}>
            Currently Active Rentals
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                  <TableCell><strong>Vehicle</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Destination</strong></TableCell>
                  <TableCell><strong>Start Date</strong></TableCell>
                  <TableCell><strong>End Date</strong></TableCell>
                  <TableCell><strong>Price</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRentals.map((rental) => (
                  <TableRow key={rental._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CarIcon sx={{ color: '#1E3A8A' }} />
                        {rental.vehicle_ref?.make} {rental.vehicle_ref?.model}
                        <Typography variant="caption" color="text.secondary">
                          ({rental.vehicle_ref?.license_plate})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{rental.customer_ref?.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                        {rental.destination}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(rental.start_date).toLocaleDateString('en-KE')}
                    </TableCell>
                    <TableCell>
                      {new Date(rental.end_date).toLocaleDateString('en-KE')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MoneyIcon sx={{ fontSize: 16, color: '#059669' }} />
                        <Typography sx={{ fontWeight: '600', color: '#059669' }}>
                          KES {rental.total_fee_gross?.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rental.rental_status}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {completedRentals.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: '600' }}>
            Completed Rentals History
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                  <TableCell><strong>Vehicle</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Destination</strong></TableCell>
                  <TableCell><strong>Rental Period</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell><strong>Price</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedRentals.map((rental) => (
                  <TableRow key={rental._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CarIcon sx={{ color: '#1E3A8A' }} />
                        {rental.vehicle_ref?.make} {rental.vehicle_ref?.model}
                        <Typography variant="caption" color="text.secondary">
                          ({rental.vehicle_ref?.license_plate})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{rental.customer_ref?.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                        {rental.destination}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {new Date(rental.start_date).toLocaleDateString('en-KE')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          to {new Date(rental.end_date).toLocaleDateString('en-KE')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                        {rental.duration_days} days
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MoneyIcon sx={{ fontSize: 16, color: '#059669' }} />
                        <Typography sx={{ fontWeight: '600', color: '#059669' }}>
                          KES {rental.total_fee_gross?.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rental.rental_status}
                        color="default"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {(!rentals || rentals.length === 0) && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CarIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No rental history yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start by completing a task to add customer and vehicle rental details.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DriverHistory;







