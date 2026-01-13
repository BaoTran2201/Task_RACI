import 'dotenv/config';
import prisma from '../src/utils/prisma.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('user123', 10);

    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      },
    });

    await prisma.user.upsert({
      where: { username: 'user' },
      update: {},
      create: {
        username: 'user',
        password: hashedUserPassword,
        role: 'user',
      },
    });

    console.log('✅ Seeded users:');
    console.log('   Admin: username=admin, password=admin123');
    console.log('   User: username=user, password=user123');

    const employees = await prisma.employee.count();
    const projects = await prisma.project.count();
    const tasks = await prisma.task.count();

    console.log(`\n📊 Database stats:`);
    console.log(`   Employees: ${employees}`);
    console.log(`   Projects: ${projects}`);
    console.log(`   Tasks: ${tasks}`);

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
