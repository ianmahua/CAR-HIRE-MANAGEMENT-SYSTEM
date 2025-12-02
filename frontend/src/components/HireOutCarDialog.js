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
    customer_email: '',
    customer_phone: '',
    customer_address: 'Nairobi',
    customer_id: '',
    vehicle_ref: '',
    start_date: '',
    end_date: '',
    destination: '',
    hire_type: 'Direct Client'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      onSuccess: (data) => {
        // Show success message with contract info
        if (data.contract?.sent && data.contract?.email) {
          toast.success(
            `Vehicle hired out successfully! Contract sent to ${data.contract.email}`,
            {
              autoClose: 5000,
              position: 'top-right',
            }
          );
        } else if (data.contract?.error) {
          toast.warning(
            data.message || `Vehicle hired out successfully, but contract could not be sent.`,
            {
              autoClose: 5000,
              position: 'top-right',
            }
          );
          console.warn('Contract generation error:', data.contract.error);
        } else {
          toast.success(
            data.message || 'Car hired out successfully!',
            {
              autoClose: 5000,
              position: 'top-right',
            }
          );
        }
        queryClient.invalidateQueries('driverAssignments');
        queryClient.invalidateQueries('availableVehicles');
        queryClient.invalidateQueries('rentals');
        handleClose();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to hire out car';
        toast.error(errorMessage);
        console.error('Rental creation error:', error);
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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Accept Kenyan format: 07xx xxx xxx or 2547xx xxx xxx
    const phoneRegex = /^(?:254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_name) newErrors.customer_name = 'Customer name is required';
    if (!formData.customer_email) {
      newErrors.customer_email = 'Customer email is required';
    } else if (!validateEmail(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }
    if (!formData.customer_phone) {
      newErrors.customer_phone = 'Customer phone is required';
    } else if (!validatePhone(formData.customer_phone)) {
      newErrors.customer_phone = 'Please enter a valid Kenyan phone number (07xx xxx xxx)';
    }
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
    
    // Prevent multiple submissions
    if (isSubmitting || createRentalMutation.isLoading) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create rental - backend will handle customer creation/finding
      const rentalData = {
        vehicle_ref: formData.vehicle_ref,
        start_date: formData.start_date,
        end_date: formData.end_date,
        destination: formData.destination,
        hire_type: formData.hire_type,
        // Include customer data - backend will find or create customer
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address || 'Nairobi',
        customer_id_number: formData.customer_id || ''
      };

      await createRentalMutation.mutateAsync(rentalData);
    } catch (error) {
      // Error is handled by mutation's onError
      console.error('Rental creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || createRentalMutation.isLoading) {
      return; // Prevent closing during submission
    }
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_address: 'Nairobi',
      customer_id: '',
      vehicle_ref: '',
      start_date: '',
      end_date: '',
      destination: '',
      hire_type: 'Direct Client'
    });
    setErrors({});
    setIsSubmitting(false);
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
                label="Customer Email *"
                name="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={handleChange}
                required
                error={!!errors.customer_email}
                helperText={errors.customer_email}
                placeholder="customer@example.com"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number *"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                required
                error={!!errors.customer_phone}
                helperText={errors.customer_phone || 'Format: 07xx xxx xxx'}
                placeholder="07xx xxx xxx"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Address"
                name="customer_address"
                value={formData.customer_address}
                onChange={handleChange}
                placeholder="Nairobi"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID/Passport Number"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                placeholder="Optional"
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
            disabled={isSubmitting || createRentalMutation.isLoading}
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
                bgcolor: isSubmitting || createRentalMutation.isLoading ? '#ea580c' : '#c2410c'
              },
              '&:disabled': {
                bgcolor: '#ea580c',
                opacity: 0.6
              }
            }}
            disabled={isSubmitting || createRentalMutation.isLoading}
            startIcon={(isSubmitting || createRentalMutation.isLoading) ? <CircularProgress size={20} /> : <CarIcon />}
          >
            {(isSubmitting || createRentalMutation.isLoading) ? 'Processing...' : 'Hire Out Car'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default HireOutCarDialog;
