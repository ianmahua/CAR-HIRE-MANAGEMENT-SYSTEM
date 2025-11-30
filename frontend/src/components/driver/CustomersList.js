import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const CustomersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: customers, isLoading } = useQuery('customers', async () => {
    try {
      const response = await api.get('/api/customers');
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  });

  const filteredCustomers = customers?.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.ID_number?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
          Customers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all company customers
        </Typography>
      </Box>

      {/* Search */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by name, ID number, phone, or email..."
            variant="outlined"
            size="medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
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
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>ID Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Total Rentals</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <PersonIcon sx={{ fontSize: 64, color: '#d1d5db' }} />
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No customers found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer._id}
                    onClick={() => handleCustomerClick(customer)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#eff6ff',
                        transform: 'scale(1.01)',
                        transition: 'all 0.2s ease-in-out'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: '#1E3A8A', width: 32, height: 32 }}>
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                          {customer.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {customer.ID_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                        <Typography variant="body2">
                          {customer.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                        <Typography variant="body2" color="text.secondary">
                          {customer.email || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.is_returning_client ? 'Returning' : 'New'}
                        size="small"
                        sx={{
                          bgcolor: customer.is_returning_client ? '#ecfdf5' : '#f3f4f6',
                          color: customer.is_returning_client ? '#059669' : '#6b7280',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                        {customer.hire_history?.length || 0}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {selectedCustomer && (
          <>
            <DialogTitle sx={{ fontWeight: 700, color: '#1E3A8A' }}>
              Customer Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1E3A8A', width: 64, height: 64 }}>
                      <PersonIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {selectedCustomer.name}
                      </Typography>
                      <Chip
                        label={selectedCustomer.is_returning_client ? 'Returning Client' : 'New Client'}
                        size="small"
                        sx={{
                          bgcolor: selectedCustomer.is_returning_client ? '#ecfdf5' : '#f3f4f6',
                          color: selectedCustomer.is_returning_client ? '#059669' : '#6b7280',
                          fontWeight: 600,
                          mt: 1
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    ID Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCustomer.ID_number}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Phone
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCustomer.phone}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCustomer.email || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Total Rentals
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    {selectedCustomer.hire_history?.length || 0}
                  </Typography>
                </Grid>

                {selectedCustomer.hire_history && selectedCustomer.hire_history.length > 0 && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon />
                        Rental History
                      </Typography>
                    </Grid>
                    {selectedCustomer.hire_history.slice(0, 5).map((rental, index) => (
                      <Grid item xs={12} key={index}>
                        <Card sx={{ bgcolor: '#f9fafb', borderRadius: 2 }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              Rental #{index + 1} • {rental.rental_id || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Date: {rental.rental_date ? new Date(rental.rental_date).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button
                onClick={() => setDetailDialogOpen(false)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CustomersList;

