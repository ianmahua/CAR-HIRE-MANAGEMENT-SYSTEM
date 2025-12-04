import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const OwnerPaymentDashboard = () => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount_paid: '',
    payment_method: 'M-Pesa',
    payment_reference: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery('ownerPayments', async () => {
    const response = await api.get('/api/owner-payments/pending');
    return response.data.data;
  });

  const updatePaymentMutation = useMutation(
    async ({ paymentId, data }) => {
      const response = await api.put(`/api/owner-payments/${paymentId}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ownerPayments');
        setPaymentDialogOpen(false);
        setSelectedPayment(null);
      }
    }
  );

  const handleMarkAsPaid = (payment) => {
    setSelectedPayment(payment);
    setPaymentData({
      amount_paid: payment.amount_owed,
      payment_method: 'M-Pesa',
      payment_reference: '',
      notes: ''
    });
    setPaymentDialogOpen(true);
  };

  const handleSavePayment = () => {
    updatePaymentMutation.mutate({
      paymentId: selectedPayment._id,
      data: paymentData
    });
  };

  const getDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (payment) => {
    const daysRemaining = getDaysRemaining(payment.due_date);
    if (payment.payment_status === 'Paid') return 'success';
    if (daysRemaining < 0) return 'error';
    if (daysRemaining <= 2) return 'warning';
    return 'default';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: '600', color: '#1E3A8A' }}>
          Vehicle Owner Payments
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f3f4f6' }}>
              <TableCell><strong>Vehicle</strong></TableCell>
              <TableCell><strong>Owner Name</strong></TableCell>
              <TableCell><strong>Amount Owed</strong></TableCell>
              <TableCell><strong>Due Date</strong></TableCell>
              <TableCell><strong>Days Remaining</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No pending payments
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              payments?.map((payment) => {
                const daysRemaining = getDaysRemaining(payment.due_date);
                return (
                  <TableRow key={payment._id} hover>
                    <TableCell>
                      {payment.vehicle_ref?.make} {payment.vehicle_ref?.model}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {payment.vehicle_ref?.license_plate}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.owner_ref?.name}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: '600' }}>
                        KES {payment.amount_owed.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.due_date).toLocaleDateString('en-KE')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${daysRemaining} days`}
                        color={getStatusColor(payment)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.payment_status}
                        color={payment.payment_status === 'Paid' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        onClick={() => handleMarkAsPaid(payment)}
                        disabled={payment.payment_status === 'Paid'}
                        sx={{
                          background: '#1E3A8A',
                          '&:hover': { background: '#1e40af' }
                        }}
                      >
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: '600' }}>
            Record Payment
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <TextField
              fullWidth
              label="Amount Paid (KES)"
              type="number"
              value={paymentData.amount_paid}
              onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                label="Payment Method"
              >
                <MenuItem value="M-Pesa">M-Pesa</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Payment Reference"
              value={paymentData.payment_reference}
              onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., M-Pesa receipt number"
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPaymentDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSavePayment}
            variant="contained"
            disabled={updatePaymentMutation.isLoading || !paymentData.amount_paid}
            sx={{
              background: '#1E3A8A',
              '&:hover': { background: '#1e40af' }
            }}
          >
            {updatePaymentMutation.isLoading ? 'Saving...' : 'Save Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OwnerPaymentDashboard;











