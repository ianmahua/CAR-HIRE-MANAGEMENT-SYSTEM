import React, { useState } from 'react';
import { Car, Search, Filter, CheckCircle, XCircle, Wrench } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';

const Vehicles = ({ vehicles, onVehicleClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status) => {
    const statusMap = {
      'Parking': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Available' },
      'Rented Out': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Car, label: 'Rented Out' },
      'In Garage': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Wrench, label: 'In Garage' }
    };
    
    const config = statusMap[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, label: status };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border-2 ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchTerm || 
      vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'available' && vehicle.availability_status === 'Parking') ||
      (statusFilter === 'rented' && vehicle.availability_status === 'Rented Out') ||
      (statusFilter === 'garage' && vehicle.availability_status === 'In Garage');
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.availability_status === 'Parking').length,
    rented: vehicles.filter(v => v.availability_status === 'Rented Out').length,
    garage: vehicles.filter(v => v.availability_status === 'In Garage').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Fleet Management</h2>
        <p className="text-gray-600">View and manage all company vehicles</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'ring-2 ring-indigo-500' : ''}>
          <div className="text-center">
            <Car className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Fleet</p>
          </div>
        </Card>
        <Card onClick={() => setStatusFilter('available')} className={statusFilter === 'available' ? 'ring-2 ring-emerald-500' : ''}>
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-600">{stats.available}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </Card>
        <Card onClick={() => setStatusFilter('rented')} className={statusFilter === 'rented' ? 'ring-2 ring-amber-500' : ''}>
          <div className="text-center">
            <Car className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-amber-600">{stats.rented}</p>
            <p className="text-sm text-gray-600">Rented Out</p>
          </div>
        </Card>
        <Card onClick={() => setStatusFilter('garage')} className={statusFilter === 'garage' ? 'ring-2 ring-indigo-500' : ''}>
          <div className="text-center">
            <Wrench className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-indigo-600">{stats.garage}</p>
            <p className="text-sm text-gray-600">In Garage</p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by plate, make, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'available' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('available')}
            >
              Available
            </Button>
            <Button
              variant={statusFilter === 'rented' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('rented')}
            >
              Rented
            </Button>
            <Button
              variant={statusFilter === 'garage' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('garage')}
            >
              Garage
            </Button>
          </div>
        </div>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle, idx) => (
          <Card
            key={vehicle._id || vehicle.vehicle_id || idx}
            onClick={() => onVehicleClick(vehicle)}
            className="group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl text-white">
                <Car className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{vehicle.license_plate}</h3>
                <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                <p className="text-xs text-gray-500">{vehicle.year} • {vehicle.category}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              {getStatusBadge(vehicle.availability_status)}
              <span className="text-lg font-bold text-emerald-600">
                KES {vehicle.daily_rate?.toLocaleString()}/day
              </span>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              View History
            </Button>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No vehicles found</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Vehicles;

