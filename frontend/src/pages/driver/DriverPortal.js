import React from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { 
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip
} from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

const DriverPortal = () => {
  const { data: assignments, isLoading } = useQuery('driverAssignments', async () => {
    const response = await api.get('/api/driver/assignments');
    return response.data.data;
  });

  if (isLoading) {
    return <Typography>Loading assignments...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        My Assignments
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {assignments?.map((assignment) => (
          <Grid item xs={12} sm={6} md={4} key={assignment._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssignmentIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">{assignment.rental_id}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Customer: {assignment.customer_ref?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vehicle: {assignment.vehicle_ref?.make} {assignment.vehicle_ref?.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  License: {assignment.vehicle_ref?.license_plate}
                </Typography>
                <Box mt={2}>
                  <Chip
                    label={assignment.rental_status}
                    color={assignment.rental_status === 'Active' ? 'primary' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                        onClick={() => {
                    // Navigate to handover form
                  }}
                >
                  {assignment.rental_status === 'Pending' ? 'Start Delivery' : 'View Details'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DriverPortal;

