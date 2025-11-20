const axios = require('axios');
const Vehicle = require('../models/Vehicle');

class TelematicsService {
  constructor() {
    this.apiKey = process.env.TELEMATICS_API_KEY;
    this.apiUrl = process.env.TELEMATICS_API_URL;
  }

  // Get real-time vehicle location
  async getVehicleLocation(vehicleId) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || !vehicle.gps_device_id) {
        throw new Error('Vehicle or GPS device not found');
      }

      const response = await axios.get(
        `${this.apiUrl}/vehicles/${vehicle.gps_device_id}/location`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        vehicle_id: vehicle.vehicle_id,
        license_plate: vehicle.license_plate,
        location: {
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          timestamp: response.data.timestamp,
          speed: response.data.speed,
          heading: response.data.heading
        }
      };
    } catch (error) {
      console.error('Error getting vehicle location:', error.response?.data || error.message);
      throw new Error('Failed to get vehicle location');
    }
  }

  // Check if vehicle is within geo-fence
  async checkGeoFence(vehicleId, allowedArea) {
    try {
      const location = await this.getVehicleLocation(vehicleId);
      
      // Simple distance calculation (Haversine formula can be used for more accuracy)
      const distance = this.calculateDistance(
        location.location.latitude,
        location.location.longitude,
        allowedArea.centerLat,
        allowedArea.centerLng
      );

      const isWithinFence = distance <= allowedArea.radius;

      if (!isWithinFence) {
        // Trigger alert
        await this.sendGeoFenceAlert(vehicleId, location, allowedArea);
      }

      return {
        is_within_fence: isWithinFence,
        distance: distance,
        location: location.location
      };
    } catch (error) {
      console.error('Error checking geo-fence:', error);
      throw error;
    }
  }

  // Calculate distance between two coordinates (in km)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Send geo-fence alert
  async sendGeoFenceAlert(vehicleId, location, allowedArea) {
    // This would typically send a notification to Admin
    console.warn(`ALERT: Vehicle ${vehicleId} is outside allowed area!`);
    console.warn(`Location: ${location.location.latitude}, ${location.location.longitude}`);
    console.warn(`Allowed area: ${allowedArea.centerLat}, ${allowedArea.centerLng} (radius: ${allowedArea.radius}km)`);
    
    // In production, this would send an email/SMS/notification to Admin
    return {
      alert_sent: true,
      vehicle_id: vehicleId,
      violation_type: 'geo_fence_breach'
    };
  }

  // Get vehicle diagnostic data
  async getVehicleDiagnostics(vehicleId) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || !vehicle.gps_device_id) {
        throw new Error('Vehicle or GPS device not found');
      }

      const response = await axios.get(
        `${this.apiUrl}/vehicles/${vehicle.gps_device_id}/diagnostics`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Check for maintenance alerts
      const diagnostics = response.data;
      if (diagnostics.maintenance_required) {
        await this.triggerMaintenanceAlert(vehicleId, diagnostics);
      }

      return diagnostics;
    } catch (error) {
      console.error('Error getting vehicle diagnostics:', error.response?.data || error.message);
      throw new Error('Failed to get vehicle diagnostics');
    }
  }

  // Trigger maintenance alert
  async triggerMaintenanceAlert(vehicleId, diagnostics) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return;

    // Add to service log
    vehicle.service_log.push({
      date: new Date(),
      cost: 0, // Will be updated when service is performed
      description: `Maintenance alert: ${diagnostics.alert_message || 'Service required'}`,
      performed_by: 'Telematics System',
      service_type: 'Inspection',
      odometer_reading: diagnostics.odometer_reading
    });

    await vehicle.save();

    return {
      alert_created: true,
      vehicle_id: vehicleId
    };
  }
}

module.exports = new TelematicsService();

