const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = async (pw) => bcrypt.hash(pw, 12);

  // ── Users ──────────────────────────────────────────────
  const users = [
    {
      fullName: 'System Administrator',
      email: 'admin@university.edu',
      password: await hash('Admin@123'),
      role: 'ADMIN',
      department: 'Administration',
      mustChangePassword: false,
    },
    {
      fullName: 'Prof. James Mwangi',
      email: 'president@university.edu',
      password: await hash('Pass@123'),
      role: 'PRESIDENT',
      department: 'Office of the President',
      mustChangePassword: false,
    },
    {
      fullName: 'Dr. Grace Ochieng',
      email: 'vp@university.edu',
      password: await hash('Pass@123'),
      role: 'VICE_PRESIDENT',
      department: 'Academic Affairs',
      mustChangePassword: false,
    },
    {
      fullName: 'Dr. Samuel Kipchoge',
      email: 'dean@university.edu',
      password: await hash('Pass@123'),
      role: 'DEAN',
      department: 'Faculty of Science',
      phone: '+254700000003',
      mustChangePassword: false,
    },
    {
      fullName: 'Dr. Alice Wanjiru',
      email: 'depthead@university.edu',
      password: await hash('Pass@123'),
      role: 'DEPARTMENT_HEAD',
      department: 'Computer Science',
      phone: '+254700000004',
      mustChangePassword: false,
    },
    {
      fullName: 'Ms. Faith Kamau',
      email: 'secretary@university.edu',
      password: await hash('Pass@123'),
      role: 'SECRETARY',
      department: 'Computer Science',
      phone: '+254700000005',
      mustChangePassword: false,
    },
    {
      fullName: 'Mr. Brian Otieno',
      email: 'secretary2@university.edu',
      password: await hash('Pass@123'),
      role: 'SECRETARY',
      department: 'Faculty of Science',
      phone: '+254700000008',
      mustChangePassword: false,
    },
    {
      fullName: 'John Odhiambo',
      email: 'student@university.edu',
      password: await hash('Pass@123'),
      role: 'STUDENT',
      phone: '+254700000006',
      mustChangePassword: false,
    },
    {
      fullName: 'Mary Wambui',
      email: 'student2@university.edu',
      password: await hash('Pass@123'),
      role: 'STUDENT',
      phone: '+254700000007',
      mustChangePassword: false,
    },
  ];

  const created = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    created[u.email] = user;
    console.log(`  ✓ ${u.role}: ${u.email}`);
  }

  // ── Sample Appointments (follow the new workflow) ──────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const student = created['student@university.edu'];
  const secretary = created['secretary@university.edu'];
  const deptHead = created['depthead@university.edu'];
  const dean = created['dean@university.edu'];

  // Appointment 1: PENDING — just submitted by student
  await prisma.appointment.create({
    data: {
      requesterId: student.id,
      secretaryId: secretary.id,
      leaderId: null,
      targetDepartment: 'Computer Science',
      title: 'Academic Advising Session',
      reason: 'I need guidance on course selection for next semester and want to discuss my academic progress with the department head.',
      description: 'First semester student needing guidance',
      date: tomorrow,
      startTime: '09:00',
      endTime: '09:30',
      status: 'PENDING',
      location: 'Room 201, CS Building',
    },
  });

  // Appointment 2: FORWARDED — secretary already forwarded
  await prisma.appointment.create({
    data: {
      requesterId: student.id,
      secretaryId: secretary.id,
      leaderId: deptHead.id,
      targetDepartment: 'Computer Science',
      title: 'Research Proposal Discussion',
      reason: 'I would like to discuss my final year research proposal and get feedback before submission.',
      date: dayAfter,
      startTime: '10:00',
      endTime: '10:30',
      status: 'FORWARDED',
      location: 'CS Department Office',
      secretaryNote: 'Student has a well-prepared proposal draft. Recommend 30-min slot.',
    },
  });

  // Appointment 3: APPROVED — full workflow complete
  const pastDay = new Date();
  pastDay.setDate(pastDay.getDate() + 3);

  await prisma.appointment.create({
    data: {
      requesterId: created['student2@university.edu'].id,
      secretaryId: created['secretary2@university.edu'].id,
      leaderId: dean.id,
      targetDepartment: 'Faculty of Science',
      title: 'Scholarship Application Review',
      reason: 'I would like to discuss my scholarship application status and seek the Dean\'s recommendation letter.',
      date: pastDay,
      startTime: '11:00',
      endTime: '11:30',
      status: 'APPROVED',
      location: "Dean's Office",
      secretaryNote: 'Student has excellent academic record. Forwarded for approval.',
      leaderNote: 'Approved. Please prepare the necessary documents.',
    },
  });

  console.log('✅ Seed completed successfully!\n');
  console.log('📋 Sample Accounts:');
  console.log('  Role                | Email                          | Password');
  console.log('  ─────────────────────────────────────────────────────────────');
  console.log(`  ADMIN               | admin@university.edu           | Admin@123`);
  console.log(`  PRESIDENT           | president@university.edu       | Pass@123`);
  console.log(`  VICE_PRESIDENT      | vp@university.edu              | Pass@123`);
  console.log(`  DEAN                | dean@university.edu            | Pass@123`);
  console.log(`  DEPARTMENT_HEAD     | depthead@university.edu        | Pass@123`);
  console.log(`  SECRETARY (CS)      | secretary@university.edu       | Pass@123`);
  console.log(`  SECRETARY (Science) | secretary2@university.edu      | Pass@123`);
  console.log(`  STUDENT             | student@university.edu         | Pass@123`);
  console.log(`  STUDENT             | student2@university.edu        | Pass@123`);
  console.log('\n🔄 Workflow: Student → Secretary (review/forward) → Leader (approve/reject)');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
