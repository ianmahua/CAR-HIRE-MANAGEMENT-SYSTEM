import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for errors in URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === 'oauth_failed') {
        toast.error('Google authentication failed. Please try again.');
      } else if (error === 'account_inactive') {
        toast.error('Your account is inactive. Please contact administrator.');
      } else {
        toast.error('Authentication failed. Please try again.');
      }
      // Clear error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  // Simple Google OAuth redirect - no role selection
  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
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
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                      <EmailIcon fontSize="small" />
                    </Box>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: 'white',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      }
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      }
                    }
                  },
                  '& .MuiInputLabel-root': {
                    '&.Mui-focused': {
                      color: 'primary.main'
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
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                      <LockIcon fontSize="small" />
                    </Box>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: 'white',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      }
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      }
                    }
                  },
                  '& .MuiInputLabel-root': {
                    '&.Mui-focused': {
                      color: 'primary.main'
                    }
                  }
                }}
              />
              <FormControl fullWidth margin="normal" required>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  displayEmpty
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'white',
                    height: '56px',
                    '& .MuiSelect-select': {
                      color: role ? 'text.primary' : '#9e9e9e',
                      fontWeight: role ? 500 : 400,
                      fontSize: '15px',
                      padding: '16.5px 14px',
                      '&:focus': {
                        backgroundColor: 'transparent'
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                      borderWidth: '1px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px'
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        mt: 1,
                        '& .MuiMenuItem-root': {
                          fontSize: '15px',
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.08)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(102, 126, 234, 0.12)',
                            color: 'primary.main',
                            fontWeight: 600,
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.16)'
                            }
                          }
                        }
                      }
                    }
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#9e9e9e' }}>Select Your Role</span>;
                    }
                    return selected;
                  }}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Director">Director</MenuItem>
                  <MenuItem value="Driver">Driver</MenuItem>
                  <MenuItem value="Owner">Owner</MenuItem>
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
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-2px)'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.7,
                    cursor: 'not-allowed'
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    <span>Signing in...</span>
                  </Box>
                ) : (
                  'Sign In'
                )}
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

            <Divider sx={{ my: 4, position: 'relative' }}>
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.98)',
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '13px',
                  letterSpacing: '0.5px'
                }}
              >
                OR
              </Typography>
            </Divider>

            {/* Google Sign-In Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              startIcon={<GoogleLogo />}
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                borderColor: '#dadce0',
                color: '#3c4043',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 500,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#dadce0',
                  backgroundColor: '#f8f9fa',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
                },
                '&:disabled': {
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }
              }}
            >
              Continue with Google
            </Button>
          </Paper>
        </Fade>
      </Container>

    </Box>
  );
};

export default Login;
