import { ROLES } from './constants';

export const PERMISSIONS = {
  canCreateAppointment: [ROLES.STUDENT, ROLES.SECRETARY, ROLES.ADMIN],
  canApproveAsSecretary: [ROLES.SECRETARY, ROLES.ADMIN],
  canApproveAsLeader: [ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT, ROLES.ADMIN],
  canViewAllAppointments: [ROLES.ADMIN, ROLES.SECRETARY],
  canManageUsers: [ROLES.ADMIN],
  canViewSecretaryDashboard: [ROLES.SECRETARY, ROLES.ADMIN],
  canViewLeaderDashboard: [ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT],
};

export const hasPermission = (userRole, permissionKey) => {
  const allowed = PERMISSIONS[permissionKey] || [];
  return allowed.includes(userRole);
};

export const isLeader = (role) =>
  [ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT].includes(role);

export const isStaff = (role) =>
  [ROLES.SECRETARY, ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT, ROLES.ADMIN].includes(role);

export const getDashboardType = (role) => {
  if (role === ROLES.SECRETARY) return 'secretary';
  if (isLeader(role)) return 'leader';
  if (role === ROLES.ADMIN) return 'admin';
  return 'student';
};
