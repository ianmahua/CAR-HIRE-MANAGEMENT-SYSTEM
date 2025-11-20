import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import DirectorDashboard from './pages/director/DirectorDashboard';
import DriverPortal from './pages/driver/DriverPortal';
import OwnerPortal from './pages/owner/OwnerPortal';
import PrivateRoute from './components/PrivateRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role.toLowerCase()}`} />} />
      
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/director/*"
        element={
          <PrivateRoute allowedRoles={['Director']}>
            <DirectorDashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/driver/*"
        element={
          <PrivateRoute allowedRoles={['Driver']}>
            <DriverPortal />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/owner/*"
        element={
          <PrivateRoute allowedRoles={['Owner']}>
            <OwnerPortal />
          </PrivateRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

