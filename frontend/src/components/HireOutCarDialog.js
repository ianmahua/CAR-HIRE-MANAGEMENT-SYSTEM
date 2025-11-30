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
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { DirectionsCar as CarIcon, Close as CloseIcon } from '@mui/icons-material';
import api from '../utils/api';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

const HireOutCarDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_id: '',
    vehicle_ref: '',
    start_date: '',
    end_date: '',
    destination: '',
    hire_type: 'Direct Client'
  });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  // Fetch available vehicles
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery(
    'availableVehicles',
    async () => {
      const response = await api.get('/api/vehicles?availability_status=Parking');
      return response.data.data || [];
    },
    { enabled: open }
  );

  // Fetch existing customers
  const { data: customers } = useQuery(
    'customers',
    async () => {
      const response = await api.get('/api/customers');
      return response.data.data || [];
    },
    { enabled: open }
  );

  // Create rental mutation
  const createRentalMutation = useMutation(
    async (rentalData) => {
      const response = await api.post('/api/rentals', rentalData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Car hired out successfully!');
        queryClient.invalidateQueries('driverAssignments');
        queryClient.invalidateQueries('availableVehicles');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to hire out car');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_name) newErrors.customer_name = 'Customer name is required';
    if (!formData.customer_phone) newErrors.customer_phone = 'Customer phone is required';
    if (!formData.vehicle_ref) newErrors.vehicle_ref = 'Vehicle selection is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (!formData.destination) newErrors.destination = 'Destination is required';

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Find or create customer
    let customerId = formData.customer_id;
    
    if (!customerId && formData.customer_phone) {
      // Check if customer exists by phone
      const existingCustomer = customers?.find(
        c => c.phone === formData.customer_phone
      );
      
      if (existingCustomer) {
        customerId = existingCustomer._id;
      } else {
        // Create new customer
        try {
          const customerResponse = await api.post('/api/customers', {
            name: formData.customer_name,
            phone: formData.customer_phone,
            ID_number: formData.customer_id || '',
            email: ''
          });
          customerId = customerResponse.data.data._id;
        } catch (error) {
          toast.error('Failed to create customer');
          return;
        }
      }
    }

    // Calculate duration
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const duration_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Create rental
    const rentalData = {
      vehicle_ref: formData.vehicle_ref,
      customer_ref: customerId,
      start_date: formData.start_date,
      end_date: formData.end_date,
      destination: formData.destination,
      hire_type: formData.hire_type
    };

    createRentalMutation.mutate(rentalData);
  };

  const handleClose = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_id: '',
      vehicle_ref: '',
      start_date: '',
      end_date: '',
      destination: '',
      hire_type: 'Direct Client'
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, color: '#111827', pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CarIcon sx={{ color: '#ea580c' }} />
            <Typography variant="h6">Hire Out a Car</Typography>
          </Box>
          <Button
            onClick={handleClose}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Customer Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E3A8A' }}>
                Customer Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                error={!!errors.customer_name}
                helperText={errors.customer_name}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                required
                error={!!errors.customer_phone}
                helperText={errors.customer_phone}
                placeholder="254712345678"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID Number (Optional)"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
              />
            </Grid>

            {/* Rental Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2, color: '#1E3A8A' }}>
                Rental Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.vehicle_ref}>
                <InputLabel>Select Vehicle</InputLabel>
                <Select
                  name="vehicle_ref"
                  value={formData.vehicle_ref}
                  onChange={handleChange}
                  label="Select Vehicle"
                >
                  {vehiclesLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} />
                      Loading vehicles...
                    </MenuItem>
                  ) : vehicles && vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <MenuItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} - {vehicle.license_plate} ({vehicle.category})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No available vehicles</MenuItem>
                  )}
                </Select>
                {errors.vehicle_ref && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.vehicle_ref}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hire Type</InputLabel>
                <Select
                  name="hire_type"
                  value={formData.hire_type}
                  onChange={handleChange}
                  label="Hire Type"
                >
                  <MenuItem value="Direct Client">Direct Client</MenuItem>
                  <MenuItem value="Broker Handoff">Broker Handoff</MenuItem>
                  <MenuItem value="External Brokerage Rental">External Brokerage Rental</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
                error={!!errors.start_date}
                helperText={errors.start_date}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
                error={!!errors.end_date}
                helperText={errors.end_date}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                error={!!errors.destination}
                helperText={errors.destination}
                placeholder="e.g., Nairobi to Mombasa"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={handleClose}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            disabled={createRentalMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              bgcolor: '#ea580c',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: '#c2410c'
              }
            }}
            disabled={createRentalMutation.isLoading}
            startIcon={createRentalMutation.isLoading ? <CircularProgress size={20} /> : <CarIcon />}
          >
            {createRentalMutation.isLoading ? 'Processing...' : 'Hire Out Car'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default HireOutCarDialog;
