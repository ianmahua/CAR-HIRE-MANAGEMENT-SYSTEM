import React from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';

const OwnerPortal = () => {
  const { data, isLoading } = useQuery('ownerData', async () => {
    const response = await api.get('/api/owner/vehicles');
    return response.data.data;
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vehicle Owner Portal
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          My Vehicles Performance
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>Revenue (MTD)</TableCell>
                <TableCell>Hired Days</TableCell>
                <TableCell>GCCM</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.vehicles?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {item.vehicle?.make} {item.vehicle?.model}
                  </TableCell>
                  <TableCell>
                    KES {item.performance?.revenue?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>{item.performance?.hired_days || 0}</TableCell>
                  <TableCell>
                    KES {item.performance?.gccm?.toLocaleString() || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default OwnerPortal;

