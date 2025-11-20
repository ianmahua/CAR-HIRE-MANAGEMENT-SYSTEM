import React from 'react';
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
  Chip
} from '@mui/material';

const CustomerManagement = () => {
  const { data: customers, isLoading } = useQuery('customers', async () => {
    const response = await api.get('/api/customers');
    return response.data.data;
  });

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customer Management
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>ID Number</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Rentals</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers?.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.ID_number}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.email || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={customer.is_returning_client ? 'Returning' : 'New'}
                    color={customer.is_returning_client ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{customer.hire_history?.length || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CustomerManagement;

