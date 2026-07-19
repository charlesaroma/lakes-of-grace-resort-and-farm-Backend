import { AuditLog } from './auditLog.model.js';

/**
 * Middleware factory to log actions.
 * @param {string} action - Description of the action (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} entityType - The type of entity being affected
 */
export const auditLogger = (action, entityType) => {
  return async (req, res, next) => {
    // Intercept the response to log after successful completion
    const originalSend = res.send;
    
    res.send = function (body) {
      res.send = originalSend;
      const response = res.send(body);

      // Only log on successful mutations (POST, PUT, PATCH, DELETE)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Run asynchronously so it doesn't block the response
        Promise.resolve().then(async () => {
          try {
            // Try to extract entityId from params or response body if available
            let entityId = req.params.id;
            if (!entityId && body) {
              try {
                const parsedBody = JSON.parse(body);
                entityId = parsedBody.data?.id || parsedBody.data?._id || parsedBody.id || parsedBody._id;
              } catch (e) {
                // Ignore parse errors
              }
            }

            await AuditLog.create({
              action,
              entityType,
              entityId: entityId || null,
              actorId: req.user?._id || null,
              changes: req.body || {},
              ipAddress: req.ip,
              userAgent: req.get('user-agent')
            });
          } catch (error) {
            console.error('Failed to write audit log:', error);
          }
        });
      }

      return response;
    };

    next();
  };
};
