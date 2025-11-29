import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Fade
} from '@mui/material';
import { LockOutlined as LockIcon, EmailOutlined as EmailIcon } from '@mui/icons-material';

// Google Logo SVG Component
const GoogleLogo = () => (
  <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <g fill="#000" fillRule="evenodd">
      <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
      <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.91l2.78 2.15c2.14-1.97 3.69-4.86 3.69-8.56z" fill="#4285F4"/>
      <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.15c-.76.53-1.78.9-3.18.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
    </g>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleRoleDialogOpen, setGoogleRoleDialogOpen] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const { login, setUserFromToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for Google OAuth callback
  useEffect(() => {
    const googleAuth = searchParams.get('google_auth');
    const googleEmail = searchParams.get('email');
    const googleName = searchParams.get('name');
    const googleRole = searchParams.get('role');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      return;
    }

    if (googleAuth === 'true' && googleEmail) {
      setGoogleUserData({
        email: googleEmail,
        name: googleName || googleEmail.split('@')[0],
        role: googleRole || ''
      });
      setGoogleRoleDialogOpen(true);
    }
  }, [searchParams]);

  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  const handleGoogleRoleSubmit = async () => {
    if (!role) {
      toast.error('Please select your role');
      return;
    }

    try {
      setLoading(true);
      console.log('Verifying Google role:', { email: googleUserData.email, role });
      
      const response = await api.post('/api/auth/google/verify-role', {
        email: googleUserData.email,
        role: role
      });

      console.log('Google role verification response:', response.data);

      if (response.data.success) {
        const { token, data: userData } = response.data;
        
        console.log('Login successful, user data:', userData);
        
        // Store token
        localStorage.setItem('token', token);
        
        // Update axios defaults for api instance
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Also update main axios instance
        const axios = require('axios').default;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update auth context if setUserFromToken is available
        if (setUserFromToken) {
          try {
            await setUserFromToken(token);
            console.log('Auth context updated successfully');
          } catch (err) {
            console.error('Error updating auth context:', err);
            // Continue anyway - token is set
          }
        }
        
        toast.success('Login successful! Redirecting...');
        
        // Use window.location for full page reload to ensure auth state is fresh
        setTimeout(() => {
          window.location.href = `/${userData.role.toLowerCase()}`;
        }, 300);
      } else {
        console.error('Login failed:', response.data.message);
        toast.error(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google role verification error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || error.message || 'Authentication failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setGoogleRoleDialogOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    if (!role) {
      toast.error('Please select your role');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password, role);

      if (result.success) {
        toast.success('Login successful!');
        const userRole = result.user?.role || role;
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate(`/${userRole.toLowerCase()}`);
        }, 100);
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Logo/Header Section */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                }}
              >
                <LockIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                THE RESSEY TOURS
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ fontWeight: 500, letterSpacing: 0.5 }}
              >
                Car Rental Management System
              </Typography>
            </Box>

            {/* Google Sign-In Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              startIcon={<GoogleLogo />}
              sx={{
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                borderColor: '#dadce0',
                color: '#3c4043',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 500,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: '#dadce0',
                  backgroundColor: '#f8f9fa',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              Continue with Google
            </Button>

            <Divider sx={{ my: 4, position: 'relative' }}>
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.98)',
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              >
                OR
              </Typography>
            </Divider>

            {/* Email/Password Form */}
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
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                      <EmailIcon fontSize="small" />
                    </Box>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                      <LockIcon fontSize="small" />
                    </Box>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                    }
                  }
                }}
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel 
                  id="role-select-label"
                  sx={{
                    color: 'text.primary',
                    '&.Mui-focused': {
                      color: 'primary.main'
                    }
                  }}
                >
                  Role *
                </InputLabel>
                <Select
                  labelId="role-select-label"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  label="Role *"
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '& .MuiSelect-select': {
                      color: role ? 'text.primary' : 'text.secondary',
                      fontWeight: role ? 500 : 400
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      transition: 'all 0.2s ease-in-out',
                      borderColor: 'rgba(0, 0, 0, 0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      }
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        mt: 1
                      }
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    <em style={{ color: '#9e9e9e', fontStyle: 'normal' }}>Select your role</em>
                  </MenuItem>
                  <MenuItem value="Admin" sx={{ py: 1.5, fontWeight: 500 }}>Admin</MenuItem>
                  <MenuItem value="Director" sx={{ py: 1.5, fontWeight: 500 }}>Director</MenuItem>
                  <MenuItem value="Driver" sx={{ py: 1.5, fontWeight: 500 }}>Driver</MenuItem>
                  <MenuItem value="Owner" sx={{ py: 1.5, fontWeight: 500 }}>Owner</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-2px)'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.7
                  }
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                to="/forgot-password"
                style={{ textDecoration: 'none' }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'primary.dark',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Forgot Password?
                </Typography>
              </Link>
            </Box>
          </Paper>
        </Fade>
      </Container>

      {/* Google Role Selection Dialog */}
      <Dialog
        open={googleRoleDialogOpen}
        onClose={() => setGoogleRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Select Your Role
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main'
              }}
            >
              {googleUserData?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
              Welcome, <strong>{googleUserData?.name}</strong>!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select your role to continue
            </Typography>
          </Box>
          <FormControl fullWidth>
            <InputLabel 
              id="google-role-select-label"
              sx={{
                color: 'text.primary',
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }}
            >
              Role
            </InputLabel>
            <Select
              labelId="google-role-select-label"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              label="Role"
              displayEmpty
              sx={{
                borderRadius: 2,
                backgroundColor: 'white',
                '& .MuiSelect-select': {
                  color: role ? 'text.primary' : 'text.secondary',
                  fontWeight: role ? 500 : 400
                },
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '2px'
                  }
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    mt: 1
                  }
                }
              }}
            >
              <MenuItem value="" disabled>
                <em style={{ color: '#9e9e9e', fontStyle: 'normal' }}>Select your role</em>
              </MenuItem>
              <MenuItem value="Admin" sx={{ py: 1.5, fontWeight: 500 }}>Admin</MenuItem>
              <MenuItem value="Director" sx={{ py: 1.5, fontWeight: 500 }}>Director</MenuItem>
              <MenuItem value="Driver" sx={{ py: 1.5, fontWeight: 500 }}>Driver</MenuItem>
              <MenuItem value="Owner" sx={{ py: 1.5, fontWeight: 500 }}>Owner</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setGoogleRoleDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGoogleRoleSubmit}
            variant="contained"
            disabled={!role || loading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)'
              }
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
