import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db.js';

const baseUrl = 'http://127.0.0.1:5001';
const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

const unique = Date.now().toString().slice(-5);
const meterNumber = `MTR-${unique}`;
const customerEmail = `e2e.customer.${unique}@citywater.local`;
const customerPhone = `+2519${String(10000000 + Number(unique)).slice(0, 8)}`;
const nationalId = `E2E${year}${month}${unique}`;
const customerPassword = 'Customer@123';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function httpJson(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, options);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { status: res.status, ok: res.ok, body };
}

try {
  const subCity = await prisma.subCity.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  assert(subCity, 'No subcity found in DB.');

  const woreda = await prisma.woreda.findFirst({
    where: { subCityId: subCity.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  assert(woreda, 'No woreda found in DB for selected subcity.');

  const passwordHash = await bcrypt.hash(customerPassword, 10);

  const customer = await prisma.user.create({
    data: {
      fullName: `E2E Customer ${unique}`,
      email: customerEmail,
      phoneE164: customerPhone,
      nationalId,
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      subCityId: subCity.id,
      woredaId: woreda.id,
      preference: { create: {} },
    },
  });

  await prisma.meter.create({
    data: {
      meterNumber,
      customerId: customer.id,
      subCityId: subCity.id,
      woredaId: woreda.id,
      registeredNationalId: nationalId,
      registeredFullName: customer.fullName,
      registeredById: customer.id,
      registeredAt: new Date(),
      status: 'ACTIVE',
      isLocked: false,
      lastReading: 0,
    },
  });

  const activeTariff = await prisma.tariff.findFirst({
    where: { isActive: true, effectiveFrom: { lte: new Date() } },
    include: { blocks: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!activeTariff || !activeTariff.blocks?.length) {
    const maxVersion = await prisma.tariff.aggregate({ _max: { version: true } });
    const version = (maxVersion._max.version || 0) + 1;
    await prisma.tariff.create({
      data: {
        name: `E2E Tariff v${version}`,
        isActive: true,
        effectiveFrom: new Date(Date.now() - 3600_000),
        version,
        blocks: {
          create: [{ fromM3: 0, toM3: null, pricePerM3: '12.50' }],
        },
      },
    });
  }

  const login = await httpJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrPhone: customerEmail, password: customerPassword }),
  });
  assert(login.ok, `Customer login failed: ${JSON.stringify(login.body)}`);
  const customerToken = login.body?.data?.accessToken;
  assert(customerToken, 'Customer access token missing.');

  const currentBefore = await httpJson('/auth/billing/current', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  const submit = await httpJson('/auth/billing/submit-reading', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ meterNumber, readingValue: 37, source: 'OCR' }),
  });
  assert(submit.status === 201, `Submit reading failed: ${JSON.stringify(submit.body)}`);
  const submittedBill = submit.body?.data;
  assert(submittedBill?.meterNumber === meterNumber, 'Submitted bill meter mismatch.');
  assert(submittedBill?.paymentStatus === 'UNPAID', 'Submitted bill should be UNPAID.');

  const pay = await httpJson('/auth/billing/pay-current', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(pay.ok, `Pay current bill failed: ${JSON.stringify(pay.body)}`);
  const paidBill = pay.body?.data?.bill;
  const payment = pay.body?.data?.payment;
  assert(paidBill?.meterNumber === meterNumber, 'Paid bill meter mismatch.');
  assert(paidBill?.paymentStatus === 'PAID', 'Paid bill should be PAID.');
  assert(payment?.status === 'SUCCESS', 'Payment status should be SUCCESS.');

  const readings = await httpJson('/super-admin/readings');
  assert(readings.ok, `Super-admin readings fetch failed: ${JSON.stringify(readings.body)}`);
  const readingRows = Array.isArray(readings.body) ? readings.body : [];
  const readingHit = readingRows.find((row) => row.meter?.meterNumber === meterNumber);
  assert(readingHit, 'New reading not found in super-admin readings endpoint.');

  const bills = await httpJson('/super-admin/bills');
  assert(bills.ok, `Super-admin bills fetch failed: ${JSON.stringify(bills.body)}`);
  const billRows = Array.isArray(bills.body) ? bills.body : [];
  const billHit = billRows.find(
    (row) =>
      row.customer?.email === customerEmail &&
      row.monthYear === `${year}-${String(month).padStart(2, '0')}`
  );
  assert(billHit, 'New bill not found in super-admin bills endpoint.');
  assert(String(billHit.status).toUpperCase() === 'PAID', 'Admin bill status is not PAID.');

  const currentAfter = await httpJson('/auth/billing/current', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        testContext: {
          meterNumber,
          customerEmail,
          cycle: `${year}-${String(month).padStart(2, '0')}`,
        },
        currentBillBeforeSubmit: currentBefore.body?.data || null,
        submitResult: {
          id: submittedBill?.id,
          amountDue: submittedBill?.amountDue,
          paymentStatus: submittedBill?.paymentStatus,
          source: submittedBill?.source,
        },
        paymentResult: {
          billStatus: paidBill?.paymentStatus,
          transactionId: payment?.transactionId,
          usedChapa: payment?.usedChapa,
          checkoutUrlPresent: Boolean(payment?.checkoutUrl),
          providerMessage: payment?.message,
        },
        adminVisibility: {
          readingFound: true,
          billFound: true,
          billStatus: billHit?.status,
          billNumber: billHit?.billNumber,
        },
        currentBillAfterPayment: {
          id: currentAfter.body?.data?.id,
          paymentStatus: currentAfter.body?.data?.paymentStatus,
          paymentReference: currentAfter.body?.data?.paymentReference,
        },
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
