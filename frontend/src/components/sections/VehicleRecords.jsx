import React, { useState, useEffect } from 'react';
import { 
  Car, Search, Calendar, User, MapPin, Clock, Phone, 
  CheckCircle, XCircle, Wrench, AlertCircle, ArrowLeft, X, Thermometer 
} from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Calendar status color mapping
const getDayStatusStyles = (status) => {
  switch (status) {
    case 'RENTED':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'IN_SERVICE':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'PARKED':
    default:
      return 'bg-emerald-100 border-emerald-300 text-emerald-800';
  }
};

// Vehicle health card
const VehicleHealth = ({ vehicle }) => {
  const maintenance = vehicle?.maintenance || {};

  const lastServiceDate = maintenance.lastServiceDate
    ? new Date(maintenance.lastServiceDate)
    : null;
  const lastServiceMileage = maintenance.lastServiceMileage ?? null;
  const currentMileage = maintenance.currentMileage ?? vehicle.last_odometer_reading ?? 0;

  const intervalKm = maintenance.serviceIntervalKm || 5000;
  const intervalDays = maintenance.serviceIntervalDays || 90;

  const nextServiceDueDate = maintenance.nextServiceDueDate
    ? new Date(maintenance.nextServiceDueDate)
    : (lastServiceDate
        ? new Date(lastServiceDate.getTime() + intervalDays * 24 * 60 * 60 * 1000)
        : null);

  const nextServiceDueMileage = maintenance.nextServiceDueMileage ??
    (lastServiceMileage != null
      ? lastServiceMileage + intervalKm
      : currentMileage + intervalKm);

  // Days until next service
  let daysUntil = null;
  if (nextServiceDueDate) {
    const today = new Date();
    const diffMs = nextServiceDueDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
    daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  const mileageUntil =
    nextServiceDueMileage != null ? nextServiceDueMileage - currentMileage : null;

  // Determine health color
  let statusColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
  let statusLabel = 'Healthy – Service not due soon';

  const daysThresholdRed = 14;
  const daysThresholdYellow = 30;
  const kmThresholdRed = 500;
  const kmThresholdYellow = 1000;

  const isOverdue =
    (daysUntil != null && daysUntil < 0) ||
    (mileageUntil != null && mileageUntil < 0);

  const isVeryClose =
    !isOverdue &&
    ((daysUntil != null && daysUntil <= daysThresholdRed) ||
      (mileageUntil != null && mileageUntil <= kmThresholdRed));

  const isApproaching =
    !isOverdue &&
    !isVeryClose &&
    ((daysUntil != null && daysUntil <= daysThresholdYellow) ||
      (mileageUntil != null && mileageUntil <= kmThresholdYellow));

  if (isOverdue || isVeryClose) {
    statusColor = 'bg-red-50 border-red-200 text-red-800';
    statusLabel = 'Service overdue or very close';
  } else if (isApproaching) {
    statusColor = 'bg-amber-50 border-amber-200 text-amber-800';
    statusLabel = 'Service approaching';
  }

  return (
    <Card className="border-2" hover={false}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Vehicle Health</p>
            <p className="text-sm font-bold text-gray-900">{statusLabel}</p>
            <p className="text-xs text-gray-500 mt-1">
              Interval: {intervalKm.toLocaleString()} km or {intervalDays} days (whichever comes first)
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
          {daysUntil != null && (
            <span>
              {daysUntil < 0 ? 'Overdue by ' : 'In '}
              {Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 ? 's' : ''}
            </span>
          )}
          {daysUntil != null && mileageUntil != null && <span className="mx-1">•</span>}
          {mileageUntil != null && (
            <span>
              {mileageUntil < 0 ? 'Over by ' : 'In '}
              {Math.abs(Math.round(mileageUntil)).toLocaleString()} km
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs md:text-sm">
        <div>
          <p className="text-gray-500 font-semibold">Last Service Date</p>
          <p className="text-gray-900 font-bold">
            {lastServiceDate
              ? lastServiceDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'Not recorded'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Last Service Mileage</p>
          <p className="text-gray-900 font-bold">
            {lastServiceMileage != null
              ? `${lastServiceMileage.toLocaleString()} km`
              : 'Not recorded'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Next Service Due Date</p>
          <p className="text-gray-900 font-bold">
            {nextServiceDueDate
              ? nextServiceDueDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'Not calculated'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Next Service Mileage</p>
          <p className="text-gray-900 font-bold">
            {nextServiceDueMileage != null
              ? `${Math.round(nextServiceDueMileage).toLocaleString()} km`
              : 'Not calculated'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Current Mileage</p>
          <p className="text-gray-900 font-bold">
            {Math.round(currentMileage).toLocaleString()} km
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Mileage Until Service</p>
          <p className="text-gray-900 font-bold">
            {mileageUntil != null
              ? `${Math.max(0, Math.round(mileageUntil)).toLocaleString()} km`
              : 'N/A'}
          </p>
        </div>
      </div>
    </Card>
  );
};

// Modal showing full details for a specific day
const DayDetailsModal = ({ isOpen, day, onClose }) => {
  if (!isOpen || !day) return null;

  const hasRentals = day.rentals && day.rentals.length > 0;
  const hasServices = day.services && day.services.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Day Details</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(day.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-800">
            <span
              className={`w-2 h-2 rounded-full ${
                day.status === 'RENTED'
                  ? 'bg-blue-500'
                  : day.status === 'IN_SERVICE'
                  ? 'bg-red-500'
                  : 'bg-emerald-500'
              }`}
            />
            {day.status === 'RENTED'
              ? 'Rented'
              : day.status === 'IN_SERVICE'
              ? 'In Service / Maintenance'
              : 'Parked'}
          </div>

          {/* Rentals section */}
          {hasRentals && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                Rentals on this day
              </h3>
              {day.rentals.map((rental) => (
                <Card
                  key={rental.rental_id}
                  className="border-blue-100 bg-blue-50/60"
                  hover={false}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                          Customer
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {rental.customer.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">
                          ID: {rental.customer.idNumber || 'N/A'}
                        </p>
                        {rental.customer.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {rental.customer.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                          Rental Rate
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          KES {Math.round(rental.daily_rate || 0).toLocaleString()}
                          <span className="text-xs text-gray-500"> / day</span>
                        </p>
                        {rental.total_fee_gross && (
                          <p className="text-xs text-gray-600 mt-1">
                            Total: KES {Math.round(rental.total_fee_gross).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-700">Destination</p>
                          <p className="text-gray-600">
                            {rental.destination || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-700">Handed Out By</p>
                          <p className="text-gray-600">
                            {rental.driver?.name
                              ? `${rental.driver.name}${rental.driver.role ? ` (${rental.driver.role})` : ''}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-gray-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Checkout Date
                        </p>
                        <p className="text-gray-600">
                          {rental.start_date
                            ? new Date(rental.start_date).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expected Return
                        </p>
                        <p className="text-gray-600">
                          {rental.end_date
                            ? new Date(rental.end_date).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Actual Return
                        </p>
                        <p className="text-gray-600">
                          {rental.actual_end_date
                            ? new Date(rental.actual_end_date).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Not yet returned'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Services section */}
          {hasServices && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mt-4">
                <Wrench className="w-4 h-4 text-red-600" />
                Service / Maintenance
              </h3>
              {day.services.map((service, idx) => (
                <Card
                  key={idx}
                  className="border-red-100 bg-red-50/60"
                  hover={false}
                >
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-gray-800">
                      {service.service_type || 'Service'}
                    </p>
                    <p className="text-gray-600">{service.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      <div>
                        <p className="font-semibold text-gray-700">Service Provider</p>
                        <p className="text-gray-600">
                          {service.performed_by || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Cost</p>
                        <p className="text-gray-600">
                          {service.cost != null
                            ? `KES ${Math.round(service.cost).toLocaleString()}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Mileage at Service</p>
                        <p className="text-gray-600">
                          {service.odometer_reading != null
                            ? `${service.odometer_reading.toLocaleString()} km`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!hasRentals && !hasServices && (
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>No activity recorded for this day. Vehicle was parked.</span>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Monthly calendar component
const MonthlyCalendar = ({ year, month, days, onPrevMonth, onNextMonth, onDayClick }) => {
  const date = new Date(year, month, 1);
  const monthName = date.toLocaleString('en-US', { month: 'long' });
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayDataByNumber = {};
  (days || []).forEach((d) => {
    const dayNum = new Date(d.date).getDate();
    dayDataByNumber[dayNum] = d;
  });

  const weeks = [];
  let currentDay = 1;

  while (currentDay <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      if (weeks.length === 0 && i < firstDayOfWeek) {
        week.push(null);
      } else if (currentDay > daysInMonth) {
        week.push(null);
      } else {
        week.push({
          dayNumber: currentDay,
          data: dayDataByNumber[currentDay] || null
        });
        currentDay++;
      }
    }
    weeks.push(week);
  }

  return (
    <Card>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Monthly Calendar</p>
          <h3 className="text-xl font-bold text-gray-900">
            {monthName} {year}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm font-semibold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={onNextMonth}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm font-semibold flex items-center gap-1"
          >
            Next
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-gray-600">Parked</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600">Rented</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">In Service / Maintenance</span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-rows-6 gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((cell, idx) => {
              if (!cell) {
                return <div key={idx} className="h-20 rounded-lg bg-transparent" />;
              }

              const isToday =
                new Date().getFullYear() === year &&
                new Date().getMonth() === month &&
                new Date().getDate() === cell.dayNumber;

              const status = cell.data?.status || 'PARKED';
              const statusStyles = getDayStatusStyles(status);

              return (
                <button
                  key={idx}
                  onClick={() => cell.data && onDayClick && onDayClick(cell.data)}
                  className={`h-20 rounded-lg border text-left p-1.5 flex flex-col justify-between transition-all ${
                    cell.data ? statusStyles : 'border-gray-100 bg-gray-50 text-gray-500'
                  } ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{cell.dayNumber}</span>
                    {status === 'RENTED' && cell.data?.rentals?.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
                        {cell.data.rentals.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] leading-tight line-clamp-3">
                    {status === 'RENTED' && cell.data?.rentals?.length > 0 && (
                      <span>
                        Rented to{' '}
                        {cell.data.rentals[0].customer?.name || 'customer'}
                        {cell.data.rentals.length > 1
                          ? ` +${cell.data.rentals.length - 1} more`
                          : ''}
                      </span>
                    )}
                    {status === 'IN_SERVICE' && (
                      <span>In Service / Maintenance</span>
                    )}
                    {status === 'PARKED' && <span>Parked</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
};

const VehicleRecords = ({ vehicle: selectedVehicle, vehicles = [], rentals = [], onVehicleChange }) => {
  const [licensePlateSearch, setLicensePlateSearch] = useState('');
  const [vehicle, setVehicle] = useState(selectedVehicle);
  const [searchTerm, setSearchTerm] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarDays, setCalendarDays] = useState([]);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [mileageUpdating, setMileageUpdating] = useState(false);
  const [mileageInput, setMileageInput] = useState('');
  const [mileageError, setMileageError] = useState(null);

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

  // Fetch monthly records when vehicle or month/year changes
  useEffect(() => {
    const fetchMonthlyRecords = async () => {
      if (!vehicle) return;

      try {
        setCalendarLoading(true);
        setCalendarError(null);

        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_URL}/api/vehicles/${vehicle._id || vehicle.vehicle_id}/records?month=${calendarMonth + 1}&year=${calendarYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to load vehicle records');
        }

        setCalendarDays(data.days || []);
      } catch (err) {
        console.error('Error fetching vehicle monthly records:', err);
        setCalendarError(err.message || 'Failed to load vehicle records');
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchMonthlyRecords();
  }, [vehicle, calendarMonth, calendarYear]);

  // Handle mileage update
  const handleMileageUpdate = async (e) => {
    e.preventDefault();
    if (!vehicle) return;

    const value = Number(mileageInput);
    if (Number.isNaN(value) || value < 0) {
      setMileageError('Please enter a valid non-negative number');
      return;
    }

    try {
      setMileageUpdating(true);
      setMileageError(null);

      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/api/driver/vehicles/${vehicle._id || vehicle.vehicle_id}/mileage`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ currentMileage: value })
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update mileage');
      }

      // Update local vehicle object maintenance for UI
      if (!vehicle.maintenance) {
        vehicle.maintenance = {};
      }
      vehicle.maintenance = {
        ...vehicle.maintenance,
        ...data.maintenance
      };
      setMileageInput('');
    } catch (err) {
      console.error('Mileage update error:', err);
      setMileageError(err.message || 'Failed to update mileage');
    } finally {
      setMileageUpdating(false);
    }
  };

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

  // Calculate statistics from calendar data (month-specific)
  const rentedDays = calendarDays.filter(d => d.status === 'RENTED').length;
  const serviceDays = calendarDays.filter(d => d.status === 'IN_SERVICE').length;
  const parkedDays = calendarDays.filter(d => d.status === 'PARKED').length;
  
  // Count unique rentals in the current month from calendar data
  const uniqueRentalsThisMonth = new Set();
  calendarDays.forEach(day => {
    if (day.rentals && day.rentals.length > 0) {
      day.rentals.forEach(rental => {
        if (rental.rental_id) {
          uniqueRentalsThisMonth.add(rental.rental_id);
        }
      });
    }
  });
  const totalRentalsThisMonth = uniqueRentalsThisMonth.size;
  
  // Overall stats (all time)
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

      {/* Statistics - Month-Specific (matches calendar) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-indigo-600">{totalRentalsThisMonth}</p>
            <p className="text-sm text-gray-600">Rentals This Month</p>
            <p className="text-xs text-gray-400 mt-1">({totalRentals} all time)</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-600">{parkedDays}</p>
            <p className="text-sm text-gray-600">Days Parked</p>
            <p className="text-xs text-gray-400 mt-1">({Math.round(parkedDays / calendarDays.length * 100)}% of month)</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-600">{rentedDays}</p>
            <p className="text-sm text-gray-600">Days Rented</p>
            <p className="text-xs text-gray-400 mt-1">({Math.round(rentedDays / calendarDays.length * 100)}% of month)</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Wrench className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-600">{serviceDays}</p>
            <p className="text-sm text-gray-600">Days in Service</p>
            <p className="text-xs text-gray-400 mt-1">({Math.round(serviceDays / calendarDays.length * 100)}% of month)</p>
          </div>
        </Card>
      </div>

      {/* Vehicle Health / Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4 items-start">
        <VehicleHealth vehicle={vehicle} />
        {/* Quick mileage update form */}
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Update Current Mileage
          </p>
          <form onSubmit={handleMileageUpdate} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Enter current odometer (km)"
                value={mileageInput}
                onChange={(e) => setMileageInput(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
              />
              <Button
                type="submit"
                variant="primary"
                className="whitespace-nowrap"
                disabled={mileageUpdating}
              >
                {mileageUpdating ? 'Updating...' : 'Save'}
              </Button>
            </div>
            {mileageError && (
              <p className="text-xs text-red-600">{mileageError}</p>
            )}
            <p className="text-[11px] text-gray-500">
              Keep mileage updated to get accurate service reminders.
            </p>
          </form>
        </Card>
      </div>

      {/* Monthly Calendar View */}
      {calendarError && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{calendarError}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Trigger refetch by bumping month (hacky but simple)
                setCalendarMonth((prev) => prev);
              }}
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {calendarLoading ? (
        <Card>
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-semibold">
              Loading calendar for this vehicle...
            </p>
          </div>
        </Card>
      ) : (
        <MonthlyCalendar
          year={calendarYear}
          month={calendarMonth}
          days={calendarDays}
          onPrevMonth={() => {
            setCalendarMonth((prev) => {
              if (prev === 0) {
                setCalendarYear((y) => y - 1);
                return 11;
              }
              return prev - 1;
            });
          }}
          onNextMonth={() => {
            setCalendarMonth((prev) => {
              if (prev === 11) {
                setCalendarYear((y) => y + 1);
                return 0;
              }
              return prev + 1;
            });
          }}
          onDayClick={(day) => {
            setSelectedDay(day);
            setDayModalOpen(true);
          }}
        />
      )}

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={dayModalOpen}
        day={selectedDay}
        onClose={() => {
          setDayModalOpen(false);
          setSelectedDay(null);
        }}
      />
    </div>
  );
};

export default VehicleRecords;

