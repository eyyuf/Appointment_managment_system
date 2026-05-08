const prisma = require('../config/db');
const { timesOverlap, generateAvailableSlots } = require('../utils/dateUtils');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

/**
 * ══════════════════════════════════════════════════════════
 *  HIERARCHICAL APPOINTMENT WORKFLOW
 *  Student → Secretary (MANDATORY) → Leader → Notifications
 * ══════════════════════════════════════════════════════════
 */

/**
 * Check scheduling conflicts for a leader on a given date
 */
const checkConflict = async (leaderId, date, startTime, endTime, excludeId = null) => {
  const where = {
    leaderId,
    date: new Date(date),
    status: { in: ['FORWARDED', 'APPROVED'] },
  };
  if (excludeId) where.id = { not: excludeId };
  const existing = await prisma.appointment.findMany({ where });
  return existing.find((a) => timesOverlap(startTime, endTime, a.startTime, a.endTime));
};

/**
 * STEP 1 — Student creates appointment request
 * - Selects: department, title, reason, preferred date/time
 * - NO direct leader selection allowed
 * - Status: PENDING → goes to Secretary inbox
 */
const createAppointment = async (requesterId, data) => {
  const { targetDepartment, title, description, reason, date, startTime, endTime, location } = data;

  if (!targetDepartment) throw Object.assign(new Error('Target department is required'), { statusCode: 400 });
  if (!reason) throw Object.assign(new Error('Reason for appointment is required'), { statusCode: 400 });

  // Block ADMIN from creating appointments
  const requester = await prisma.user.findUnique({ where: { id: requesterId } });
  if (requester.role === 'ADMIN') {
    throw Object.assign(new Error('Administrators cannot create appointment requests'), { statusCode: 403 });
  }

  // Find the secretary for this department
  const secretary = await prisma.user.findFirst({
    where: { role: 'SECRETARY', department: targetDepartment, isActive: true },
  });

  const appointment = await prisma.appointment.create({
    data: {
      requesterId,
      secretaryId: secretary?.id,
      leaderId: null, // Not assigned yet — Secretary will assign
      targetDepartment,
      title,
      description,
      reason,
      date: new Date(date),
      startTime,
      endTime,
      location,
      status: 'PENDING',
    },
    include: {
      requester: { select: { id: true, fullName: true, email: true, role: true } },
      secretary: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Notify secretary
  if (secretary) {
    await notificationService.createNotification({
      userId: secretary.id,
      title: 'New Appointment Request',
      message: `${appointment.requester.fullName} submitted a request for ${targetDepartment} on ${date}`,
      type: 'APPOINTMENT_CREATED',
      data: { appointmentId: appointment.id },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: requesterId,
      action: 'APPOINTMENT_CREATED',
      entity: 'Appointment',
      entityId: appointment.id,
      appointmentId: appointment.id,
      details: { department: targetDepartment, date, title },
    },
  });

  logger.info(`Appointment created by ${requesterId}: ${appointment.id}`);
  return appointment;
};

/**
 * STEP 2A — Secretary marks as UNDER_REVIEW
 */
const secretaryMarkUnderReview = async (id, secretaryId) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  // Any active secretary can pick up unassigned requests in their department
  const secretary = await prisma.user.findUnique({ where: { id: secretaryId } });
  if (secretary.role !== 'SECRETARY') throw Object.assign(new Error('Only secretaries can review'), { statusCode: 403 });
  if (appointment.status !== 'PENDING') throw Object.assign(new Error('Appointment is not pending'), { statusCode: 400 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'UNDER_REVIEW', secretaryId },
  });

  await notificationService.createNotification({
    userId: appointment.requesterId,
    title: 'Request Under Review',
    message: 'Your appointment request is now being reviewed by the secretary',
    type: 'GENERAL',
    data: { appointmentId: id },
  });

  await prisma.auditLog.create({
    data: { userId: secretaryId, action: 'MARKED_UNDER_REVIEW', entity: 'Appointment', entityId: id, appointmentId: id },
  });

  return updated;
};

/**
 * STEP 2B — Secretary forwards to a specific leader
 * - Secretary selects the appropriate leader
 * - Status: FORWARDED
 */
const secretaryForward = async (id, secretaryId, { leaderId, note, newDate, newStartTime, newEndTime }) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  const secretary = await prisma.user.findUnique({ where: { id: secretaryId } });
  if (secretary.role !== 'SECRETARY') throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  if (!['PENDING', 'UNDER_REVIEW'].includes(appointment.status)) {
    throw Object.assign(new Error('Cannot forward in current status'), { statusCode: 400 });
  }

  // Validate leader exists and has leadership role
  const leader = await prisma.user.findUnique({ where: { id: leaderId } });
  if (!leader) throw Object.assign(new Error('Leader not found'), { statusCode: 404 });
  const leadershipRoles = ['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'];
  if (!leadershipRoles.includes(leader.role)) {
    throw Object.assign(new Error('Target user is not a leader'), { statusCode: 400 });
  }

  // Use updated date/time if secretary is adjusting schedule
  const finalDate = newDate || appointment.date;
  const finalStartTime = newStartTime || appointment.startTime;
  const finalEndTime = newEndTime || appointment.endTime;

  // Check conflict for leader
  const conflict = await checkConflict(leaderId, finalDate, finalStartTime, finalEndTime);
  if (conflict) throw Object.assign(new Error(`Time conflict: "${conflict.title}"`), { statusCode: 409 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'FORWARDED',
      leaderId,
      secretaryId,
      secretaryNote: note,
      date: new Date(finalDate),
      startTime: finalStartTime,
      endTime: finalEndTime,
    },
    include: { requester: true, leader: true },
  });

  // Notify leader
  await notificationService.createNotification({
    userId: leaderId,
    title: 'Appointment Forwarded to You',
    message: `Secretary forwarded: "${updated.title}" from ${updated.requester.fullName} — please review`,
    type: 'APPOINTMENT_FORWARDED',
    data: { appointmentId: id },
  });

  // Notify student
  await notificationService.createNotification({
    userId: appointment.requesterId,
    title: 'Request Forwarded',
    message: `Your appointment request has been forwarded to ${leader.fullName} for final approval`,
    type: 'APPOINTMENT_FORWARDED',
    data: { appointmentId: id },
  });

  await prisma.auditLog.create({
    data: {
      userId: secretaryId,
      action: 'APPOINTMENT_FORWARDED',
      entity: 'Appointment',
      entityId: id,
      appointmentId: id,
      details: { leaderId, note },
    },
  });

  return updated;
};

