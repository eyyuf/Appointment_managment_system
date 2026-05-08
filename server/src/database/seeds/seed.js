const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = async (pw) => bcrypt.hash(pw, 12);

  // Seed users
  const users = [
    { fullName: 'System Administrator', email: 'admin@university.edu', password: await hash('Admin@123'), role: 'ADMIN', department: 'Administration' },
    { fullName: 'Prof. James Mwangi', email: 'president@university.edu', password: await hash('Pass@123'), role: 'PRESIDENT', department: 'Office of the President' },
    { fullName: 'Dr. Grace Ochieng', email: 'vp@university.edu', password: await hash('Pass@123'), role: 'VICE_PRESIDENT', department: 'Academic Affairs' },
    { fullName: 'Dr. Samuel Kipchoge', email: 'dean@university.edu', password: await hash('Pass@123'), role: 'DEAN', department: 'Faculty of Science', phone: '+254700000003' },
    { fullName: 'Dr. Alice Wanjiru', email: 'depthead@university.edu', password: await hash('Pass@123'), role: 'DEPARTMENT_HEAD', department: 'Computer Science', phone: '+254700000004' },
    { fullName: 'Ms. Faith Kamau', email: 'secretary@university.edu', password: await hash('Pass@123'), role: 'SECRETARY', department: 'Computer Science', phone: '+254700000005' },
    { fullName: 'John Odhiambo', email: 'student@university.edu', password: await hash('Pass@123'), role: 'STUDENT', phone: '+254700000006' },
    { fullName: 'Mary Wambui', email: 'student2@university.edu', password: await hash('Pass@123'), role: 'STUDENT', phone: '+254700000007' },
  ];

  const created = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    created[u.role] = user;
    console.log(`  ✓ ${u.role}: ${u.email}`);
  }

  // Seed sample appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  await prisma.appointment.createMany({
    data: [
      {
        requesterId: created['STUDENT'].id,
        leaderId: created['DEPARTMENT_HEAD'].id,
        secretaryId: created['SECRETARY'].id,
        title: 'Academic Advising Session',
        description: 'Discuss course selection for next semester',
        date: tomorrow,
        startTime: '09:00',
        endTime: '09:30',
        status: 'PENDING',
        location: 'Room 201, CS Building',
      },
      {
        requesterId: created['STUDENT'].id,
        leaderId: created['DEAN'].id,
        title: 'Scholarship Application Review',
        description: 'Review my scholarship application status',
        date: dayAfter,
        startTime: '10:00',
        endTime: '10:30',
        status: 'APPROVED',
        location: "Dean's Office",
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Sample Accounts:');
  users.forEach(async (u) => console.log(`  ${u.role.padEnd(20)} | ${u.email} | Pass: ${u.password === await hash('Admin@123') ? 'Admin@123' : 'Pass@123'}`));
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
