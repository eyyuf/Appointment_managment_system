const { forbidden } = require('../utils/responseHandler');

/**
 * Role-based access control middleware factory
 * @param {...string} allowedRoles - Roles permitted to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

/**
 * Check if user is accessing their own resource OR has elevated role
 */
const authorizeOwnerOrAdmin = (paramIdField = 'id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramIdField];
    const currentUserId = req.user.id;
    const adminRoles = ['ADMIN', 'SECRETARY', 'DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'];

    if (resourceUserId === currentUserId || adminRoles.includes(req.user.role)) {
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

const ALL_ROLES = Object.values(ROLES);
const STAFF_ROLES = [ROLES.SECRETARY, ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT, ROLES.ADMIN];
const LEADERSHIP_ROLES = [ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT];

module.exports = { authorize, authorizeOwnerOrAdmin, ROLES, ALL_ROLES, STAFF_ROLES, LEADERSHIP_ROLES };
