import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
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
  TextField,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  DirectionsCar as CarIcon,
  CheckCircle as AvailableIcon,
  Assignment as RentedIcon,
  Build as GarageIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const FleetManagement = () => {
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useQuery('vehicles', async () => {
    const response = await api.get('/api/vehicles');
    return response.data.data;
  });

  const createMutation = useMutation(
    (vehicleData) => api.post('/api/vehicles', vehicleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles');
        toast.success('Vehicle added successfully');
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add vehicle');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/api/vehicles/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles');
        toast.success('Vehicle updated successfully');
        setOpen(false);
        setEditingVehicle(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update vehicle');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vehicleData = {
      model: formData.get('model'),
      make: formData.get('make'),
      year: parseInt(formData.get('year')),
      category: formData.get('category'),
      license_plate: formData.get('license_plate'),
      owner_type: formData.get('owner_type'),
      daily_rate: parseFloat(formData.get('daily_rate')),
      availability_status: formData.get('availability_status')
    };

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle._id, data: vehicleData });
    } else {
      createMutation.mutate(vehicleData);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Parking': { bg: '#ecfdf5', color: '#059669' },
      'Rented Out': { bg: '#fffbeb', color: '#d97706' },
      'In Garage': { bg: '#eff6ff', color: '#2563eb' },
      'Out of Service': { bg: '#fef2f2', color: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Parking':
        return <AvailableIcon />;
      case 'Rented Out':
        return <RentedIcon />;
      case 'In Garage':
        return <GarageIcon />;
      default:
        return <CarIcon />;
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = 
      vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || vehicle.availability_status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Statistics
  const stats = {
    total: vehicles?.length || 0,
    parking: vehicles?.filter(v => v.availability_status === 'Parking').length || 0,
    rented: vehicles?.filter(v => v.availability_status === 'Rented Out').length || 0,
    garage: vehicles?.filter(v => v.availability_status === 'In Garage').length || 0
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
              Fleet Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your vehicle fleet and track availability
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingVehicle(null);
                setOpen(true);
              }}
              sx={{
                background: '#ea580c',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                '&:hover': {
                  background: '#c2410c',
                  boxShadow: '0 6px 16px rgba(234, 88, 12, 0.4)',
                }
              }}
            >
              Enroll a Car
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Vehicles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', bgcolor: '#ecfdf5' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                  {stats.parking}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', bgcolor: '#fffbeb' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>
                  {stats.rented}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rented Out
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', bgcolor: '#eff6ff' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                  {stats.garage}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Garage
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search by plate, make, or model..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#1E3A8A',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1E3A8A',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          >
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="Parking">Parking</MenuItem>
            <MenuItem value="Rented Out">Rented Out</MenuItem>
            <MenuItem value="In Garage">In Garage</MenuItem>
            <MenuItem value="Out of Service">Out of Service</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Vehicles Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>License Plate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Daily Rate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Owner Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No vehicles found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const statusColors = getStatusColor(vehicle.availability_status);
                  return (
                    <TableRow
                      key={vehicle._id}
                      sx={{
                        '&:hover': {
                          bgcolor: '#f9fafb'
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: '#1E3A8A', width: 32, height: 32 }}>
                            <CarIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                            {vehicle.license_plate}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {vehicle.make} {vehicle.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.year}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vehicle.category}
                          size="small"
                          sx={{
                            bgcolor: vehicle.category === 'Executive' ? '#eff6ff' : '#f3f4f6',
                            color: vehicle.category === 'Executive' ? '#1E3A8A' : '#6b7280',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#059669' }}>
                          KES {vehicle.daily_rate?.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(vehicle.availability_status)}
                          label={vehicle.availability_status}
                          size="small"
                          sx={{
                            bgcolor: statusColors.bg,
                            color: statusColors.color,
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                              color: statusColors.color
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.owner_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Vehicle">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingVehicle(vehicle);
                              setOpen(true);
                            }}
                            sx={{
                              color: '#1E3A8A',
                              '&:hover': {
                                bgcolor: '#eff6ff'
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingVehicle(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 600, color: '#111827', pb: 1 }}>
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="make"
                  label="Make"
                  defaultValue={editingVehicle?.make || ''}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="model"
                  label="Model"
                  defaultValue={editingVehicle?.model || ''}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="year"
                  label="Year"
                  type="number"
                  defaultValue={editingVehicle?.year || ''}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="license_plate"
                  label="License Plate"
                  defaultValue={editingVehicle?.license_plate || ''}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="category"
                  label="Category"
                  select
                  defaultValue={editingVehicle?.category || 'Economy'}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                >
                  <MenuItem value="Economy">Economy</MenuItem>
                  <MenuItem value="Executive">Executive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="owner_type"
                  label="Owner Type"
                  select
                  defaultValue={editingVehicle?.owner_type || 'Company Owned'}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                >
                  <MenuItem value="Company Owned">Company Owned</MenuItem>
                  <MenuItem value="Leased">Leased</MenuItem>
                  <MenuItem value="Broker">Broker</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="daily_rate"
                  label="Daily Rate (KES)"
                  type="number"
                  defaultValue={editingVehicle?.daily_rate || ''}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="availability_status"
                  label="Status"
                  select
                  defaultValue={editingVehicle?.availability_status || 'Parking'}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                >
                  <MenuItem value="Parking">Parking</MenuItem>
                  <MenuItem value="Rented Out">Rented Out</MenuItem>
                  <MenuItem value="In Garage">In Garage</MenuItem>
                  <MenuItem value="Out of Service">Out of Service</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setOpen(false);
                setEditingVehicle(null);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: '#ea580c',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  background: '#c2410c',
                }
              }}
            >
              {editingVehicle ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FleetManagement;