/**
 * STEP 3 — Leader approves (only FORWARDED appointments)
 */
const leaderApprove = async (id, leaderId, note) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (appointment.leaderId !== leaderId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  if (appointment.status !== 'FORWARDED') {
    throw Object.assign(new Error('Only forwarded appointments can be approved'), { statusCode: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'APPROVED', leaderNote: note },
    include: { requester: true, secretary: true },
  });

  await notificationService.createNotification({
    userId: updated.requesterId,
    title: 'Appointment Approved!',
    message: `Your appointment "${updated.title}" has been approved`,
    type: 'APPOINTMENT_APPROVED',
    data: { appointmentId: id },
  });

  if (updated.secretaryId) {
    await notificationService.createNotification({
      userId: updated.secretaryId,
      title: 'Appointment Approved',
      message: `"${updated.title}" was approved by the leader`,
      type: 'APPOINTMENT_APPROVED',
      data: { appointmentId: id },
    });
  }

  await prisma.auditLog.create({
    data: { userId: leaderId, action: 'APPOINTMENT_APPROVED', entity: 'Appointment', entityId: id, appointmentId: id },
  });

  return updated;
};

/**
 * Reject appointment — by Secretary or Leader
 */
const rejectAppointment = async (id, userId, reason) => {
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { requester: true } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const canReject =
    (user.role === 'SECRETARY' && ['PENDING', 'UNDER_REVIEW'].includes(appointment.status)) ||
    ((['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(user.role)) &&
      appointment.leaderId === userId && appointment.status === 'FORWARDED') ||
    user.role === 'ADMIN';

  if (!canReject) throw Object.assign(new Error('You cannot reject this appointment in its current state'), { statusCode: 403 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason },
  });

  await notificationService.createNotification({
    userId: appointment.requesterId,
    title: 'Appointment Rejected',
    message: `Your appointment "${appointment.title}" was rejected. Reason: ${reason}`,
    type: 'APPOINTMENT_REJECTED',
    data: { appointmentId: id },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'APPOINTMENT_REJECTED',
      entity: 'Appointment',
      entityId: id,
      appointmentId: id,
      details: { reason },
    },
  });

  return updated;
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (id, userId, reason) => {
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { requester: true, leader: true } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  const canCancel =
    appointment.requesterId === userId ||
    appointment.leaderId === userId ||
    appointment.secretaryId === userId;

  if (!canCancel) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(appointment.status)) {
    throw Object.assign(new Error('Cannot cancel this appointment'), { statusCode: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED', cancellationReason: reason },
  });

  const notifyIds = [appointment.requesterId, appointment.leaderId, appointment.secretaryId].filter(Boolean);
  for (const uid of notifyIds) {
    if (uid !== userId) {
      await notificationService.createNotification({
        userId: uid,
        title: 'Appointment Cancelled',
        message: `"${appointment.title}" was cancelled. Reason: ${reason}`,
        type: 'APPOINTMENT_CANCELLED',
        data: { appointmentId: id },
      });
    }
  }

  await prisma.auditLog.create({
    data: { userId, action: 'APPOINTMENT_CANCELLED', entity: 'Appointment', entityId: id, appointmentId: id, details: { reason } },
  });

  return updated;
};

/**
 * Request reschedule
 */
const requestReschedule = async (appointmentId, requestedById, data) => {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  if (appointment.leaderId) {
    const conflict = await checkConflict(appointment.leaderId, data.newDate, data.newStartTime, data.newEndTime, appointmentId);
    if (conflict) throw Object.assign(new Error('New time slot conflicts with existing appointment'), { statusCode: 409 });
  }

  const reschedule = await prisma.rescheduleRequest.create({
    data: {
      appointmentId,
      requestedById,
      oldDate: appointment.date,
      oldStartTime: appointment.startTime,
      oldEndTime: appointment.endTime,
      newDate: new Date(data.newDate),
      newStartTime: data.newStartTime,
      newEndTime: data.newEndTime,
      reason: data.reason,
    },
  });

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'RESCHEDULED' } });

  const notifyId = appointment.leaderId || appointment.secretaryId;
  if (notifyId) {
    await notificationService.createNotification({
      userId: notifyId,
      title: 'Reschedule Request',
      message: `Reschedule requested for "${appointment.title}" to ${data.newDate}`,
      type: 'APPOINTMENT_RESCHEDULED',
      data: { appointmentId, rescheduleId: reschedule.id },
    });
  }

  return reschedule;
};

