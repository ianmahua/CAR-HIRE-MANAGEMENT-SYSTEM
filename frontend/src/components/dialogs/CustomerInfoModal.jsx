import React from 'react';
import Modal from '../base/Modal';
import { User, Phone, Mail, Calendar, DollarSign, Car } from 'lucide-react';
import Card from '../base/Card';

const CustomerInfoModal = ({ isOpen, onClose, customer, rentals = [] }) => {
  if (!customer) return null;

  const customerRentals = rentals.filter(r => 
    r.customer_ref?._id === customer._id || 
    r.customer_ref === customer._id ||
    r.customer_id === customer.customer_id
  );

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
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <div className="text-center">
              <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-indigo-600">{customerRentals.length}</p>
              <p className="text-sm text-gray-600">Total Rentals</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-600">
                KES {(customer.total_spent || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Lifetime Value</p>
            </div>
          </Card>
        </div>

        {/* Rental History */}
        <Card>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Rental History</h4>
          <div className="space-y-3">
            {customerRentals.length > 0 ? (
              customerRentals.map((rental, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold">
                        {rental.vehicle_ref?.license_plate || 'N/A'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rental.rental_status === 'Completed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rental.rental_status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <p>Start: {rental.start_date ? new Date(rental.start_date).toLocaleDateString() : 'N/A'}</p>
                    <p>End: {rental.end_date ? new Date(rental.end_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 mt-2">
                    Revenue: KES {(rental.total_fee_gross || rental.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No rental history</p>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default CustomerInfoModal;

