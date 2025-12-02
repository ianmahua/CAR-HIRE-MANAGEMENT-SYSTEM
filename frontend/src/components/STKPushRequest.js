import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';
import api from '../utils/api';
import { useQuery } from 'react-query';

const STKPushRequest = ({ open, onClose }) => {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [rentalId, setRentalId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { data: customers } = useQuery('customers', async () => {
    const response = await api.get('/api/customers');
    return response.data.data;
  });

  const { data: rentals } = useQuery(
    ['rentals', customerId],
    async () => {
      if (!customerId) return [];
      const response = await api.get(`/api/rentals?customer_ref=${customerId}`);
      return response.data.data;
    },
    { enabled: !!customerId }
  );

  const handleRequest = async () => {
    if (!customerId || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post('/api/stkpush/request', {
        customer_id: customerId,
        amount: parseFloat(amount),
        rental_id: rentalId || null,
        vehicle_id: vehicleId || null
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setCustomerId('');
          setAmount('');
          setRentalId('');
          setVehicleId('');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate STK Push');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
          Request Payment (STK Push)
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Client</InputLabel>
            <Select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setRentalId('');
                setVehicleId('');
              }}
              label="Select Client"
            >
              {customers?.map((customer) => (
                <MenuItem key={customer._id} value={customer._id}>
                  {customer.name} - {customer.phone}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {rentals && rentals.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Rental (Optional)</InputLabel>
              <Select
                value={rentalId}
                onChange={(e) => {
                  const rental = rentals.find((r) => r._id === e.target.value);
                  setRentalId(e.target.value);
                  setVehicleId(rental?.vehicle_ref?._id || '');
                }}
                label="Select Rental (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {rentals.map((rental) => (
                  <MenuItem key={rental._id} value={rental._id}>
                    {rental.rental_id} - {rental.vehicle_ref?.make} {rental.vehicle_ref?.model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Amount (KES)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ mb: 2 }}
            required
            inputProps={{ min: 1, step: 0.01 }}
          />

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              STK Push initiated! The client will receive a payment prompt on their phone.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleRequest}
          variant="contained"
          disabled={loading || !customerId || !amount}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
          sx={{
            background: '#1E3A8A',
            '&:hover': {
              background: '#1e40af',
            },
          }}
        >
          {loading ? 'Requesting...' : 'Request Payment (STK Push)'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default STKPushRequest;








