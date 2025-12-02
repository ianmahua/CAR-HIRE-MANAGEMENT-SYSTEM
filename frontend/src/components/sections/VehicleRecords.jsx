import React, { useState, useEffect } from 'react';
import { Car, Search, Calendar, User, MapPin, Clock, Phone, CheckCircle, XCircle, Wrench, AlertCircle, ArrowLeft } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';

const VehicleRecords = ({ vehicle: selectedVehicle, vehicles = [], rentals = [], onVehicleChange }) => {
  const [licensePlateSearch, setLicensePlateSearch] = useState('');
  const [vehicle, setVehicle] = useState(selectedVehicle);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-select vehicle if only one matches search
  useEffect(() => {
    if (licensePlateSearch.trim()) {
      const found = vehicles.find(v => 
        v.license_plate?.toLowerCase().includes(licensePlateSearch.toLowerCase().trim())
      );
      if (found) {
        setVehicle(found);
      }
    } else if (selectedVehicle) {
      setVehicle(selectedVehicle);
      setLicensePlateSearch(selectedVehicle.license_plate || '');
    }
  }, [licensePlateSearch, vehicles, selectedVehicle]);

  // If no vehicle selected, show search interface
  if (!vehicle) {
    const matchingVehicles = licensePlateSearch.trim()
      ? vehicles.filter(v => 
          v.license_plate?.toLowerCase().includes(licensePlateSearch.toLowerCase().trim())
        )
      : [];

    return (
      <div className="space-y-6">
        {/* Search Header */}
        <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Car className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">Vehicle Records Lookup</h2>
              <p className="text-indigo-100">Enter a license plate number to view complete vehicle history</p>
            </div>
          </div>

          {/* License Plate Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-indigo-200" />
            <input
              type="text"
              placeholder="Enter license plate (e.g., KDA 001A)"
              value={licensePlateSearch}
              onChange={(e) => setLicensePlateSearch(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white placeholder-indigo-200 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all text-lg font-semibold"
              style={{ fontSize: '1.1rem' }}
            />
          </div>

          {/* Matching Vehicles */}
          {matchingVehicles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-indigo-100 font-semibold">Matching Vehicles:</p>
              {matchingVehicles.map((v) => (
                <button
                  key={v._id}
                  onClick={() => {
                    setVehicle(v);
                    setLicensePlateSearch(v.license_plate || '');
                    // Notify parent of vehicle selection
                    if (onVehicleChange) {
                      onVehicleChange(v);
                    }
                  }}
                  className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-all backdrop-blur-sm"
                >
                  <p className="font-bold text-white">{v.license_plate}</p>
                  <p className="text-sm text-indigo-100">{v.make} {v.model} • {v.year}</p>
                </button>
              ))}
            </div>
          )}

          {licensePlateSearch.trim() && matchingVehicles.length === 0 && (
            <div className="mt-4 p-4 bg-amber-500/20 rounded-xl border border-amber-300/30">
              <p className="text-white font-semibold">No vehicle found with license plate "{licensePlateSearch}"</p>
            </div>
          )}
        </Card>

        {/* Quick Access - Recent Vehicles */}
        {vehicles.length > 0 && !licensePlateSearch.trim() && (
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Access - All Vehicles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.slice(0, 12).map((v) => (
                <button
                  key={v._id}
                  onClick={() => {
                    setVehicle(v);
                    setLicensePlateSearch(v.license_plate || '');
                    // Notify parent of vehicle selection
                    if (onVehicleChange) {
                      onVehicleChange(v);
                    }
                  }}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Car className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{v.license_plate}</p>
                      <p className="text-sm text-gray-600">{v.make} {v.model}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  const vehicleRentals = rentals.filter(r => 
    r.vehicle_ref?._id === vehicle._id || 
    r.vehicle_ref === vehicle._id ||
    r.vehicle_id === vehicle.vehicle_id ||
    r.vehicle_ref?.license_plate === vehicle.license_plate
  ).sort((a, b) => {
    // Sort by start date, most recent first
    const dateA = new Date(a.start_date || 0);
    const dateB = new Date(b.start_date || 0);
    return dateB - dateA;
  });

  const filteredRentals = vehicleRentals.filter(rental => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      rental.customer_ref?.name?.toLowerCase().includes(searchLower) ||
      rental.customer_ref?.phone?.toLowerCase().includes(searchLower) ||
      rental.rental_id?.toLowerCase().includes(searchLower) ||
      rental.destination?.toLowerCase().includes(searchLower) ||
      rental.notes?.toLowerCase().includes(searchLower)
    );
  });

  const totalRentals = vehicleRentals.length;
  const activeRentals = vehicleRentals.filter(r => r.rental_status === 'Active').length;
  const completedRentals = vehicleRentals.filter(r => r.rental_status === 'Completed').length;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return CheckCircle;
      case 'Active': return Clock;
      case 'Parking': return CheckCircle;
      case 'Rented Out': return Car;
      case 'In Garage': return Wrench;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Parking': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Active':
      case 'Rented Out': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Garage': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => {
          setVehicle(null);
          setLicensePlateSearch('');
          setSearchTerm('');
          // Notify parent to clear selected vehicle
          if (onVehicleChange) {
            onVehicleChange(null);
          }
        }}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-semibold group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Vehicle List</span>
      </button>

      {/* Vehicle Header with Search */}
      <Card className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-4">
          <div className="p-6 bg-white/20 rounded-3xl backdrop-blur-sm">
            <Car className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold">{vehicle.license_plate}</h2>
              <button
                onClick={() => {
                  setVehicle(null);
                  setLicensePlateSearch('');
                  setSearchTerm('');
                  // Notify parent to clear selected vehicle
                  if (onVehicleChange) {
                    onVehicleChange(null);
                  }
                }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Vehicle
              </button>
            </div>
            <p className="text-indigo-100 text-lg mb-2">
              {vehicle.make} {vehicle.model} • {vehicle.year} • {vehicle.category}
            </p>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                vehicle.availability_status === 'Parking' 
                  ? 'bg-emerald-500/30 border-emerald-300 text-white'
                  : vehicle.availability_status === 'Rented Out'
                  ? 'bg-amber-500/30 border-amber-300 text-white'
                  : 'bg-indigo-500/30 border-indigo-300 text-white'
              }`}>
                {vehicle.availability_status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* License Plate Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-200" />
          <input
            type="text"
            placeholder="Search by license plate to view another vehicle..."
            value={licensePlateSearch}
            onChange={(e) => setLicensePlateSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all"
          />
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-indigo-600">{totalRentals}</p>
            <p className="text-sm text-gray-600">Total Rentals</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-600">{completedRentals}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-amber-600">{activeRentals}</p>
            <p className="text-sm text-gray-600">Active Now</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-600 capitalize">
              {vehicle.availability_status || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600">Current Status</p>
          </div>
        </Card>
      </div>

      {/* Search Rental History */}
      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, destination, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </Card>

      {/* Rental History */}
      <div className="space-y-4">
        {filteredRentals.length > 0 ? (
          filteredRentals.map((rental, idx) => {
            const StatusIcon = getStatusIcon(rental.rental_status);
            const startDate = rental.start_date ? new Date(rental.start_date) : null;
            const endDate = rental.end_date ? new Date(rental.end_date) : null;
            const actualReturnDate = rental.actual_return_date ? new Date(rental.actual_return_date) : null;
            const duration = startDate && endDate 
              ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Card key={rental._id || rental.rental_id || idx} className="hover:shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl">
                      <User className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {rental.customer_ref?.name || rental.customer_name || 'Unknown Customer'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {rental.customer_ref?.phone || rental.customer_phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{rental.customer_ref?.phone || rental.customer_phone}</span>
                          </div>
                        ) : null}
                        {rental.rental_id && (
                          <span>ID: {rental.rental_id}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(rental.rental_status).split(' ')[1]}`} />
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(rental.rental_status)}`}>
                      {rental.rental_status || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Hire Out Date & Time */}
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="text-xs text-gray-600 uppercase font-bold">Hired Out</p>
                    </div>
                    {startDate ? (
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {startDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {startDate.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  {/* Return Date & Time */}
                  <div className={`rounded-xl p-4 border-2 ${
                    rental.rental_status === 'Active' && endDate && endDate < new Date()
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className={`w-5 h-5 ${
                        rental.rental_status === 'Active' && endDate && endDate < new Date()
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`} />
                      <p className="text-xs text-gray-600 uppercase font-bold">
                        {actualReturnDate ? 'Returned' : 'Expected Return'}
                      </p>
                    </div>
                    {(actualReturnDate || endDate) ? (
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {(actualReturnDate || endDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        {(actualReturnDate || endDate) && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {(actualReturnDate || endDate).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  {/* Duration */}
                  {duration !== null && (
                    <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <p className="text-xs text-gray-600 uppercase font-bold">Duration</p>
                      </div>
                      <p className="text-lg font-bold text-indigo-600">
                        {duration} {duration === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  )}

                  {/* Destination */}
                  {rental.destination && (
                    <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <p className="text-xs text-gray-600 uppercase font-bold">Destination</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{rental.destination}</p>
                    </div>
                  )}

                  {/* Dispatcher */}
                  {rental.dispatched_by && (
                    <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-amber-600" />
                        <p className="text-xs text-gray-600 uppercase font-bold">Dispatched By</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{rental.dispatched_by}</p>
                    </div>
                  )}

                  {/* Hire Type */}
                  {rental.hire_type && (
                    <div className="bg-teal-50 rounded-xl p-4 border-2 border-teal-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-5 h-5 text-teal-600" />
                        <p className="text-xs text-gray-600 uppercase font-bold">Hire Type</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{rental.hire_type}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {rental.notes && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Notes</p>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{rental.notes}</p>
                  </div>
                )}

                {/* Extension Info */}
                {rental.is_extended && (
                  <div className="mt-4 pt-4 border-t-2 border-amber-200 bg-amber-50 rounded-lg p-3">
                    <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Extended Rental
                    </p>
                    {rental.extension_days && (
                      <p className="text-sm text-amber-700 mt-1">
                        Extended by {rental.extension_days} {rental.extension_days === 1 ? 'day' : 'days'}
                      </p>
                    )}
                    {rental.extension_payment_status && (
                      <p className="text-sm text-amber-700">
                        Payment: {rental.extension_payment_status}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold mb-2">
                {searchTerm ? 'No matching records found' : 'No rental history found for this vehicle'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VehicleRecords;

