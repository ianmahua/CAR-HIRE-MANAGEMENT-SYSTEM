import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ProfilePhotoUpload = ({ open, onClose }) => {
  const { user, setUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user?.profile_photo || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setError(null);
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a photo');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await api.put('/api/auth/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUser(response.data.data);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedFile(null);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete('/api/auth/profile/photo');
      if (response.data.success) {
        setUser(response.data.data);
        setPreview(null);
        setSelectedFile(null);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(user?.profile_photo || null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
          Update Profile Photo
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={preview}
              sx={{
                width: 150,
                height: 150,
                mb: 2,
                border: '3px solid #1E3A8A',
                bgcolor: '#1E3A8A'
              }}
            >
              {!preview && (user?.name?.charAt(0) || 'U')}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                borderColor: '#1E3A8A',
                color: '#1E3A8A',
                '&:hover': {
                  borderColor: '#1e40af',
                  background: '#eff6ff'
                }
              }}
            >
              {preview ? 'Change Photo' : 'Select Photo'}
            </Button>
            {preview && (
              <Button
                variant="text"
                startIcon={<DeleteIcon />}
                onClick={handleRemove}
                disabled={loading}
                color="error"
                sx={{ mt: 1 }}
              >
                Remove Photo
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Photo updated successfully!
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Supported formats: JPG, PNG, GIF (Max 5MB)
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={loading || !selectedFile}
          sx={{
            background: '#1E3A8A',
            '&:hover': { background: '#1e40af' }
          }}
        >
          {loading ? <CircularProgress size={20} /> : 'Upload Photo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfilePhotoUpload;







