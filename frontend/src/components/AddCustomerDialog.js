import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import api from '../utils/api';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

const AddCustomerDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    ID_number: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/customers', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success('Customer added successfully');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add customer');
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.ID_number.trim()) {
      newErrors.ID_number = 'ID number is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^254\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone must be in format 254XXXXXXXXX';
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      ID_number: formData.ID_number.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined
    });
  };

  const handleClose = () => {
    setFormData({ name: '', ID_number: '', phone: '', email: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
          Add New Customer
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <TextField
            fullWidth
            label="Customer Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            margin="normal"
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
            label="ID Number *"
            name="ID_number"
            value={formData.ID_number}
            onChange={handleChange}
            error={!!errors.ID_number}
            helperText={errors.ID_number}
            margin="normal"
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
            label="Phone Number *"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone || 'Format: 254XXXXXXXXX'}
            margin="normal"
            required
            placeholder="254712345678"
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
            label="Email (Optional)"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            margin="normal"
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
            background: '#ea580c',
            '&:hover': { background: '#c2410c' }
          }}
        >
          {createMutation.isLoading ? 'Adding...' : 'Add Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCustomerDialog;

