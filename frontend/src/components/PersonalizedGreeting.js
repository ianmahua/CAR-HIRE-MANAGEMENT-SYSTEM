import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const PersonalizedGreeting = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.display_name || user?.name || 'there';

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: '600',
          color: '#1E3A8A',
          mb: 0.5
        }}
      >
        {getGreeting()}, {displayName.split(' ')[0]}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Welcome back to RESSEY TOURS CRMS
      </Typography>
    </Box>
  );
};

export default PersonalizedGreeting;








