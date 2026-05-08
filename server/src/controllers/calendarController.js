const calendarService = require('../services/calendarService');
const { success } = require('../utils/responseHandler');

const getMonthly = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ success: false, message: 'year and month are required' });
    const data = await calendarService.getCalendar(req.user, { year: Number(year), month: Number(month) });
    return success(res, data);
  } catch (err) { next(err); }
};

const getDay = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date is required' });
    const data = await calendarService.getDaySchedule(req.user, date);
    return success(res, data);
  } catch (err) { next(err); }
};

module.exports = { getMonthly, getDay };
