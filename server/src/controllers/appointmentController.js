const appointmentService = require('../services/appointmentService');
const { success, created } = require('../utils/responseHandler');

const create = async (req, res, next) => {
  try {
    const appt = await appointmentService.createAppointment(req.user.id, req.body);
    return created(res, appt, 'Appointment request submitted — awaiting secretary review');
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const data = await appointmentService.getAppointments(req.user, req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const appt = await appointmentService.getAppointmentById(req.params.id, req.user);
    return success(res, appt);
  } catch (err) { next(err); }
};

// Secretary marks as under review
const markUnderReview = async (req, res, next) => {
  try {
    const appt = await appointmentService.secretaryMarkUnderReview(req.params.id, req.user.id);
    return success(res, appt, 'Appointment marked as under review');
  } catch (err) { next(err); }
};

// Secretary forwards to specific leader (MANDATORY step)
const secretaryForward = async (req, res, next) => {
  try {
    const appt = await appointmentService.secretaryForward(req.params.id, req.user.id, req.body);
    return success(res, appt, 'Appointment forwarded to leader');
  } catch (err) { next(err); }
};

// Leader approves (only FORWARDED appointments)
const leaderApprove = async (req, res, next) => {
  try {
    const appt = await appointmentService.leaderApprove(req.params.id, req.user.id, req.body.note);
    return success(res, appt, 'Appointment approved');
  } catch (err) { next(err); }
};

const reject = async (req, res, next) => {
  try {
    const appt = await appointmentService.rejectAppointment(req.params.id, req.user.id, req.body.reason);
    return success(res, appt, 'Appointment rejected');
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const appt = await appointmentService.cancelAppointment(req.params.id, req.user.id, req.body.cancellationReason);
    return success(res, appt, 'Appointment cancelled');
  } catch (err) { next(err); }
};

const reschedule = async (req, res, next) => {
  try {
    const result = await appointmentService.requestReschedule(req.params.id, req.user.id, req.body);
    return created(res, result, 'Reschedule request submitted');
  } catch (err) { next(err); }
};

const availableSlots = async (req, res, next) => {
  try {
    const slots = await appointmentService.getAvailableSlots(req.params.leaderId, req.query.date);
    return success(res, slots);
  } catch (err) { next(err); }
};

const getDepartments = async (req, res, next) => {
  try {
    const departments = await appointmentService.getDepartments();
    return success(res, departments);
  } catch (err) { next(err); }
};

module.exports = {
  create, getAll, getOne,
  markUnderReview, secretaryForward,
  leaderApprove, reject, cancel, reschedule,
  availableSlots, getDepartments,
};
