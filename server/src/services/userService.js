const prisma = require('../config/db');

const getUsersByRole = async (role) => {
  return prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true, fullName: true, email: true, role: true, department: true, phone: true },
  });
};

const getLeaders = async () => {
  return prisma.user.findMany({
    where: { role: { in: ['DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT'] }, isActive: true },
    select: { id: true, fullName: true, email: true, role: true, department: true },
  });
};

const getAllUsers = async ({ page = 1, limit = 20, role, search } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, role: true, department: true, phone: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true, role: true, department: true, phone: true, isActive: true, createdAt: true },
  });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

const updateUser = async (id, data) => {
  const { fullName, phone, department } = data;
  return prisma.user.update({
    where: { id },
    data: { fullName, phone, department },
    select: { id: true, fullName: true, email: true, role: true, department: true, phone: true },
  });
};

const toggleUserActive = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
};

module.exports = { getUsersByRole, getLeaders, getAllUsers, getUserById, updateUser, toggleUserActive };
