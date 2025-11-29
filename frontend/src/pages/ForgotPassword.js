import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setResetUrl('');

    try {
      const response = await api.post('/api/auth/forgot-password', { email });

      if (response.data.success) {
        setSuccess(true);
        if (response.data.resetUrl) {
          setResetUrl(response.data.resetUrl);
        }
        toast.success('Password reset email sent!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email address and we'll send you a link to reset your password
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              If that email exists, a password reset link has been sent.
              {resetUrl && process.env.NODE_ENV === 'development' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" component="div">
                    <strong>Development Mode - Reset URL:</strong>
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ wordBreak: 'break-all' }}>
                    {resetUrl}
                  </Typography>
                </Box>
              )}
            </Typography>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
            disabled={loading || success}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || success}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="body2" color="primary">
              Back to Login
            </Typography>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;




