import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        toast.error('Google authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token) {
        try {
          // Save token to localStorage
          localStorage.setItem('token', token);

          // Update auth context
          if (setUserFromToken) {
            try {
              await setUserFromToken(token);
            } catch (err) {
              console.error('Error updating auth context:', err);
            }
          }

          // Decode token to get user info (simple decode without library)
          let decoded;
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            decoded = JSON.parse(jsonPayload);
          } catch (err) {
            console.error('Token decode error:', err);
            toast.error('Login failed. Please try again.');
            navigate('/login');
            return;
          }

          toast.success('Login successful!');

          // Redirect based on role
          const userRole = decoded.role?.toLowerCase() || 'customer';
          
          switch (userRole) {
            case 'admin':
              navigate('/admin');
              break;
            case 'director':
              navigate('/director');
              break;
            case 'driver':
              navigate('/driver');
              break;
            case 'owner':
              navigate('/owner');
              break;
            case 'customer':
              // Customer portal not available yet - redirect to login with message
              toast.warning('Customer portal is not available yet. Please contact admin for role assignment.');
              localStorage.removeItem('token');
              navigate('/login');
              break;
            default:
              // Unknown role - redirect to login
              toast.error('Invalid user role. Please contact admin.');
              localStorage.removeItem('token');
              navigate('/login');
          }
        } catch (err) {
          console.error('Callback error:', err);
          toast.error('Login failed. Please try again.');
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, setUserFromToken]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <CircularProgress size={60} sx={{ color: 'white', mb: 3 }} />
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
        Completing sign in...
      </Typography>
    </Box>
  );
}




