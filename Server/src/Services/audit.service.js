const { AuditLog } = require("../models/AuditLog");

async function writeAudit({ userId, action, resourceType, resourceId, req, meta }) {
  await AuditLog.create({
    userId: userId || null,
    action,
    resourceType: resourceType || "",
    resourceId: resourceId || "",
    ip: req?.ip || "",
    userAgent: req?.headers?.["user-agent"] || "",
    meta: meta || {}
  });
}

module.exports = { writeAudit };
