import Permission from "../models/Permission.js";

/**
 * @param {string} fileId
 * @param {string} userId
 * @param {"read"|"write"|"admin"} requiredRole
 * @returns {Promise<boolean>}
 */
export async function hasPermission(fileId, userId, requiredRole) {
  const roles = ["read", "write", "admin"];
  const requiredIndex = roles.indexOf(requiredRole);

  const perm = await Permission.findOne({
    fileId,
    grantedTo: userId,
    revokedAt: null,
    riskOverride: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ],
  });

  if (!perm) return false;

  return roles.indexOf(perm.role) >= requiredIndex;
}
