import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as DirectorIcon,
  LocalTaxi as DriverIcon,
  Business as OwnerIcon
} from '@mui/icons-material';

const UserManagement = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    name: ''
  });
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery(
    ['users', roleFilter, searchTerm],
    async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/api/users?${params.toString()}`);
      return response.data.data;
    }
  );

  const addUserMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/users', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User created successfully');
        setAddDialogOpen(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    }
  );

  const updateUserMutation = useMutation(
    async ({ id, data }) => {
      const response = await api.put(`/api/users/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User updated successfully');
        setEditDialogOpen(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      }
    }
  );

  const deleteUserMutation = useMutation(
    async (id) => {
      const response = await api.delete(`/api/users/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  );

  const updatePasswordMutation = useMutation(
    async ({ id, password }) => {
      const response = await api.put(`/api/users/${id}/password`, { password });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Password updated successfully');
        setPasswordDialogOpen(false);
        setPasswordData({ password: '', confirmPassword: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update password');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      email: '',
      role: '',
      name: ''
    });
    setSelectedUser(null);
  };

  const handleAdd = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUserMutation.mutate(user._id);
    }
  };

  const handlePasswordReset = (user) => {
    setSelectedUser(user);
    setPasswordData({ password: '', confirmPassword: '' });
    setPasswordDialogOpen(true);
  };

  const handleSubmit = () => {
    if (addDialogOpen) {
      if (!formData.email) {
        toast.error('Email is required');
        return;
      }
      if (!formData.role) {
        toast.error('Please select a role (Director or Driver)');
        return;
      }
      if (formData.role !== 'Director' && formData.role !== 'Driver') {
        toast.error('Only Director or Driver roles can be assigned');
        return;
      }
      console.log('Submitting user with data:', formData);
      addUserMutation.mutate({
        email: formData.email,
        role: formData.role,
        name: formData.name || undefined
      });
    } else {
      updateUserMutation.mutate({ id: selectedUser._id, data: formData });
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    updatePasswordMutation.mutate({
      id: selectedUser._id,
      password: passwordData.password
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <AdminIcon sx={{ fontSize: 20 }} />;
      case 'Director':
        return <DirectorIcon sx={{ fontSize: 20 }} />;
      case 'Driver':
        return <DriverIcon sx={{ fontSize: 20 }} />;
      case 'Owner':
        return <OwnerIcon sx={{ fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return { bg: '#fef2f2', color: '#dc2626' };
      case 'Director':
        return { bg: '#eff6ff', color: '#2563eb' };
      case 'Driver':
        return { bg: '#fffbeb', color: '#f59e0b' };
      case 'Owner':
        return { bg: '#f0fdf4', color: '#16a34a' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system users, roles, and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{
            background: '#ea580c',
            '&:hover': { background: '#c2410c' }
          }}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or phone"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Filter by Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Director">Director</MenuItem>
                  <MenuItem value="Driver">Driver</MenuItem>
                  <MenuItem value="Owner">Owner</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user._id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone_msisdn || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={user.role}
                          size="small"
                          sx={{
                            bgcolor: getRoleColor(user.role).bg,
                            color: getRoleColor(user.role).color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={user.is_active ? 'success' : 'default'}
                          onClick={() => {
                            updateUserMutation.mutate({
                              id: user._id,
                              data: { is_active: !user.is_active }
                            });
                          }}
                          sx={{ cursor: 'pointer' }}
                          title={user.is_active ? 'Click to deactivate' : 'Click to activate'}
                        />
                      </TableCell>
                      <TableCell>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(user)}
                          sx={{ color: '#2563eb' }}
                          title="Edit User"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handlePasswordReset(user)}
                          sx={{ color: '#f59e0b' }}
                          title="Reset Password"
                        >
                          <LockResetIcon fontSize="small" />
                        </IconButton>
                        {user.role !== 'Admin' && (
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(user)}
                            sx={{ color: '#dc2626' }}
                            title="Remove User"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                        {user.role === 'Admin' && (
                          <IconButton
                            size="small"
                            disabled
                            title="Cannot delete Admin"
                          >
                            <DeleteIcon fontSize="small" sx={{ opacity: 0.3 }} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={addDialogOpen || editDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={false}
        disableAutoFocus={true}
        PaperProps={{
          sx: {
            zIndex: 1300,
            position: 'relative',
            overflow: 'visible',
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            '& .MuiDialogContent-root': {
              overflow: 'visible'
            }
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              zIndex: 1299,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 2.5,
            px: 3,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {addDialogOpen ? (
              <AddIcon sx={{ fontSize: 28 }} />
            ) : (
              <EditIcon sx={{ fontSize: 28 }} />
            )}
            <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
              {addDialogOpen ? 'Add New User' : 'Edit User'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            pt: 4, 
            pb: 3,
            px: 3,
            overflow: 'visible',
            position: 'relative',
            backgroundColor: '#fafafa',
            '&::before': {
              display: 'none'
            }
          }}
        >
          <Box sx={{ overflow: 'visible', position: 'relative' }}>
            {/* DEBUG INFO - Remove after testing */}
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                backgroundColor: '#fff3cd',
                borderLeft: '4px solid #ffc107',
                fontSize: '0.75rem'
              }}
            >
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                <strong>DEBUG:</strong> addDialogOpen={addDialogOpen ? 'true' : 'false'}, 
                editDialogOpen={editDialogOpen ? 'true' : 'false'}, 
                selectedUser?.role={selectedUser?.role || 'null'}, 
                formData.role={formData.role || 'empty'}
              </Typography>
            </Alert>
            {addDialogOpen && (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: '#e3f2fd',
                  borderLeft: '4px solid #2196f3',
                  '& .MuiAlert-icon': {
                    color: '#2196f3'
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1565c0' }}>
                  <strong>Quick Add User:</strong> Enter their email and select role. They will receive an invitation email with instructions to set their password and login.
                </Typography>
              </Alert>
            )}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
              required
              disabled={editDialogOpen}
              placeholder="user@example.com"
              helperText={addDialogOpen ? "User will receive invitation email at this address" : ""}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea'
                }
              }}
            />
            <FormControl 
              fullWidth 
              margin="normal" 
              required 
              sx={{ 
                mt: 2,
                mb: 2
              }}
            >
              <InputLabel 
                id="role-select-label"
                shrink={!!formData.role}
                sx={{
                  '&.Mui-focused': {
                    color: '#667eea'
                  }
                }}
              >
                Role *
              </InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                value={formData.role}
                onClick={(e) => {
                  console.log('🟡 Role Select clicked:', {
                    target: e.target,
                    currentTarget: e.currentTarget,
                    addDialogOpen,
                    editDialogOpen
                  });
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  console.log('🔵 Role Select onChange triggered:', {
                    newValue: e.target.value,
                    addDialogOpen,
                    editDialogOpen,
                    selectedUserRole: selectedUser?.role,
                    formDataRole: formData.role
                  });
                  setFormData({ ...formData, role: e.target.value });
                }}
                onOpen={() => {
                  console.log('🟢 Role Select opened:', {
                    addDialogOpen,
                    editDialogOpen,
                    selectedUserRole: selectedUser?.role,
                    formDataRole: formData.role,
                    disabled: editDialogOpen && selectedUser?.role === 'Admin'
                  });
                }}
                onClose={() => {
                  console.log('🔴 Role Select closed');
                }}
                label="Role *"
                displayEmpty
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& .MuiSelect-select': {
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      zIndex: 9999,
                      mt: 1,
                      maxHeight: 300,
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                      '& .MuiMenuItem-root': {
                        py: 1.5,
                        px: 2,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          transform: 'translateX(4px)'
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(102, 126, 234, 0.08)',
                          color: '#667eea',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.12)'
                          }
                        }
                      }
                    }
                  },
                  disablePortal: false,
                  disableScrollLock: true,
                  style: {
                    zIndex: 9999
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  }
                }}
                disabled={false}
              >
                {addDialogOpen ? (
                  <>
                    <MenuItem 
                      value="" 
                      disabled
                      sx={{ 
                        color: '#9e9e9e',
                        fontStyle: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      Select a role
                    </MenuItem>
                    <MenuItem value="Director">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <DirectorIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Director</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Driver">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <DriverIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Driver</Typography>
                      </Box>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem 
                      value="" 
                      disabled
                      sx={{ 
                        color: '#9e9e9e',
                        fontStyle: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      Select a role
                    </MenuItem>
                    <MenuItem 
                      value="Admin" 
                      disabled={selectedUser?.role !== 'Admin'}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <AdminIcon sx={{ fontSize: 18, color: '#dc2626' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Admin</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Director">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <DirectorIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Director</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Driver">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <DriverIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Driver</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Owner">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(22, 163, 74, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <OwnerIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Owner</Typography>
                      </Box>
                    </MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Name (Optional)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              placeholder="Leave empty to use email username"
              helperText={addDialogOpen ? "If not provided, name will be extracted from email" : ""}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: '2px'
                    }
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea'
                }
              }}
            />
            {editDialogOpen && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== undefined ? formData.is_active : true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
            )}
            {addDialogOpen && (
              <Alert 
                severity="success" 
                sx={{ 
                  mt: 3,
                  borderRadius: 2,
                  backgroundColor: '#e8f5e9',
                  borderLeft: '4px solid #4caf50',
                  '& .MuiAlert-icon': {
                    color: '#4caf50'
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                  <strong>What happens next:</strong>
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                    <li>User receives invitation email</li>
                    <li>They click "Forgot Password" to set their password</li>
                    <li>They can then login with their email and selected role</li>
                  </Box>
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: 3, 
            pb: 3,
            pt: 2,
            backgroundColor: '#fafafa',
            borderTop: '1px solid #e0e0e0',
            gap: 1.5
          }}
        >
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
              resetForm();
            }}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#d0d0d0',
              color: '#666',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={addUserMutation.isLoading || updateUserMutation.isLoading}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                transform: 'translateY(-1px)'
              },
              '&:active': {
                transform: 'translateY(0)'
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: 0.7
              }
            }}
          >
            {addUserMutation.isLoading || updateUserMutation.isLoading
              ? 'Saving...'
              : addDialogOpen
              ? 'Create User'
              : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setPasswordData({ password: '', confirmPassword: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Reset Password
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Reset password for: <strong>{selectedUser?.name}</strong>
            </Alert>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.password}
              onChange={(e) =>
                setPasswordData({ ...passwordData, password: e.target.value })
              }
              margin="normal"
              required
              helperText="Password must be at least 6 characters"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPasswordDialogOpen(false);
              setPasswordData({ password: '', confirmPassword: '' });
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            disabled={updatePasswordMutation.isLoading}
            sx={{
              background: '#ea580c',
              '&:hover': { background: '#c2410c' }
            }}
          >
            {updatePasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;


