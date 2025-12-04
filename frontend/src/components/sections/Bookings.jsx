import React from 'react';
import BookingsList from './BookingsList';

// Wrapper component to keep existing DriverPortal wiring
const Bookings = ({ onCreateBooking }) => {
  return <BookingsList onCreateBooking={onCreateBooking} />;
};

export default Bookings;

