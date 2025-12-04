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
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import api from '../utils/api';
import { useQuery } from 'react-query';

const ContractSharing = ({ open, onClose, rentalId, vehicleId, customerId }) => {
  const [channels, setChannels] = useState(['Email']);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { data: rental } = useQuery(
    ['rental', rentalId],
    async () => {
      const response = await api.get(`/api/rentals/${rentalId}`);
      return response.data.data;
    },
    { enabled: !!rentalId }
  );

  const handleChannelChange = (channel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSend = async () => {
    if (channels.length === 0) {
      setError('Please select at least one channel');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post('/api/messages/send-contract', {
        rental_id: rentalId,
        vehicle_id: vehicleId,
        customer_id: customerId,
        channels
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
          Send Rental Contract
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {rental && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Rental:</strong> {rental.rental_id}
              </Typography>
              <Typography variant="body2">
                <strong>Vehicle:</strong> {rental.vehicle_ref?.make} {rental.vehicle_ref?.model}
              </Typography>
            </Box>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Channels</InputLabel>
            <Select
              multiple
              value={channels}
              renderValue={(selected) => selected.join(', ')}
              label="Select Channels"
            >
              <MenuItem value="Email">
                <Checkbox checked={channels.includes('Email')} />
                Email
              </MenuItem>
              <MenuItem value="WhatsApp">
                <Checkbox checked={channels.includes('WhatsApp')} />
                WhatsApp
              </MenuItem>
              <MenuItem value="SMS">
                <Checkbox checked={channels.includes('SMS')} />
                SMS
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={channels.includes('Email')}
                  onChange={() => handleChannelChange('Email')}
                />
              }
              label="Email"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={channels.includes('WhatsApp')}
                  onChange={() => handleChannelChange('WhatsApp')}
                />
              }
              label="WhatsApp"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={channels.includes('SMS')}
                  onChange={() => handleChannelChange('SMS')}
                />
              }
              label="SMS"
            />
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Contract sent successfully!
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
          onClick={handleSend}
          variant="contained"
          disabled={loading || channels.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{
            background: '#1E3A8A',
            '&:hover': {
              background: '#1e40af',
            },
          }}
        >
          {loading ? 'Sending...' : 'Send Contract'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractSharing;











