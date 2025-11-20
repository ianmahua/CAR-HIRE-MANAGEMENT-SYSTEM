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
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

const FleetManagement = () => {
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
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
      daily_rate: parseFloat(formData.get('daily_rate'))
    };

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle._id, data: vehicleData });
    } else {
      createMutation.mutate(vehicleData);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'In-Fleet': 'success',
      'Rented': 'warning',
      'Servicing': 'info',
      'Out of Service': 'error'
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Fleet Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingVehicle(null);
            setOpen(true);
          }}
        >
          Add Vehicle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>License Plate</TableCell>
              <TableCell>Make & Model</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Daily Rate</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Owner Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles?.map((vehicle) => (
              <TableRow key={vehicle._id}>
                <TableCell>{vehicle.license_plate}</TableCell>
                <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                <TableCell>{vehicle.category}</TableCell>
                <TableCell>KES {vehicle.daily_rate?.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={vehicle.availability_status}
                    color={getStatusColor(vehicle.availability_status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{vehicle.owner_type}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingVehicle(vehicle);
                      setOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              name="make"
              label="Make"
              defaultValue={editingVehicle?.make || ''}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              name="model"
              label="Model"
              defaultValue={editingVehicle?.model || ''}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              name="year"
              label="Year"
              type="number"
              defaultValue={editingVehicle?.year || ''}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              name="license_plate"
              label="License Plate"
              defaultValue={editingVehicle?.license_plate || ''}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              name="category"
              label="Category"
              select
              defaultValue={editingVehicle?.category || 'Economy'}
              required
            >
              <MenuItem value="Economy">Economy</MenuItem>
              <MenuItem value="Executive">Executive</MenuItem>
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              name="owner_type"
              label="Owner Type"
              select
              defaultValue={editingVehicle?.owner_type || 'Company Owned'}
              required
            >
              <MenuItem value="Company Owned">Company Owned</MenuItem>
              <MenuItem value="Leased">Leased</MenuItem>
              <MenuItem value="Broker">Broker</MenuItem>
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              name="daily_rate"
              label="Daily Rate (KES)"
              type="number"
              defaultValue={editingVehicle?.daily_rate || ''}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingVehicle ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FleetManagement;

