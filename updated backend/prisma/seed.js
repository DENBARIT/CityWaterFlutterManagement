import { prisma } from '../src/config/db.js';
import { hashPassword } from '../src/utils/hashtoken.js';

async function main() {
  console.log('Seeding locations and SUPER ADMIN...');

  const subCityNames = [
    'Addis Ketema',
    'Akaki Kaliti',
    'Arada',
    'Bole',
    'Gulele',
    'Kirkos',
    'Kolfe Keranio',
    'Lideta',
    'Nifas Silk-Lafto',
    'Yeka',
    'Lemi Kura',
  ];

  const subCityByName = new Map();

  for (const name of subCityNames) {
    const subCity = await prisma.subCity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    subCityByName.set(name, subCity);
  }

  const woredaSeed = [
    { subCity: 'Bole', name: 'Bole Woreda 1' },
    { subCity: 'Bole', name: 'Bole Woreda 2' },
    { subCity: 'Bole', name: 'Bole Woreda 3' },
    { subCity: 'Bole', name: 'Bole Woreda 4' },
    { subCity: 'Bole', name: 'Bole Woreda 5' },
    { subCity: 'Addis Ketema', name: 'Addis Ketema Woreda 1' },
    { subCity: 'Akaki Kaliti', name: 'Akaki Kaliti Woreda 1' },
    { subCity: 'Arada', name: 'Arada Woreda 1' },
    { subCity: 'Gulele', name: 'Gulele Woreda 1' },
    { subCity: 'Kirkos', name: 'Kirkos Woreda 1' },
    { subCity: 'Kolfe Keranio', name: 'Kolfe Keranio Woreda 1' },
    { subCity: 'Lideta', name: 'Lideta Woreda 1' },
    { subCity: 'Nifas Silk-Lafto', name: 'Nifas Silk-Lafto Woreda 1' },
    { subCity: 'Yeka', name: 'Yeka Woreda 1' },
    { subCity: 'Lemi Kura', name: 'Lemi Kura Woreda 1' },
  ];

  for (const item of woredaSeed) {
    const subCity = subCityByName.get(item.subCity);
    if (!subCity) {
      continue;
    }

    await prisma.woreda.upsert({
      where: {
        subCityId_name: {
          subCityId: subCity.id,
          name: item.name,
        },
      },
      update: {},
      create: {
        subCityId: subCity.id,
        name: item.name,
      },
    });
  }

  const addisAbaba = subCityByName.get('Addis Ketema') || [...subCityByName.values()][0];

  // Check if SUPER_ADMIN exists
  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (existing) {
    if (!existing.emailVerified) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerified: true, otp: null, otpExpiry: null },
      });
      console.log('SUPER_ADMIN email verification fixed');
    }
    console.log('SUPER_ADMIN already exists');
    return;
  }

  const hashedPassword = await hashPassword('SuperAdmin@123');

  // Create SUPER_ADMIN
  const superAdmin = await prisma.user.create({
    data: {
      phoneE164: '+251900000000',
      nationalId: 'SUPERADMIN001',
      passwordHash: hashedPassword,
      email: 'superadmin@citywater.local',
      fullName: 'Addis Ababa Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      subCityId: addisAbaba.id,
    },
  });

  console.log('SUPER_ADMIN created:', superAdmin.phoneE164);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
