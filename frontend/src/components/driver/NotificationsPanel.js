import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Badge,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const NotificationsPanel = ({ open, onClose, onExtendRental, onMarkReturned }) => {
  const [notifications, setNotifications] = useState([]);

  // Fetch rentals for notifications
  const { data: rentals } = useQuery('rentals', async () => {
    try {
      const response = await api.get('/api/rentals');
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    if (rentals) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const notifs = [];

      // Vehicles due today
      const dueToday = rentals.filter(rental => {
        if (!rental.end_date || rental.rental_status !== 'Active') return false;
        const returnDate = new Date(rental.end_date);
        returnDate.setHours(0, 0, 0, 0);
        return returnDate.getTime() === today.getTime();
      });

      dueToday.forEach(rental => {
        notifs.push({
          id: `due-today-${rental._id}`,
          type: 'return_today',
          priority: 'high',
          title: `Vehicle ${rental.vehicle_ref?.license_plate || 'N/A'} is expected to return TODAY`,
          message: `Customer: ${rental.customer_ref?.name || 'N/A'}`,
          rental: rental,
          date: rental.end_date
        });
      });

      // Vehicles due in 1-2 days
      const dueSoon = rentals.filter(rental => {
        if (!rental.end_date || rental.rental_status !== 'Active') return false;
        const returnDate = new Date(rental.end_date);
        const daysUntilReturn = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilReturn > 0 && daysUntilReturn <= 2;
      });

      dueSoon.forEach(rental => {
        const returnDate = new Date(rental.end_date);
        const daysUntilReturn = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
        notifs.push({
          id: `due-soon-${rental._id}`,
          type: 'return_soon',
          priority: daysUntilReturn === 1 ? 'high' : 'medium',
          title: `Vehicle ${rental.vehicle_ref?.license_plate || 'N/A'} is expected to return in ${daysUntilReturn} day${daysUntilReturn > 1 ? 's' : ''}`,
          message: `Customer: ${rental.customer_ref?.name || 'N/A'}`,
          rental: rental,
          date: rental.end_date
        });
      });

      // Future bookings (2 days and 1 day before)
      const futureBookings = rentals.filter(rental => {
        if (!rental.start_date || rental.rental_status !== 'Pending') return false;
        const bookingDate = new Date(rental.start_date);
        const daysUntilBooking = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilBooking === 1 || daysUntilBooking === 2;
      });

      futureBookings.forEach(rental => {
        const bookingDate = new Date(rental.start_date);
        const daysUntilBooking = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
        notifs.push({
          id: `booking-${rental._id}`,
          type: 'booking_reminder',
          priority: daysUntilBooking === 1 ? 'high' : 'medium',
          title: `Customer ${rental.customer_ref?.name || 'N/A'} has a booking for ${rental.vehicle_ref?.license_plate || 'N/A'} ${daysUntilBooking === 1 ? 'TOMORROW' : 'in 2 days'}`,
          message: `Booking date: ${new Date(rental.start_date).toLocaleDateString()}`,
          rental: rental,
          date: rental.start_date
        });
      });

      // Pending payments
      const pendingPayments = rentals.filter(rental => 
        (rental.payment_status === 'Pending' || rental.payment_status === 'Partial') && rental.rental_status === 'Active'
      );

      pendingPayments.forEach(rental => {
        notifs.push({
          id: `payment-${rental._id}`,
          type: 'payment_pending',
          priority: 'medium',
          title: `Pending payment for ${rental.vehicle_ref?.license_plate || 'N/A'}`,
          message: `Customer: ${rental.customer_ref?.name || 'N/A'} • Amount: KES ${rental.total_fee_gross?.toLocaleString() || '0'}`,
          rental: rental
        });
      });

      setNotifications(notifs.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return new Date(b.date || 0) - new Date(a.date || 0);
      }));
    }
  }, [rentals]);

  const getNotificationColor = (priority) => {
    if (priority === 'high') return '#dc2626';
    if (priority === 'medium') return '#d97706';
    return '#2563eb';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'return_today':
      case 'return_soon':
        return <CarIcon />;
      case 'booking_reminder':
        return <ScheduleIcon />;
      case 'payment_pending':
        return <PaymentIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
            Notifications
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <NotificationsIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                sx={{
                  borderRadius: 2,
                  border: `2px solid ${getNotificationColor(notif.priority)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${getNotificationColor(notif.priority)}20`, width: 40, height: 40 }}>
                      {getNotificationIcon(notif.type)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {notif.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notif.message}
                      </Typography>
                    </Box>
                  </Box>

                  {(notif.type === 'return_today' || notif.type === 'return_soon') && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckIcon />}
                        onClick={() => onMarkReturned && onMarkReturned(notif.rental)}
                        sx={{
                          bgcolor: '#059669',
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#047857' }
                        }}
                      >
                        Mark Returned
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onExtendRental && onExtendRental(notif.rental)}
                        sx={{
                          borderColor: '#d97706',
                          color: '#d97706',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#b45309',
                            bgcolor: '#fffbeb'
                          }
                        }}
                      >
                        Extend Rental
                      </Button>
                    </Box>
                  )}

                  {notif.type === 'booking_reminder' && (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      sx={{
                        mt: 2,
                        borderColor: '#1E3A8A',
                        color: '#1E3A8A',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#1e40af',
                          bgcolor: '#eff6ff'
                        }
                      }}
                    >
                      View Booking Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationsPanel;

