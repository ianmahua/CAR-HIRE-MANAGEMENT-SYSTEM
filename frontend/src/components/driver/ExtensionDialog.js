import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { DirectionsCar as CarIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

const ExtensionDialog = ({ open, onClose, rental, initialAction = 'extend' }) => {
  const [extensionDays, setExtensionDays] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState(initialAction); // 'extend' or 'return'
  const queryClient = useQueryClient();

  // Update action when initialAction prop changes
  useEffect(() => {
    if (open) {
      setAction(initialAction);
    }
  }, [open, initialAction]);

  const extensionMutation = useMutation(
    async (data) => {
      const rentalId = rental._id || rental.rental_id || rental.booking_id;
      const response = await api.put(`/api/rentals/${rentalId}/extend`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rentals');
        toast.success('Rental updated successfully');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update rental');
      }
    }
  );

  const returnMutation = useMutation(
    async () => {
      const rentalId = rental._id || rental.rental_id || rental.booking_id;
      const response = await api.put(`/api/rentals/${rentalId}/return`, {
        payment_status: paymentStatus,
        notes
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rentals');
        queryClient.invalidateQueries('vehicles');
        toast.success('Vehicle marked as returned');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark vehicle as returned');
      }
    }
  );

  const resetForm = () => {
    setExtensionDays(1);
    setPaymentStatus('Pending');
    setNotes('');
    setAction('extend');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const calculateNewEndDate = () => {
    if (!rental?.end_date || action === 'return') return null;
    const currentEndDate = new Date(rental.end_date);
    currentEndDate.setDate(currentEndDate.getDate() + extensionDays);
    return currentEndDate.toLocaleDateString();
  };

  const handleSubmit = () => {
    if (action === 'return') {
      returnMutation.mutate();
    } else {
      extensionMutation.mutate({
        extension_days: extensionDays,
        payment_status: paymentStatus,
        notes
      });
    }
  };

  if (!rental) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 2 }}>
        <CarIcon sx={{ color: '#1E3A8A' }} />
        {action === 'extend' ? 'Extend Rental' : 'Mark as Returning'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Vehicle: {rental.vehicle_ref?.license_plate || rental.license_plate || 'N/A'}
            </Typography>
            <Typography variant="body2">
              Customer: {rental.customer_ref?.name || rental.customer_name || 'N/A'}
            </Typography>
            <Typography variant="body2">
              Current End Date: {rental.end_date ? new Date(rental.end_date).toLocaleDateString() : 'N/A'}
            </Typography>
          </Alert>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            Choose Action:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={action === 'extend' ? 'contained' : 'outlined'}
              onClick={() => setAction('extend')}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: action === 'extend' ? '#1E3A8A' : 'transparent',
                color: action === 'extend' ? 'white' : '#1E3A8A',
                borderColor: '#1E3A8A',
                '&:hover': {
                  bgcolor: action === 'extend' ? '#1e40af' : '#eff6ff'
                }
              }}
            >
              Extend Rental
            </Button>
            <Button
              variant={action === 'return' ? 'contained' : 'outlined'}
              onClick={() => setAction('return')}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: action === 'return' ? '#059669' : 'transparent',
                color: action === 'return' ? 'white' : '#059669',
                borderColor: '#059669',
                '&:hover': {
                  bgcolor: action === 'return' ? '#047857' : '#ecfdf5'
                }
              }}
            >
              Mark as Returning
            </Button>
          </Box>
        </Box>

        {action === 'extend' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Extension Days"
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              {calculateNewEndDate() && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  New End Date: <strong>{calculateNewEndDate()}</strong>
                </Alert>
              )}
            </Grid>
          </Grid>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                label="Payment Status"
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Pending">Pending Payment</MenuItem>
                <MenuItem value="Partial">Partial Payment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this extension or return..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={extensionMutation.isLoading || returnMutation.isLoading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: action === 'extend' ? '#1E3A8A' : '#059669',
            '&:hover': {
              bgcolor: action === 'extend' ? '#1e40af' : '#047857'
            }
          }}
        >
          {extensionMutation.isLoading || returnMutation.isLoading
            ? 'Processing...'
            : action === 'extend'
            ? 'Extend Rental'
            : 'Mark as Returning'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtensionDialog;

