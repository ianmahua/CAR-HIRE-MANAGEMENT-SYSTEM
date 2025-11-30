import React, { useState } from 'react';
import { Users, Search, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';

const Customers = ({ customers, onCustomerClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.ID_number?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h2>
        <p className="text-gray-600">View all customers and their rental history</p>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer, idx) => (
          <Card
            key={customer._id || customer.customer_id || idx}
            onClick={() => onCustomerClick(customer)}
            className="group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {customer.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{customer.name || 'Unknown'}</h3>
                <p className="text-sm text-gray-600">
                  {customer.is_returning_client ? 'Returning Client' : 'New Client'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{customer.phone || customer.phone_msisdn || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{customer.email || 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Total Rentals</p>
                <p className="text-2xl font-bold text-indigo-600">{customer.total_bookings || customer.hire_history?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Lifetime Value</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {customer.total_bookings || 0} rentals
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full">
              View Profile
            </Button>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No customers found</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Customers;

