import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const VehicleOwnerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_details: { phone: '', email: '', address: '' },
    payout_rate: { type: 'percentage', value: 70 },
    payout_due_day: 15,
    contract_status: 'Active'
  });
  const queryClient = useQueryClient();

  const { data: owners, isLoading } = useQuery('vehicle-owners', async () => {
    const response = await api.get('/api/vehicle-owners');
    return response.data.data;
  });

  const createMutation = useMutation(
    (data) => api.post('/api/vehicle-owners', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicle-owners');
        toast.success('Vehicle owner added successfully');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add vehicle owner');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/api/vehicle-owners/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicle-owners');
        toast.success('Vehicle owner updated successfully');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update vehicle owner');
      }
    }
  );

  const handleOpenDialog = (owner = null) => {
    if (owner) {
      setEditingOwner(owner);
      setFormData({
        name: owner.name,
        contact_details: owner.contact_details || { phone: '', email: '', address: '' },
        payout_rate: owner.payout_rate || { type: 'percentage', value: 70 },
        payout_due_day: owner.payout_due_day || 15,
        contract_status: owner.contract_status || 'Active'
      });
    } else {
      setEditingOwner(null);
      setFormData({
        name: '',
        contact_details: { phone: '', email: '', address: '' },
        payout_rate: { type: 'percentage', value: 70 },
        payout_due_day: 15,
        contract_status: 'Active'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOwner(null);
    setFormData({
      name: '',
      contact_details: { phone: '', email: '', address: '' },
      payout_rate: { type: 'percentage', value: 70 },
      payout_due_day: 15,
      contract_status: 'Active'
    });
  };

  const handleSubmit = () => {
    if (editingOwner) {
      updateMutation.mutate({ id: editingOwner._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredOwners = owners?.filter(owner => {
    return (
      owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.contact_details?.phone?.includes(searchTerm) ||
      owner.contact_details?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const stats = {
    total: owners?.length || 0,
    active: owners?.filter(o => o.contract_status === 'Active').length || 0,
    totalVehicles: owners?.reduce((sum, o) => sum + (o.linked_vehicles?.length || 0), 0) || 0
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
              Vehicle Owner Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage vehicle lessors and their contracts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: '#1E3A8A',
              '&:hover': { background: '#1e40af' }
            }}
          >
            Add Owner
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Owners
                </Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', bgcolor: '#ecfdf5' }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Contracts
                </Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', bgcolor: '#eff6ff' }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                  {stats.totalVehicles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leased Vehicles
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <TextField
          placeholder="Search by name, phone, or email..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            width: '100%',
            maxWidth: 500,
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
      </Box>

      {/* Owners Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Owner</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Payout Rate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Vehicles</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Total Earnings</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOwners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No vehicle owners found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOwners.map((owner) => (
                  <TableRow
                    key={owner._id}
                    sx={{
                      '&:hover': {
                        bgcolor: '#f9fafb'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#1E3A8A', width: 40, height: 40 }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                            {owner.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {owner.owner_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                          <Typography variant="body2">
                            {owner.contact_details?.phone}
                          </Typography>
                        </Box>
                        {owner.contact_details?.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                            <Typography variant="body2" color="text.secondary">
                              {owner.contact_details.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {owner.payout_rate?.type === 'percentage' 
                          ? `${owner.payout_rate.value}%`
                          : `KES ${owner.payout_rate?.value?.toLocaleString()}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: Day {owner.payout_due_day}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CarIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                          {owner.linked_vehicles?.length || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={owner.contract_status}
                        size="small"
                        sx={{
                          bgcolor: owner.contract_status === 'Active' ? '#ecfdf5' : '#fef2f2',
                          color: owner.contract_status === 'Active' ? '#059669' : '#dc2626',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                        KES {owner.total_earnings?.toLocaleString() || '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Owner">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(owner)}
                          sx={{ color: '#1E3A8A' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
            {editingOwner ? 'Edit Vehicle Owner' : 'Add New Vehicle Owner'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <TextField
              fullWidth
              label="Owner Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone *"
              value={formData.contact_details.phone}
              onChange={(e) => setFormData({
                ...formData,
                contact_details: { ...formData.contact_details, phone: e.target.value }
              })}
              margin="normal"
              required
              placeholder="254XXXXXXXXX"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.contact_details.email}
              onChange={(e) => setFormData({
                ...formData,
                contact_details: { ...formData.contact_details, email: e.target.value }
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.contact_details.address}
              onChange={(e) => setFormData({
                ...formData,
                contact_details: { ...formData.contact_details, address: e.target.value }
              })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Payout Rate Type</InputLabel>
              <Select
                value={formData.payout_rate.type}
                onChange={(e) => setFormData({
                  ...formData,
                  payout_rate: { ...formData.payout_rate, type: e.target.value }
                })}
                label="Payout Rate Type"
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={formData.payout_rate.type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (KES)'}
              type="number"
              value={formData.payout_rate.value}
              onChange={(e) => setFormData({
                ...formData,
                payout_rate: { ...formData.payout_rate, value: parseFloat(e.target.value) }
              })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Payout Due Day (1-31)"
              type="number"
              value={formData.payout_due_day}
              onChange={(e) => setFormData({ ...formData, payout_due_day: parseInt(e.target.value) })}
              margin="normal"
              required
              inputProps={{ min: 1, max: 31 }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Contract Status</InputLabel>
              <Select
                value={formData.contract_status}
                onChange={(e) => setFormData({ ...formData, contract_status: e.target.value })}
                label="Contract Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
                <MenuItem value="Terminated">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isLoading || updateMutation.isLoading}
            sx={{
              background: '#1E3A8A',
              '&:hover': { background: '#1e40af' }
            }}
          >
            {createMutation.isLoading || updateMutation.isLoading
              ? 'Saving...'
              : editingOwner
              ? 'Update'
              : 'Add Owner'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleOwnerManagement;








