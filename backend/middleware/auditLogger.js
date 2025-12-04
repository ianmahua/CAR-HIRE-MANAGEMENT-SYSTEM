const AuditLog = require('../models/AuditLog');

// Middleware to log all actions
const auditLogger = (action, entityType) => {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json;

    // Override json function to capture response
    res.json = function(data) {
      // Log the action after response is sent
      if (req.user && res.statusCode < 400) {
        const entityId = req.params.id || req.body?.id || req.body?.rental_id || req.body?.vehicle_id || 'N/A';
        
        AuditLog.create({
          action: action,
          entity_type: entityType,
          entity_id: entityId,
          user_id: req.user._id,
          user_role: req.user.role,
          user_name: req.user.name,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('user-agent'),
          changes: req.body ? new Map(Object.entries(req.body)) : undefined,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode
          }
        }).catch(err => {
          console.error('Error creating audit log:', err);
        });
      }

      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = auditLogger;












