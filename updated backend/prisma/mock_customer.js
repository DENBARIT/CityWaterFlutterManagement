import { prisma } from '../src/config/db.js';
import { hashPassword } from '../src/utils/hashtoken.js';

async function main() {
  const subCity = await prisma.subCity.findFirst({
    where: { deletedAt: null, isActive: true },
    orderBy: { name: 'asc' },
  });

  if (!subCity) {
    throw new Error('No active subcity found. Run prisma seed first.');
  }

  const woreda = await prisma.woreda.findFirst({
    where: { subCityId: subCity.id, deletedAt: null, isActive: true },
    orderBy: { name: 'asc' },
  });

  const hashedPassword = await hashPassword('Customer@123');

  const mockUsers = [
    {
      fullName: 'Test Customer One',
      email: 'test.customer1@citywater.local',
      phoneE164: '+251911111111',
      nationalId: 'CUST-TEST-001',
      meterNumber: 'MTR-TEST-001',
      houseNumber: '101',
    },
    {
      fullName: 'Test Customer Two',
      email: 'test.customer2@citywater.local',
      phoneE164: '+251911111112',
      nationalId: 'CUST-TEST-002',
      meterNumber: 'MTR-TEST-002',
      houseNumber: '102',
    },
  ];

  for (const item of mockUsers) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        fullName: item.fullName,
        phoneE164: item.phoneE164,
        nationalId: item.nationalId,
        subCityId: subCity.id,
        woredaId: woreda?.id || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: true,
        houseNumber: item.houseNumber,
        passwordHash: hashedPassword,
        deletedAt: null,
      },
      create: {
        fullName: item.fullName,
        email: item.email,
        phoneE164: item.phoneE164,
        nationalId: item.nationalId,
        passwordHash: hashedPassword,
        subCityId: subCity.id,
        woredaId: woreda?.id || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: true,
        houseNumber: item.houseNumber,
        preference: {
          create: {},
        },
      },
    });

    await prisma.meter.upsert({
      where: { meterNumber: item.meterNumber },
      update: {
        customerId: user.id,
        subCityId: subCity.id,
        status: 'ACTIVE',
      },
      create: {
        meterNumber: item.meterNumber,
        customerId: user.id,
        subCityId: subCity.id,
        status: 'ACTIVE',
        registeredById: user.id,
      },
    });

    console.log('Mock customer ready:', user.email);
  }

  console.log('Created/updated 2 mock customers for superadmin user testing.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
