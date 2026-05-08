const prisma = require('../config/db');
const { timesOverlap, generateAvailableSlots } = require('../utils/dateUtils');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

/**
 * Check for scheduling conflicts for a leader on a given date
 */
const checkConflict = async (leaderId, date, startTime, endTime, excludeId = null) => {
  const where = {
    leaderId,
    date: new Date(date),
    status: { in: ['PENDING', 'SECRETARY_APPROVED', 'APPROVED'] },
  };
  if (excludeId) where.id = { not: excludeId };

  const existing = await prisma.appointment.findMany({ where });
  return existing.find((a) => timesOverlap(startTime, endTime, a.startTime, a.endTime));
};

/**
 * Create a new appointment
 */
const createAppointment = async (requesterId, data) => {
  const { leaderId, title, description, date, startTime, endTime, location } = data;

  // Validate leader exists and has a leadership role
  const leader = await prisma.user.findUnique({ where: { id: leaderId } });
  if (!leader) throw Object.assign(new Error('Leader not found'), { statusCode: 404 });

  const leadershipRoles = ['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'];
  if (!leadershipRoles.includes(leader.role)) {
    throw Object.assign(new Error('Target user is not a leader'), { statusCode: 400 });
  }

  // Check conflict
  const conflict = await checkConflict(leaderId, date, startTime, endTime);
  if (conflict) {
    throw Object.assign(
      new Error(`Time slot conflicts with existing appointment: "${conflict.title}"`),
      { statusCode: 409 }
    );
  }

  // Find secretary assigned to this leader's department (if any)
  const secretary = await prisma.user.findFirst({
    where: { role: 'SECRETARY', department: leader.department, isActive: true },
  });

  const appointment = await prisma.appointment.create({
    data: {
      requesterId,
      leaderId,
      secretaryId: secretary?.id,
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      location,
      status: 'PENDING',
    },
    include: {
      requester: { select: { id: true, fullName: true, email: true, role: true } },
      leader: { select: { id: true, fullName: true, email: true, role: true } },
      secretary: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Notify secretary and leader
  if (secretary) {
    await notificationService.createNotification({
      userId: secretary.id,
      title: 'New Appointment Request',
      message: `${appointment.requester.fullName} requested an appointment with ${leader.fullName} on ${date}`,
      type: 'APPOINTMENT_CREATED',
      data: { appointmentId: appointment.id },
    });
  }

  await notificationService.createNotification({
    userId: leaderId,
    title: 'New Appointment Request',
    message: `You have a new appointment request from ${appointment.requester.fullName}`,
    type: 'APPOINTMENT_CREATED',
    data: { appointmentId: appointment.id },
  });

  logger.info(`Appointment created: ${appointment.id}`);
  return appointment;
};

/**
 * Get all appointments with filters
 */
const getAppointments = async (user, filters = {}) => {
  const { status, date, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  let where = {};

  // Role-based visibility
  if (user.role === 'STUDENT') {
    where.requesterId = user.id;
  } else if (user.role === 'SECRETARY') {
    where.secretaryId = user.id;
  } else if (['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(user.role)) {
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
 * Get single appointment by ID
 */
const getAppointmentById = async (id, user) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, fullName: true, email: true, role: true, phone: true } },
      leader: { select: { id: true, fullName: true, email: true, role: true, phone: true } },
      secretary: { select: { id: true, fullName: true, email: true } },
      rescheduleRequests: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!appointment) throw Object.assign(new Error('Appointment not found'), { statusCode: 404 });

  // Check access
  const adminRoles = ['ADMIN', 'SECRETARY'];
  const hasAccess =
    appointment.requesterId === user.id ||
    appointment.leaderId === user.id ||
    appointment.secretaryId === user.id ||
    adminRoles.includes(user.role);

  if (!hasAccess) throw Object.assign(new Error('Access denied'), { statusCode: 403 });

  return appointment;
};

/**
 * Secretary approves / forwards appointment
 */
const secretaryApprove = async (id, secretaryId, note) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (appointment.secretaryId !== secretaryId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  if (appointment.status !== 'PENDING') throw Object.assign(new Error('Appointment is not pending'), { statusCode: 400 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'SECRETARY_APPROVED', secretaryNote: note },
    include: { requester: true, leader: true },
  });

  await notificationService.createNotification({
    userId: updated.leaderId,
    title: 'Appointment Awaiting Your Approval',
    message: `Secretary approved: "${updated.title}" — please review`,
    type: 'APPOINTMENT_APPROVED',
    data: { appointmentId: id },
  });

  await notificationService.createNotification({
    userId: updated.requesterId,
    title: 'Appointment Forwarded',
    message: 'Your appointment request has been forwarded to the leader for approval',
    type: 'APPOINTMENT_APPROVED',
    data: { appointmentId: id },
  });

  return updated;
};

/**
 * Leader approves appointment
 */
const leaderApprove = async (id, leaderId, note) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (appointment.leaderId !== leaderId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  if (!['PENDING', 'SECRETARY_APPROVED'].includes(appointment.status)) {
    throw Object.assign(new Error('Cannot approve in current status'), { statusCode: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'APPROVED', leaderNote: note },
    include: { requester: true },
  });

  await notificationService.createNotification({
    userId: updated.requesterId,
    title: 'Appointment Approved! ✅',
    message: `Your appointment "${updated.title}" has been approved`,
    type: 'APPOINTMENT_APPROVED',
    data: { appointmentId: id },
  });

  return updated;
};

/**
 * Reject appointment
 */
const rejectAppointment = async (id, userId, reason) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  const canReject = appointment.leaderId === userId || appointment.secretaryId === userId;
  if (!canReject) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'REJECTED', cancellationReason: reason },
    include: { requester: true },
  });

  await notificationService.createNotification({
    userId: updated.requesterId,
    title: 'Appointment Rejected ❌',
    message: `Your appointment "${updated.title}" was rejected. Reason: ${reason}`,
    type: 'APPOINTMENT_REJECTED',
    data: { appointmentId: id },
  });

  return updated;
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (id, userId, reason) => {
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { requester: true, leader: true } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  const canCancel = appointment.requesterId === userId || appointment.leaderId === userId || appointment.secretaryId === userId;
  if (!canCancel) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(appointment.status)) {
    throw Object.assign(new Error('Cannot cancel this appointment'), { statusCode: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED', cancellationReason: reason },
  });

  // Notify all parties
  const notifyIds = [appointment.requesterId, appointment.leaderId, appointment.secretaryId].filter(Boolean);
  for (const uid of notifyIds) {
    if (uid !== userId) {
      await notificationService.createNotification({
        userId: uid,
        title: 'Appointment Cancelled',
        message: `Appointment "${appointment.title}" was cancelled. Reason: ${reason}`,
        type: 'APPOINTMENT_CANCELLED',
        data: { appointmentId: id },
      });
    }
  }

  return updated;
};

/**
 * Request reschedule
 */
const requestReschedule = async (appointmentId, requestedById, data) => {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  const conflict = await checkConflict(appointment.leaderId, data.newDate, data.newStartTime, data.newEndTime, appointmentId);
  if (conflict) throw Object.assign(new Error('New time slot conflicts with existing appointment'), { statusCode: 409 });

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

  // Notify leader
  await notificationService.createNotification({
    userId: appointment.leaderId,
    title: 'Reschedule Request',
    message: `Reschedule requested for "${appointment.title}" to ${data.newDate}`,
    type: 'APPOINTMENT_RESCHEDULED',
    data: { appointmentId, rescheduleId: reschedule.id },
  });

  return reschedule;
};

/**
 * Get available time slots for a leader on a date
 */
const getAvailableSlots = async (leaderId, date) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      leaderId,
      date: new Date(date),
      status: { in: ['PENDING', 'SECRETARY_APPROVED', 'APPROVED'] },
    },
  });
  return generateAvailableSlots(appointments, date);
};

module.exports = {
  createAppointment, getAppointments, getAppointmentById,
  secretaryApprove, leaderApprove, rejectAppointment,
  cancelAppointment, requestReschedule, getAvailableSlots,
};