/**
 * Get appointments (role-filtered)
 */
const getAppointments = async (user, filters = {}) => {
  const { status, date, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  let where = {};

  if (user.role === 'STUDENT') {
    where.requesterId = user.id;
  } else if (user.role === 'SECRETARY') {
    // Secretary sees all PENDING (unassigned in their dept) + their own assigned
    where.OR = [
      { secretaryId: user.id },
      { status: 'PENDING', targetDepartment: user.department },
    ];
  } else if (['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(user.role)) {
    // Leaders ONLY see FORWARDED (and already decided) appointments assigned to them
    where.leaderId = user.id;
  }
  // ADMIN sees all

  if (status) where.status = status;
  if (date) where.date = new Date(date);

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        requester: { select: { id: true, fullName: true, email: true, role: true } },
        leader: { select: { id: true, fullName: true, email: true, role: true } },
        secretary: { select: { id: true, fullName: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

/**
 * Get single appointment by ID (with access control)
 */
const getAppointmentById = async (id, user) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, fullName: true, email: true, role: true, phone: true } },
      leader: { select: { id: true, fullName: true, email: true, role: true, phone: true } },
      secretary: { select: { id: true, fullName: true, email: true } },
      rescheduleRequests: { orderBy: { createdAt: 'desc' } },
      auditLogs: { orderBy: { timestamp: 'desc' }, take: 10 },
    },
  });

  if (!appointment) throw Object.assign(new Error('Appointment not found'), { statusCode: 404 });

  const hasAccess =
    appointment.requesterId === user.id ||
    appointment.leaderId === user.id ||
    appointment.secretaryId === user.id ||
    user.role === 'ADMIN' ||
    (user.role === 'SECRETARY' && appointment.targetDepartment === user.department);

  if (!hasAccess) throw Object.assign(new Error('Access denied'), { statusCode: 403 });

  return appointment;
};

/**
 * Get available time slots for a leader
 */
const getAvailableSlots = async (leaderId, date) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      leaderId,
      date: new Date(date),
      status: { in: ['FORWARDED', 'APPROVED'] },
    },
  });
  return generateAvailableSlots(appointments, date);
};

/**
 * Get list of departments (for student request form)
 */
const getDepartments = async () => {
  const departments = await prisma.user.findMany({
    where: { role: 'SECRETARY', isActive: true },
    select: { department: true },
    distinct: ['department'],
  });
  return departments.map((d) => d.department).filter(Boolean);
};

module.exports = {
  createAppointment,
  secretaryMarkUnderReview,
  secretaryForward,
  leaderApprove,
  rejectAppointment,
  cancelAppointment,
  requestReschedule,
  getAppointments,
  getAppointmentById,
  getAvailableSlots,
  getDepartments,
};
