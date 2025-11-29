import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NameSetup from '../../components/NameSetup';
import PersonalizedGreeting from '../../components/PersonalizedGreeting';
import STKPushRequest from '../../components/STKPushRequest';
import DriverTask from '../../components/DriverTask';
import DriverHistory from '../../components/DriverHistory';
import ProfilePhotoUpload from '../../components/ProfilePhotoUpload';
import HireOutCarDialog from '../../components/HireOutCarDialog';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

const DriverPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [nameSetupOpen, setNameSetupOpen] = useState(false);
  const [stkPushOpen, setStkPushOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [hireOutDialogOpen, setHireOutDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if display name needs to be set
  useEffect(() => {
    if (user && !user.display_name && user.role === 'Driver') {
      setNameSetupOpen(true);
    }
  }, [user]);

  const { data: assignments, isLoading } = useQuery('driverAssignments', async () => {
    const response = await api.get('/api/driver/assignments');
    return response.data.data;
  });

  const activeAssignments = assignments?.filter(a => a.rental_status === 'Active') || [];
  const pendingAssignments = assignments?.filter(a => a.rental_status === 'Pending') || [];
  const completedAssignments = assignments?.filter(a => a.rental_status === 'Completed') || [];

  const getStatusColor = (status) => {
    const colors = {
      'Pending': { bg: '#fffbeb', color: '#d97706', icon: <PendingIcon /> },
      'Active': { bg: '#eff6ff', color: '#2563eb', icon: <PlayIcon /> },
      'Completed': { bg: '#ecfdf5', color: '#059669', icon: <CheckIcon /> },
      'Cancelled': { bg: '#fef2f2', color: '#dc2626', icon: <CloseIcon /> }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280', icon: <AssignmentIcon /> };
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setDetailDialogOpen(true);
  };

  const handleStartDelivery = (assignment) => {
    // TODO: Implement start delivery logic
    console.log('Start delivery for:', assignment);
  };

  const getFilteredAssignments = () => {
    switch (tabValue) {
      case 0:
        return activeAssignments;
      case 1:
        return pendingAssignments;
      case 2:
        return completedAssignments;
      case 3:
        return []; // History tab shows DriverHistory component
      default:
        return assignments || [];
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1E3A8A' }}>Loading assignments...</Typography>
          <LinearProgress sx={{ width: 300, borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 4, py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, bgcolor: 'white', p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            component="img"
            src="/ressey-logo.svg"
            alt="RESSEY TOURS Logo"
            sx={{
              height: 50,
              width: 'auto'
            }}
          />
          <Box sx={{ flex: 1 }}>
            <PersonalizedGreeting />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
              Driver Portal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: '50%',
                p: 0.5,
                '&:hover': {
                  background: '#f3f4f6',
                }
              }}
              onClick={() => setPhotoDialogOpen(true)}
            >
              <Avatar
                src={user?.profile_photo ? `http://localhost:5000${user.profile_photo}` : null}
                sx={{
                  bgcolor: '#1E3A8A',
                  width: 40,
                  height: 40,
                  border: '2px solid #e5e7eb',
                  cursor: 'pointer'
                }}
              >
                {user?.name?.charAt(0) || 'D'}
              </Avatar>
            </Box>
            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              variant="outlined"
              sx={{
                borderColor: '#1E3A8A',
                color: '#1E3A8A',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#1e40af',
                  background: '#eff6ff'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                  {activeAssignments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Assignments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>
                  {pendingAssignments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Assignments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#ecfdf5', border: '1px solid #86efac', boxShadow: 'none' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                  {completedAssignments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Deliveries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<CarIcon />}
            onClick={() => setHireOutDialogOpen(true)}
            sx={{
              background: '#ea580c',
              '&:hover': { background: '#c2410c' }
            }}
          >
            Hire Out a Car
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTaskDialogOpen(true)}
            sx={{
              background: '#ea580c',
              '&:hover': { background: '#c2410c' }
            }}
          >
            Do Task
          </Button>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={() => setStkPushOpen(true)}
            sx={{
              background: '#1E3A8A',
              '&:hover': { background: '#1e40af' }
            }}
          >
            Request Payment (STK Push)
          </Button>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            mt: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 48
            },
            '& .Mui-selected': {
              color: '#1E3A8A'
            }
          }}
        >
          <Tab label={`Active (${activeAssignments.length})`} />
          <Tab label={`Pending (${pendingAssignments.length})`} />
          <Tab label={`Completed (${completedAssignments.length})`} />
          <Tab label="History" />
        </Tabs>
      </Box>

      {/* History Tab */}
      {tabValue === 3 && (
        <Box sx={{ mt: 3 }}>
          <DriverHistory />
        </Box>
      )}

      {/* Assignments Grid */}
      {tabValue !== 3 && getFilteredAssignments().length === 0 ? (
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No assignments found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0 && 'You have no active assignments at the moment.'}
              {tabValue === 1 && 'You have no pending assignments.'}
              {tabValue === 2 && 'You have no completed assignments yet.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {getFilteredAssignments().map((assignment) => {
            const statusColors = getStatusColor(assignment.rental_status);
            return (
              <Grid item xs={12} md={6} lg={4} key={assignment._id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 0.5 }}>
                          {assignment.rental_id}
                        </Typography>
                        <Chip
                          icon={statusColors.icon}
                          label={assignment.rental_status}
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
                      </Box>
                      <Avatar sx={{ bgcolor: '#1E3A8A', width: 48, height: 48 }}>
                        <CarIcon />
                      </Avatar>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Vehicle Info */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CarIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                          {assignment.vehicle_ref?.make} {assignment.vehicle_ref?.model}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        {assignment.vehicle_ref?.license_plate} • {assignment.vehicle_ref?.category}
                      </Typography>
                    </Box>

                    {/* Customer Info */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                          {assignment.customer_ref?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 4, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                          <Typography variant="body2" color="text.secondary">
                            {assignment.customer_ref?.phone || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Dates */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                        {assignment.duration_days} days
                      </Typography>
                    </Box>

                    {/* Destination */}
                    {assignment.destination && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            {assignment.destination}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                      <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        fullWidth
                        onClick={() => handleViewDetails(assignment)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: '#1E3A8A',
                          color: '#1E3A8A',
                          '&:hover': {
                            borderColor: '#1e40af',
                            bgcolor: '#eff6ff'
                          }
                        }}
                      >
                        View Details
                      </Button>
                      {assignment.rental_status === 'Pending' && (
                        <Button
                          variant="contained"
                          startIcon={<PlayIcon />}
                          fullWidth
                          onClick={() => handleStartDelivery(assignment)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#059669',
                            '&:hover': {
                              bgcolor: '#047857'
                            }
                          }}
                        >
                          Start
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        {selectedAssignment && (
          <>
            <DialogTitle sx={{ fontWeight: 600, color: '#111827', pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Assignment Details</Typography>
                <IconButton onClick={() => setDetailDialogOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        RENTAL INFORMATION
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedAssignment.rental_id}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Status</Typography>
                          <Chip
                            label={selectedAssignment.rental_status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(selectedAssignment.rental_status).bg,
                              color: getStatusColor(selectedAssignment.rental_status).color,
                              fontWeight: 600,
                              ml: 1
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Duration</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedAssignment.duration_days} days
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Total Fee</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                            KES {selectedAssignment.total_fee_gross?.toLocaleString() || '0'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        VEHICLE INFORMATION
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedAssignment.vehicle_ref?.make} {selectedAssignment.vehicle_ref?.model}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">License Plate</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedAssignment.vehicle_ref?.license_plate}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Category</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedAssignment.vehicle_ref?.category}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        CUSTOMER INFORMATION
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedAssignment.customer_ref?.name || 'N/A'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedAssignment.customer_ref?.phone || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">ID Number</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedAssignment.customer_ref?.ID_number || 'N/A'}
                          </Typography>
                        </Box>
                        {selectedAssignment.destination && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Destination</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {selectedAssignment.destination}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button
                onClick={() => setDetailDialogOpen(false)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Close
              </Button>
              {selectedAssignment.rental_status === 'Pending' && (
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => {
                    handleStartDelivery(selectedAssignment);
                    setDetailDialogOpen(false);
                  }}
                  sx={{
                    bgcolor: '#059669',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#047857'
                    }
                  }}
                >
                  Start Delivery
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Name Setup Dialog */}
      <NameSetup
        open={nameSetupOpen}
        onClose={() => setNameSetupOpen(false)}
      />

      {/* STK Push Request Dialog */}
      <STKPushRequest
        open={stkPushOpen}
        onClose={() => setStkPushOpen(false)}
      />

      {/* Do Task Dialog */}
      <DriverTask
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
      />

      {/* Profile Photo Upload Dialog */}
      <ProfilePhotoUpload
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
      />

      {/* Hire Out Car Dialog */}
      <HireOutCarDialog
        open={hireOutDialogOpen}
        onClose={() => setHireOutDialogOpen(false)}
      />
      </Box>
    </Box>
  );
};

export default DriverPortal;
