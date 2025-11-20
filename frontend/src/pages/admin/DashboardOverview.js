import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  CheckCircle as AvailableIcon,
  Assignment as RentedIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

const DashboardOverview = () => {
  const { data, isLoading } = useQuery('adminDashboard', async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data.data;
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = [
    {
      title: 'Total Vehicles',
      value: data?.total_vehicles || 0,
      icon: <CarIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2'
    },
    {
      title: 'Available',
      value: data?.available_vehicles || 0,
      icon: <AvailableIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32'
    },
    {
      title: 'Rented',
      value: data?.rented_vehicles || 0,
      icon: <RentedIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02'
    },
    {
      title: 'Utilization Rate',
      value: `${data?.utilization_rate || 0}%`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderLeft: `4px solid ${stat.color}`
              }}
            >
              <Box sx={{ color: stat.color, mb: 1 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" component="div">
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardOverview;

