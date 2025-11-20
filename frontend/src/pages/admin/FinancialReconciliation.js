import React from 'react';
import { useQuery } from 'react-query';
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
  Paper,
  Chip
} from '@mui/material';

const FinancialReconciliation = () => {
  const { data: transactions, isLoading } = useQuery('transactions', async () => {
    const response = await api.get('/api/transactions');
    return response.data.data;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Confirmed': 'success',
      'Pending': 'warning',
      'Failed': 'error',
      'Reversed': 'default'
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Financial Reconciliation
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions?.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>{transaction.transaction_id}</TableCell>
                <TableCell>{transaction.type}</TableCell>
                <TableCell>KES {transaction.amount?.toLocaleString()}</TableCell>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={transaction.status}
                    color={getStatusColor(transaction.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{transaction.account_reference || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FinancialReconciliation;

