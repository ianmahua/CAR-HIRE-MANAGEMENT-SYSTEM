import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  onClick,
  hover = true,
  gradient = false,
  ...props 
}) => {
  const baseStyles = 'rounded-3xl shadow-2xl bg-white p-6 transition-all duration-300';
  const hoverStyles = hover ? 'hover:shadow-3xl hover:-translate-y-2 cursor-pointer' : '';
  const gradientStyles = gradient ? 'bg-gradient-to-br from-white to-indigo-50/30' : 'bg-white';
  
  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${gradientStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;


