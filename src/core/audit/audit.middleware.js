import { prisma } from '../../lib/prisma.js';

export const auditLogger = (action, entityType) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;
      const response = res.send(body);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.resolve().then(async () => {
          try {
            let entityId = req.params.id;
            if (!entityId && body) {
              try {
                const parsedBody = JSON.parse(body);
                entityId = parsedBody.data?.id || parsedBody.data?._id || parsedBody.id || parsedBody._id;
              } catch (e) {
                // Ignore parse errors
              }
            }

            await prisma.auditLog.create({
              data: {
                action,
                entityType,
                entityId: entityId || null,
                actorId: req.userId || null,
                changes: req.body || {},
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
              },
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
