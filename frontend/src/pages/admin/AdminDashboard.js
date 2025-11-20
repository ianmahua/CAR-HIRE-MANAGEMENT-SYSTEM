import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

import DashboardOverview from './DashboardOverview';
import FleetManagement from './FleetManagement';
import BookingManagement from './BookingManagement';
import CustomerManagement from './CustomerManagement';
import FinancialReconciliation from './FinancialReconciliation';

const drawerWidth = 240;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Fleet Management', icon: <DirectionsCarIcon />, path: '/admin/fleet' },
    { text: 'Bookings', icon: <BookOnlineIcon />, path: '/admin/bookings' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/admin/customers' },
    { text: 'Financials', icon: <PaymentIcon />, path: '/admin/financials' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Admin Portal - THE RESSEY TOURS CRMS
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <ListItemButton onClick={handleLogout} sx={{ color: 'white' }}>
            <ListItemIcon sx={{ color: 'white' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/fleet" element={<FleetManagement />} />
            <Route path="/bookings" element={<BookingManagement />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/financials" element={<FinancialReconciliation />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;

