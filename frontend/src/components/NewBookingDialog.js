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
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import api from '../utils/api';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

const NewBookingDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    customer_ref: '',
    vehicle_ref: '',
    start_date: '',
    end_date: '',
    destination: '',
    hire_type: 'Direct Client'
  });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const { data: customers } = useQuery('customers', async () => {
    const response = await api.get('/api/customers');
    return response.data.data;
  });

  const { data: vehicles } = useQuery('vehicles', async () => {
    const response = await api.get('/api/vehicles');
    return response.data.data;
  });

  const createMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/rentals', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rentals');
        queryClient.invalidateQueries('vehicles');
        toast.success('Booking created successfully');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create booking');
        if (error.response?.data?.errors) {
          const fieldErrors = {};
          error.response.data.errors.forEach(err => {
            if (err.param) {
              fieldErrors[err.param] = err.msg;
            }
          });
          setErrors(fieldErrors);
        }
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.customer_ref) {
      newErrors.customer_ref = 'Customer is required';
    }
    if (!formData.vehicle_ref) {
      newErrors.vehicle_ref = 'Vehicle is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (!formData.destination) {
      newErrors.destination = 'Destination is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    createMutation.mutate({
      customer_ref: formData.customer_ref,
      vehicle_ref: formData.vehicle_ref,
      start_date: formData.start_date,
      end_date: formData.end_date,
      destination: formData.destination.trim(),
      hire_type: formData.hire_type
    });
  };

  const handleClose = () => {
    setFormData({
      customer_ref: '',
      vehicle_ref: '',
      start_date: '',
      end_date: '',
      destination: '',
      hire_type: 'Direct Client'
    });
    setErrors({});
    onClose();
  };

  // Get available vehicles (not rented out, not in garage)
  const availableVehicles = vehicles?.filter(v => 
    v.availability_status === 'Parking'
  ) || [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
          Create New Booking
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <FormControl fullWidth margin="normal" error={!!errors.customer_ref} required>
            <InputLabel>Customer *</InputLabel>
            <Select
              name="customer_ref"
              value={formData.customer_ref}
              onChange={handleChange}
              label="Customer *"
            >
              {customers?.map(customer => (
                <MenuItem key={customer._id} value={customer._id}>
                  {customer.name} - {customer.phone}
                </MenuItem>
              ))}
            </Select>
            {errors.customer_ref && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.customer_ref}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal" error={!!errors.vehicle_ref} required>
            <InputLabel>Vehicle *</InputLabel>
            <Select
              name="vehicle_ref"
              value={formData.vehicle_ref}
              onChange={handleChange}
              label="Vehicle *"
            >
              {availableVehicles.map(vehicle => (
                <MenuItem key={vehicle._id} value={vehicle._id}>
                  {vehicle.make} {vehicle.model} - {vehicle.license_plate} ({vehicle.availability_status})
                </MenuItem>
              ))}
            </Select>
            {errors.vehicle_ref && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.vehicle_ref}
              </Typography>
            )}
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Start Date *"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              error={!!errors.start_date}
              helperText={errors.start_date}
              InputLabelProps={{ shrink: true }}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1E3A8A',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1E3A8A',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="End Date *"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              error={!!errors.end_date}
              helperText={errors.end_date}
              InputLabelProps={{ shrink: true }}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1E3A8A',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1E3A8A',
                  },
                },
              }}
            />
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel>Hire Type</InputLabel>
            <Select
              name="hire_type"
              value={formData.hire_type}
              onChange={handleChange}
              label="Hire Type"
            >
              <MenuItem value="Direct Client">Direct Client</MenuItem>
              <MenuItem value="Broker">Broker</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Destination *"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            error={!!errors.destination}
            helperText={errors.destination || 'Where is the vehicle going?'}
            margin="normal"
            required
            placeholder="e.g., Nairobi to Mombasa"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#1E3A8A',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1E3A8A',
                },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createMutation.isLoading}
          startIcon={<AddIcon />}
          sx={{
            background: '#1E3A8A',
            '&:hover': { background: '#1e40af' }
          }}
        >
          {createMutation.isLoading ? 'Creating...' : 'Create Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewBookingDialog;

