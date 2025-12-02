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

  // Fetch backend-generated driver notifications
  const { data } = useQuery('driver_notifications', async () => {
    try {
      const response = await api.get('/api/notifications/driver');
      return response.data || { success: false, notifications: [] };
    } catch (error) {
      return { success: false, notifications: [] };
    }
  });

  useEffect(() => {
    if (!data || !data.success) {
      setNotifications([]);
      return;
    }

    const backendNotifications = data.notifications || [];
    const mapped = backendNotifications.map((n, idx) => {
      const rental = n.booking || n.rental || null;
      const vehiclePlate =
        rental?.vehicle_ref?.license_plate ||
        rental?.vehicle_ref?.licensePlate ||
        rental?.license_plate ||
        'N/A';
      const customerName = rental?.customer_ref?.name || rental?.customer_name || 'Customer';

      if (n.type === 'return_today') {
        return {
          id: n._id || `return-today-${rental?._id || idx}`,
          type: 'return_today',
          priority: 'high',
          title: `Vehicle ${vehiclePlate} is expected to return TODAY`,
          message: `Customer: ${customerName}`,
          rental,
          date: rental?.end_date || rental?.return_date
        };
      }

      if (n.type === 'overdue') {
        return {
          id: n._id || `overdue-${rental?._id || idx}`,
          type: 'return_soon',
          priority: 'high',
          title: `Vehicle ${vehiclePlate} return is OVERDUE`,
          message: `Customer: ${customerName}`,
          rental,
          date: rental?.end_date || rental?.return_date
        };
      }

      // Treat generic "reminder" as upcoming booking reminder
      return {
        id: n._id || `reminder-${rental?._id || idx}`,
        type: 'booking_reminder',
        priority: 'medium',
        title: `Upcoming booking for ${customerName}`,
        message: n.message || `Vehicle: ${vehiclePlate}`,
        rental,
        date: rental?.start_date || rental?.booking_date
      };
    });

    // Filter out any nulls and sort by priority + date
    const cleaned = mapped.filter(Boolean).sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    setNotifications(cleaned);
  }, [data]);

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


