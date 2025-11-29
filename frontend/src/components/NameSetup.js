import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box
} from '@mui/material';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const NameSetup = ({ open, onClose }) => {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/api/auth/profile', {
        display_name: displayName.trim()
      });
      
      setUser(response.data.data);
      onClose();
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
          Set Your Display Name
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the name you'd like to be greeted with when you log in.
          </Typography>
          <TextField
            fullWidth
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.name}
            autoFocus
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
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!displayName.trim() || loading}
          sx={{
            background: '#1E3A8A',
            '&:hover': {
              background: '#1e40af',
            },
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NameSetup;

