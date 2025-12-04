import React, { useState } from 'react';
import { 
  Calendar, Car, MapPin, Clock, DollarSign, User, 
  ChevronDown, ChevronUp, Download, AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';
import Card from '../base/Card';
import Button from '../base/Button';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RentalScenarioCard = ({ rental }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  if (!rental) return null;

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/driver/rental/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rentalId: rental._id || rental.rental_id })
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
      const customerName = rental.customer_ref?.name?.replace(/\s+/g, '_') || 'Customer';
      const vehiclePlate = rental.vehicle_ref?.license_plate?.replace(/\s+/g, '_') || 'Vehicle';
      const date = new Date().toISOString().split('T')[0];
      link.download = `${customerName}_${vehiclePlate}_Rental_${date}.pdf`;
      
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

  const startDate = new Date(rental.start_date);
  const endDate = new Date(rental.end_date);
  const actualStartDate = rental.actual_start_date ? new Date(rental.actual_start_date) : null;
  const actualEndDate = rental.actual_end_date ? new Date(rental.actual_end_date) : null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const totalAmount = rental.total_fee_gross || 0;
  const additionalCharges = 
    (rental.additional_fees?.extra_mileage || 0) +
    (rental.additional_fees?.late_return_penalty || 0) +
    (rental.additional_fees?.damage_charges || 0) +
    (rental.additional_fees?.fuel_charges || 0);

  const totalPaid = rental.payment_history?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-brand-orange/10 rounded-2xl">
              <Car className="w-6 h-6 text-brand-orange" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {rental.vehicle_ref?.license_plate || 'N/A'}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusBadge(rental.rental_status)}`}>
                  {getStatusIcon(rental.rental_status)}
                  {rental.rental_status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {rental.vehicle_ref?.make} {rental.vehicle_ref?.model} {rental.vehicle_ref?.year ? `(${rental.vehicle_ref.year})` : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <strong>Customer:</strong> {rental.customer_ref?.name || 'N/A'} • {rental.customer_ref?.phone || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Start Date</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-brand-orange" />
              {startDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">End Date</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-brand-orange" />
              {endDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Duration</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {rental.duration_days} day{rental.duration_days !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Destination</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-brand-orange" />
              {rental.destination || 'N/A'}
            </p>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-orange" />
              <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              KES {(totalAmount + additionalCharges).toLocaleString()}
            </span>
          </div>
          {additionalCharges > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              (Base: KES {totalAmount.toLocaleString()} + Additional: KES {additionalCharges.toLocaleString()})
            </p>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Full Details
            </>
          )}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-4 border-t border-gray-200 space-y-6">
            {/* Vehicle Details */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-brand-orange" />
                Vehicle Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">License Plate:</span>
                  <p className="font-semibold text-gray-900">{rental.vehicle_ref?.license_plate || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-semibold text-gray-900">{rental.vehicle_ref?.category || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Make & Model:</span>
                  <p className="font-semibold text-gray-900">
                    {rental.vehicle_ref?.make} {rental.vehicle_ref?.model}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Year:</span>
                  <p className="font-semibold text-gray-900">{rental.vehicle_ref?.year || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Rental Timeline */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-orange" />
                Rental Timeline
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Scheduled Start:</span>
                  <p className="font-semibold text-gray-900">{startDate.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Scheduled End:</span>
                  <p className="font-semibold text-gray-900">{endDate.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Actual Check-out:</span>
                  <p className="font-semibold text-gray-900">
                    {actualStartDate ? actualStartDate.toLocaleString() : 'Not recorded'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Actual Return:</span>
                  <p className="font-semibold text-gray-900">
                    {actualEndDate ? actualEndDate.toLocaleString() : rental.rental_status === 'Active' ? 'Still active' : 'Not recorded'}
                  </p>
                </div>
              </div>
            </div>

            {/* Driver & Hire Type */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-orange" />
                Assignment Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Driver Assigned:</span>
                  <p className="font-semibold text-gray-900">
                    {rental.driver_assigned?.name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Hire Type:</span>
                  <p className="font-semibold text-gray-900">{rental.hire_type || 'Direct Client'}</p>
                </div>
                {rental.broker_ref && (
                  <>
                    <div>
                      <span className="text-gray-500">Broker:</span>
                      <p className="font-semibold text-gray-900">{rental.broker_ref.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Commission:</span>
                      <p className="font-semibold text-gray-900">
                        {rental.broker_commission_rate}% (KES {(rental.broker_commission_amount || 0).toLocaleString()})
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-orange" />
                Financial Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Rate:</span>
                  <span className="font-semibold text-gray-900">
                    KES {(rental.vehicle_ref?.daily_rate || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">{rental.duration_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-semibold text-gray-900">KES {totalAmount.toLocaleString()}</span>
                </div>
                
                {/* Additional Charges */}
                {additionalCharges > 0 && (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Additional Charges:</p>
                      {rental.additional_fees?.extra_mileage > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Extra Mileage:</span>
                          <span className="font-semibold text-gray-900">
                            KES {rental.additional_fees.extra_mileage.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {rental.additional_fees?.late_return_penalty > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Late Return Penalty:</span>
                          <span className="font-semibold text-gray-900">
                            KES {rental.additional_fees.late_return_penalty.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {rental.additional_fees?.damage_charges > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Damage Charges:</span>
                          <span className="font-semibold text-gray-900">
                            KES {rental.additional_fees.damage_charges.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {rental.additional_fees?.fuel_charges > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Fuel Charges:</span>
                          <span className="font-semibold text-gray-900">
                            KES {rental.additional_fees.fuel_charges.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-gray-900">
                    KES {(totalAmount + additionalCharges).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-emerald-700">Total Paid:</span>
                  <span className="font-bold text-emerald-700">KES {totalPaid.toLocaleString()}</span>
                </div>
                {totalPaid < (totalAmount + additionalCharges) && (
                  <div className="flex justify-between">
                    <span className="font-bold text-rose-700">Balance Due:</span>
                    <span className="font-bold text-rose-700">
                      KES {((totalAmount + additionalCharges) - totalPaid).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            {rental.payment_history && rental.payment_history.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-brand-orange" />
                  Payment History
                </h4>
                <div className="space-y-2">
                  {rental.payment_history.map((payment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{payment.transaction_type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.transaction_date).toLocaleString()} • {payment.payment_method || 'N/A'}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <span className="font-bold text-emerald-700">
                        KES {(payment.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Rental PDF */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleExportPDF}
                disabled={exportingPDF}
              >
                {exportingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Rental PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export This Rental as PDF
                  </>
                )}
              </Button>
            </div>

            {/* Contract Download */}
            {rental.contract_ref && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    // TODO: Implement contract download
                    window.open(`/api/contracts/${rental.contract_ref}/download`, '_blank');
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download Contract (PDF)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RentalScenarioCard;
