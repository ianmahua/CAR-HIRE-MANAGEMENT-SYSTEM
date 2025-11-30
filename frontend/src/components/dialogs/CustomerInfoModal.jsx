import React from 'react';
import Modal from '../base/Modal';
import { User, Phone, Mail, Calendar, Car, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../base/Card';

const CustomerInfoModal = ({ isOpen, onClose, customer, rentals = [] }) => {
  if (!customer) return null;

  const customerRentals = rentals.filter(r => 
    r.customer_ref?._id === customer._id || 
    r.customer_ref === customer._id ||
    r.customer_id === customer.customer_id ||
    r.customer_ref?.phone === customer.phone ||
    r.customer_ref?.phone_msisdn === customer.phone_msisdn
  ).sort((a, b) => {
    // Sort by start date, most recent first
    const dateA = new Date(a.start_date || 0);
    const dateB = new Date(b.start_date || 0);
    return dateB - dateA;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile" size="lg">
      <div className="space-y-6">
        {/* Customer Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl font-bold backdrop-blur-sm">
              {customer.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{customer.name || 'Unknown'}</h3>
              <p className="text-indigo-100">
                {customer.is_returning_client ? 'Returning Client' : 'New Client'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <Card>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold">{customer.phone || customer.phone_msisdn || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{customer.email || 'N/A'}</p>
              </div>
            </div>
            {customer.ID_number && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">ID Number</p>
                  <p className="font-semibold">{customer.ID_number}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-indigo-600">{customerRentals.length}</p>
              <p className="text-sm text-gray-600">Total Rentals</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-600">
                {customerRentals.filter(r => r.rental_status === 'Completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-amber-600">
                {customerRentals.filter(r => r.rental_status === 'Active').length}
              </p>
              <p className="text-sm text-gray-600">Active Now</p>
            </div>
          </Card>
        </div>

        {/* Complete Rental History */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-2xl font-bold text-gray-900">Complete Rental History</h4>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              {customerRentals.length} {customerRentals.length === 1 ? 'Rental' : 'Rentals'}
            </span>
          </div>
          <div className="space-y-4">
            {customerRentals.length > 0 ? (
              customerRentals.map((rental, idx) => {
                const startDate = rental.start_date ? new Date(rental.start_date) : null;
                const endDate = rental.end_date ? new Date(rental.end_date) : null;
                const actualReturnDate = rental.actual_return_date ? new Date(rental.actual_return_date) : null;
                const duration = startDate && endDate 
                  ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div
                    key={rental._id || rental.rental_id || idx}
                    className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl">
                          <Car className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-gray-900 mb-1">
                            {rental.vehicle_ref?.license_plate || 'N/A'}
                          </h5>
                          {rental.vehicle_ref?.make && rental.vehicle_ref?.model && (
                            <p className="text-sm text-gray-600">
                              {rental.vehicle_ref.make} {rental.vehicle_ref.model} • {rental.vehicle_ref.year || ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
                        rental.rental_status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : rental.rental_status === 'Active'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {rental.rental_status || 'Active'}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* When Hired */}
                      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <p className="text-xs text-gray-600 uppercase font-bold">Hired Out</p>
                        </div>
                        {startDate ? (
                          <div>
                            <p className="text-base font-bold text-gray-900">
                              {startDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {startDate.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Not specified</p>
                        )}
                      </div>

                      {/* Return Date */}
                      <div className={`rounded-xl p-4 border-2 ${
                        rental.rental_status === 'Active' && endDate && endDate < new Date()
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className={`w-4 h-4 ${
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
                            <p className="text-base font-bold text-gray-900">
                              {(actualReturnDate || endDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            {(actualReturnDate || endDate) && (
                              <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {(actualReturnDate || endDate).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Not specified</p>
                        )}
                      </div>

                      {/* Duration */}
                      {duration !== null && (
                        <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <p className="text-xs text-gray-600 uppercase font-bold">Duration</p>
                          </div>
                          <p className="text-base font-bold text-indigo-600">
                            {duration} {duration === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                      )}

                      {/* Destination */}
                      <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <p className="text-xs text-gray-600 uppercase font-bold">Destination</p>
                        </div>
                        <p className="text-base font-bold text-gray-900">
                          {rental.destination || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rental.hire_type && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Hire Type</p>
                          <p className="text-sm font-semibold text-gray-900">{rental.hire_type}</p>
                        </div>
                      )}
                      {rental.dispatched_by && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Dispatched By</p>
                          <p className="text-sm font-semibold text-gray-900">{rental.dispatched_by}</p>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {rental.notes && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Notes</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{rental.notes}</p>
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
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No rental history found</p>
                <p className="text-gray-400 text-sm mt-2">This customer hasn't rented any vehicles yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default CustomerInfoModal;

