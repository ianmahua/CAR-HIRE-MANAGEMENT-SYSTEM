import React from 'react';

const StatBadge = ({ label, value, icon: Icon, color = 'indigo', onClick }) => {
  const colors = {
    indigo: 'from-indigo-600 to-blue-600 shadow-indigo-500/50',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/50',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/50',
    rose: 'from-rose-500 to-red-600 shadow-rose-500/50',
    purple: 'from-purple-600 to-pink-600 shadow-purple-500/50'
  };
  
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} rounded-3xl p-6 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
          {Icon && <Icon className="w-8 h-8" />}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium opacity-90">{label}</p>
        <p className="text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default StatBadge;





