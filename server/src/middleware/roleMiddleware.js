const { forbidden } = require('../utils/responseHandler');

const toRoleSet = (roles) => {
  return new Set(
    roles
      .flat()
      .filter(Boolean)
      .map((role) => String(role).trim())
      .filter((role) => role.length > 0)
  );
};

/**
 * Role-based access control middleware factory.
 * Accepts one or many roles, and supports arrays for flexibility.
 */
const authorize = (...allowedRoles) => {
  const allowedRoleSet = toRoleSet(allowedRoles);

  return (req, res, next) => {
    const currentUserRole = req?.user?.role;
    if (!currentUserRole) {
      return forbidden(res, 'Not authenticated');
    }

    if (allowedRoleSet.size === 0) {
      return forbidden(res, 'Access denied. No roles configured for this route.');
    }

    if (!allowedRoleSet.has(currentUserRole)) {
      return forbidden(res, `Access denied. Required roles: ${Array.from(allowedRoleSet).join(', ')}`);
    }

    return next();
  };
};

/**
 * Allows access when the authenticated user owns the target resource
 * or has one of the staff roles.
 */
const authorizeOwnerOrAdmin = (paramIdField = 'id') => {
  return (req, res, next) => {
    const resourceUserId = req?.params?.[paramIdField];
    const currentUserId = req?.user?.id;
    const currentRole = req?.user?.role;

    if (!currentUserId || !currentRole) {
      return forbidden(res, 'Not authenticated');
    }

    if (!resourceUserId) {
      return forbidden(res, `Missing route parameter: ${paramIdField}`);
    }

    if (String(resourceUserId) === String(currentUserId) || STAFF_ROLES.includes(currentRole)) {
      return next();
    }

    return forbidden(res, 'You can only access your own resources');
  };
};

// Role constants for convenience
const ROLES = {
  STUDENT: 'STUDENT',
  SECRETARY: 'SECRETARY',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  DEAN: 'DEAN',
  VICE_PRESIDENT: 'VICE_PRESIDENT',
  PRESIDENT: 'PRESIDENT',
  ADMIN: 'ADMIN',
};

Object.freeze(ROLES);

const ALL_ROLES = Object.freeze(Object.values(ROLES));
const STAFF_ROLES = Object.freeze([
  ROLES.SECRETARY,
  ROLES.DEPARTMENT_HEAD,
  ROLES.DEAN,
  ROLES.VICE_PRESIDENT,
  ROLES.PRESIDENT,
  ROLES.ADMIN,
]);
const LEADERSHIP_ROLES = Object.freeze([
  ROLES.DEPARTMENT_HEAD,
  ROLES.DEAN,
  ROLES.VICE_PRESIDENT,
  ROLES.PRESIDENT,
]);

module.exports = { authorize, authorizeOwnerOrAdmin, ROLES, ALL_ROLES, STAFF_ROLES, LEADERSHIP_ROLES };
