import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2] || 'admin@pizza.com';
  const password = process.argv[3] || 'admin123';
  const role = process.argv[4] || 'admin';

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: {
        passwordHash,
        role,
        isActive: true,
      },
      create: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role,
        isActive: true,
      },
    });

    console.log(`Admin created/updated: ${admin.email} (role: ${admin.role})`);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
