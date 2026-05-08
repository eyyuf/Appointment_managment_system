const prisma = require('../config/db');

const getCalendar = async (user, { year, month }) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  let where = { date: { gte: start, lte: end }, status: { in: ['APPROVED', 'SECRETARY_APPROVED', 'PENDING'] } };

  if (user.role === 'STUDENT') where.requesterId = user.id;
  else if (user.role === 'SECRETARY') where.secretaryId = user.id;
  else if (['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(user.role)) where.leaderId = user.id;

  return prisma.appointment.findMany({
    where,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    include: {
      requester: { select: { id: true, fullName: true } },
      leader: { select: { id: true, fullName: true } },
    },
  });
};

const getDaySchedule = async (user, date) => {
  let where = { date: new Date(date) };
  if (user.role === 'STUDENT') where.requesterId = user.id;
  else if (user.role === 'SECRETARY') where.secretaryId = user.id;
  else if (['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(user.role)) where.leaderId = user.id;

  return prisma.appointment.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: {
      requester: { select: { id: true, fullName: true } },
      leader: { select: { id: true, fullName: true } },
    },
  });
};

module.exports = { getCalendar, getDaySchedule };
