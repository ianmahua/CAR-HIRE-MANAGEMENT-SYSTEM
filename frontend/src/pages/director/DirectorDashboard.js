import React from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DirectorDashboard = () => {
  const { data, isLoading } = useQuery('directorDashboard', async () => {
    const response = await api.get('/api/director/dashboard');
    return response.data.data;
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const financialData = data?.financial_health;
  const fleetData = data?.fleet_efficiency;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Director Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Health
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Net Income (MTD): KES {financialData?.net_income?.net_income?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body1">
                Gross Profit Margin: {financialData?.gross_profit_margin || 0}%
              </Typography>
              <Typography variant="body1">
                Net Profit Margin: {financialData?.net_profit_margin || 0}%
              </Typography>
              <Typography variant="body1">
                Revenue Per Available Car-Day: KES {financialData?.racd || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Fleet Efficiency
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Utilization Rate: {fleetData?.utilization_rate || 0}%
              </Typography>
              <Typography variant="body1">
                Total Fleet: {fleetData?.total_fleet || 0} vehicles
              </Typography>
              <Typography variant="body1">
                Currently Rented: {fleetData?.rented_vehicles || 0} vehicles
              </Typography>
              <Typography variant="body1">
                Economy: {fleetData?.economy_count || 0} | Executive: {fleetData?.executive_count || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Driver Performance Matrix
            </Typography>
            <Box sx={{ mt: 2 }}>
              {data?.operational_insights?.driver_performance?.map((perf, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>{perf.driver_name}</strong> - {perf.vehicle} - Customer: {perf.customer}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DirectorDashboard;

