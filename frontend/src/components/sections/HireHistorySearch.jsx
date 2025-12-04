import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Calendar, Car, AlertCircle, X, Download } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';
import RentalScenarioCard from './RentalScenarioCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HireHistorySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('idNumber');
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [vehicles, setVehicles] = useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch vehicles for filter dropdown
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/driver/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setVehicles(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      }
    };

    if (token) {
      fetchVehicles();
    }
  }, [token]);

  // Debounced search function
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() && !statusFilter && !vehicleFilter && !dateFromFilter && !dateToFilter) {
      setError('Please enter a search query or apply filters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
        params.append('searchType', searchType);
      }
      if (statusFilter) params.append('status', statusFilter);
      if (vehicleFilter) params.append('vehicle', vehicleFilter);
      if (dateFromFilter) params.append('dateFrom', dateFromFilter);
      if (dateToFilter) params.append('dateTo', dateToFilter);

      const res = await fetch(
        `${API_URL}/api/driver/hire-history/search?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: Invalid response format. Please ensure the backend server is running.');
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to search hire history');
      }

      setRentals(data.data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search hire history');
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchType, statusFilter, vehicleFilter, dateFromFilter, dateToFilter, token]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const clearFilters = () => {
    setStatusFilter('');
    setVehicleFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const clearAll = () => {
    setSearchQuery('');
    setSearchType('idNumber');
    clearFilters();
    setRentals([]);
    setSearched(false);
    setError(null);
  };

  const handleExportPDF = async () => {
    if (rentals.length === 0) {
      alert('No rentals to export');
      return;
    }

    try {
      setExportingPDF(true);

      // Extract customer info from first rental
      const customer = rentals[0]?.customer_ref || {
        name: 'Unknown Customer',
        ID_number: 'N/A',
        phone: 'N/A',
        email: 'N/A'
      };

      const response = await fetch(`${API_URL}/api/driver/hire-history/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ customer, rentals })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const customerName = customer.name?.replace(/\s+/g, '_') || 'Customer';
      const date = new Date().toISOString().split('T')[0];
      link.download = `${customerName}_RentalHistory_${date}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Export PDF error:', err);
      alert(err.message || 'Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Hire History Search</h2>
        <p className="text-gray-600">Search customer rental history by ID, phone, or name</p>
      </div>

      {/* Search Form */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Search Customer Rental History</h3>
          </div>
          
          {/* Search Type Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSearchType('idNumber')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                searchType === 'idNumber'
                  ? 'bg-brand-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ID Number
            </button>
            <button
              type="button"
              onClick={() => setSearchType('phone')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                searchType === 'phone'
                  ? 'bg-brand-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Phone Number
            </button>
            <button
              type="button"
              onClick={() => setSearchType('name')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                searchType === 'name'
                  ? 'bg-brand-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Customer Name
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search by ${searchType === 'idNumber' ? 'ID Number' : searchType === 'phone' ? 'Phone Number' : 'Customer Name'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            {(statusFilter || vehicleFilter || dateFromFilter || dateToFilter) && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2 text-rose-600 border-rose-300 hover:bg-rose-50"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Vehicle Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Vehicle
                  </label>
                  <select
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                  >
                    <option value="">All Vehicles</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id || vehicle.vehicle_id} value={vehicle._id || vehicle.vehicle_id}>
                        {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Date To Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <div className="flex gap-3">
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
            {(searchQuery || statusFilter || vehicleFilter || dateFromFilter || dateToFilter || searched) && (
              <Button type="button" variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-2 border-rose-200 bg-rose-50">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-semibold">Searching hire history...</p>
          </div>
        </Card>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          {rentals.length > 0 ? (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Found {rentals.length} rental{rentals.length !== 1 ? 's' : ''}
                </h3>
                <Button
                  variant="primary"
                  onClick={handleExportPDF}
                  disabled={exportingPDF || rentals.length === 0}
                  className="flex items-center gap-2"
                >
                  {exportingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </>
                  )}
                </Button>
              </div>

              {/* Rental Cards */}
              <div className="space-y-4">
                {rentals.map((rental) => (
                  <RentalScenarioCard key={rental._id || rental.rental_id} rental={rental} />
                ))}
              </div>
            </>
          ) : (
            /* Empty State */
            <Card>
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No rentals found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? `No rental history found for "${searchQuery}"`
                    : 'No rentals match your filter criteria'}
                </p>
                <p className="text-sm text-gray-400">
                  Try adjusting your search query or filters
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <Card>
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Search Customer Hire History</h3>
            <p className="text-gray-500 mb-4">
              Enter a customer's ID number, phone number, or name to view their rental history
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Filter by date range</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span>Filter by vehicle</span>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filter by status</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HireHistorySearch;

