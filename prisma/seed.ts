import { PrismaClient, Role, UserStatus, SubscriptionPlan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@deskyura.com' },
    update: {},
    create: {
      email: 'admin@deskyura.com',
      passwordHash,
      role: Role.SUPERADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  const reviewerPassword = await bcrypt.hash('Reviewer@123', 10);
  const reviewer = await prisma.user.upsert({
    where: { email: 'revisor@deskyura.com' },
    update: {},
    create: {
      email: 'revisor@deskyura.com',
      passwordHash: reviewerPassword,
      role: Role.REVIEWER,
      status: UserStatus.ACTIVE,
      firstName: 'Revisor',
      lastName: 'Demo',
      reviewerProfile: {
        create: {
          specialties: ['CIVIL', 'LABOR'],
        },
      },
    },
  });

  const lawyerPassword = await bcrypt.hash('Lawyer@123', 10);
  const lawyer = await prisma.user.upsert({
    where: { email: 'advogado@deskyura.com' },
    update: {},
    create: {
      email: 'advogado@deskyura.com',
      passwordHash: lawyerPassword,
      role: Role.LAWYER,
      status: UserStatus.ACTIVE,
      firstName: 'João',
      lastName: 'Silva',
      lawyerProfile: {
        create: {
          oabNumber: 'OAB/SP 123456',
          oabState: 'SP',
          specialties: ['CIVIL', 'FAMILY'],
          plan: SubscriptionPlan.PROFESSIONAL,
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isAdimplente: true,
        },
      },
    },
  });

  console.log('Seed concluído:');
  console.log('  Superadmin:', superadmin.email, '/ Admin@123');
  console.log('  Revisor:', reviewer.email, '/ Reviewer@123');
  console.log('  Advogado:', lawyer.email, '/ Lawyer@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
