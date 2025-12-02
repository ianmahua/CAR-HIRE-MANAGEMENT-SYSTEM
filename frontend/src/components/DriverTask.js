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
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import api from '../utils/api';
import { useQuery, useMutation, useQueryClient } from 'react-query';

const DriverTask = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [customerData, setCustomerData] = useState({
    name: '',
    ID_number: '',
    phone: '',
    email: ''
  });
  const [rentalData, setRentalData] = useState({
    vehicle_id: '',
    start_date: '',
    end_date: '',
    destination: '',
    total_fee_gross: '',
    duration_days: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery('availableVehicles', async () => {
    const response = await api.get('/api/vehicles?availability_status=Parking');
    return response.data.data || [];
  });

  const { data: myRentals } = useQuery('myRentals', async () => {
    const response = await api.get('/api/driver/assignments');
    return response.data.data || [];
  });

  const createCustomerMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/customers', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setCustomerData({ ...customerData, _id: data.data._id });
        setActiveStep(1);
      }
    }
  );

  const createRentalMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/rentals', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myRentals');
        queryClient.invalidateQueries('availableVehicles');
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    }
  );

  const handleCustomerSubmit = () => {
    if (!customerData.name || !customerData.ID_number || !customerData.phone) {
      setError('Please fill in all required customer fields');
      return;
    }
    setError(null);
    createCustomerMutation.mutate(customerData);
  };

  const handleRentalSubmit = () => {
    if (!rentalData.vehicle_id || !rentalData.start_date || !rentalData.end_date || 
        !rentalData.destination || !rentalData.total_fee_gross) {
      setError('Please fill in all required rental fields');
      return;
    }
    setError(null);
    
    const startDate = new Date(rentalData.start_date);
    const endDate = new Date(rentalData.end_date);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const rentalPayload = {
      ...rentalData,
      customer_ref: customerData._id,
      duration_days: duration || rentalData.duration_days,
      total_fee_gross: parseFloat(rentalData.total_fee_gross),
      rental_status: 'Active',
      payment_status: 'Awaiting'
    };

    createRentalMutation.mutate(rentalPayload);
  };

  const handleClose = () => {
    setActiveStep(0);
    setCustomerData({ name: '', ID_number: '', phone: '', email: '' });
    setRentalData({ vehicle_id: '', start_date: '', end_date: '', destination: '', total_fee_gross: '', duration_days: '' });
    setSuccess(false);
    setError(null);
    onClose();
  };

  const steps = ['Customer Details', 'Vehicle Rental', 'Review'];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
          Do Task - Add Customer & Vehicle Rental
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Task completed successfully!
            </Alert>
          )}

          {/* Step 1: Customer Details */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, color: '#1E3A8A' }}>
                Add Customer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Name *"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ID Number *"
                    value={customerData.ID_number}
                    onChange={(e) => setCustomerData({ ...customerData, ID_number: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number *"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    placeholder="254XXXXXXXXX"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email (Optional)"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Vehicle Rental */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, color: '#1E3A8A' }}>
                Vehicle Rental Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Select Vehicle *</InputLabel>
                    <Select
                      value={rentalData.vehicle_id}
                      onChange={(e) => setRentalData({ ...rentalData, vehicle_id: e.target.value })}
                      label="Select Vehicle *"
                    >
                      {vehicles?.map((vehicle) => (
                        <MenuItem key={vehicle._id} value={vehicle._id}>
                          {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date *"
                    type="date"
                    value={rentalData.start_date}
                    onChange={(e) => setRentalData({ ...rentalData, start_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date *"
                    type="date"
                    value={rentalData.end_date}
                    onChange={(e) => setRentalData({ ...rentalData, end_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Destination *"
                    value={rentalData.destination}
                    onChange={(e) => setRentalData({ ...rentalData, destination: e.target.value })}
                    placeholder="Where is the vehicle going?"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Fee (KES) *"
                    type="number"
                    value={rentalData.total_fee_gross}
                    onChange={(e) => setRentalData({ ...rentalData, total_fee_gross: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duration (Days)"
                    type="number"
                    value={rentalData.duration_days}
                    onChange={(e) => setRentalData({ ...rentalData, duration_days: e.target.value })}
                    helperText="Will be calculated automatically if not provided"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 3: Review */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, color: '#1E3A8A' }}>
                Review Details
              </Typography>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                    Customer Information
                  </Typography>
                  <Typography><strong>Name:</strong> {customerData.name}</Typography>
                  <Typography><strong>ID Number:</strong> {customerData.ID_number}</Typography>
                  <Typography><strong>Phone:</strong> {customerData.phone}</Typography>
                  {customerData.email && <Typography><strong>Email:</strong> {customerData.email}</Typography>}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                    Rental Information
                  </Typography>
                  <Typography><strong>Vehicle:</strong> {vehicles?.find(v => v._id === rentalData.vehicle_id)?.make} {vehicles?.find(v => v._id === rentalData.vehicle_id)?.model}</Typography>
                  <Typography><strong>Start Date:</strong> {new Date(rentalData.start_date).toLocaleDateString()}</Typography>
                  <Typography><strong>End Date:</strong> {new Date(rentalData.end_date).toLocaleDateString()}</Typography>
                  <Typography><strong>Destination:</strong> {rentalData.destination}</Typography>
                  <Typography><strong>Total Fee:</strong> KES {parseFloat(rentalData.total_fee_gross || 0).toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(activeStep - 1)}>
            Back
          </Button>
        )}
        {activeStep === 0 && (
          <Button
            onClick={handleCustomerSubmit}
            variant="contained"
            disabled={createCustomerMutation.isLoading}
            startIcon={<AddIcon />}
            sx={{
              background: '#1E3A8A',
              '&:hover': { background: '#1e40af' }
            }}
          >
            {createCustomerMutation.isLoading ? 'Creating...' : 'Add Customer'}
          </Button>
        )}
        {activeStep === 1 && (
          <Button
            onClick={() => setActiveStep(2)}
            variant="contained"
            sx={{
              background: '#1E3A8A',
              '&:hover': { background: '#1e40af' }
            }}
          >
            Review
          </Button>
        )}
        {activeStep === 2 && (
          <Button
            onClick={handleRentalSubmit}
            variant="contained"
            disabled={createRentalMutation.isLoading}
            startIcon={<SaveIcon />}
            sx={{
              background: '#1E3A8A',
              '&:hover': { background: '#1e40af' }
            }}
          >
            {createRentalMutation.isLoading ? 'Saving...' : 'Complete Task'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DriverTask;








