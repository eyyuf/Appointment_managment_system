const appointmentService = require('../services/appointmentService');
const { success, created } = require('../utils/responseHandler');

const create = async (req, res, next) => {
  try {
    const appt = await appointmentService.createAppointment(req.user.id, req.body);
    return created(res, appt, 'Appointment request created');
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

const secretaryApprove = async (req, res, next) => {
  try {
    const appt = await appointmentService.secretaryApprove(req.params.id, req.user.id, req.body.note);
    return success(res, appt, 'Appointment forwarded to leader');
  } catch (err) { next(err); }
};

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
    return success(res, slots, 'Available slots fetched');
  } catch (err) { next(err); }
};

module.exports = { create, getAll, getOne, secretaryApprove, leaderApprove, reject, cancel, reschedule, availableSlots };
