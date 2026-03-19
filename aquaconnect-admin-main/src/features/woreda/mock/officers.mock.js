export const MOCK_OFFICERS = [
  { id: 'o1', fullName: 'Dawit Bekele', email: 'dawit@aquaconnect.com', phoneE164: '+251912345678', nationalId: 'ETH123456789001', role: 'FIELD_OFFICER', fieldOfficerType: 'BILLING_OFFICER', status: 'ACTIVE', woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'o2', fullName: 'Hana Girma', email: 'hana@aquaconnect.com', phoneE164: '+251912345679', nationalId: 'ETH123456789002', role: 'FIELD_OFFICER', fieldOfficerType: 'COMPLAINT_OFFICER', status: 'ACTIVE', woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'o3', fullName: 'Yonas Haile', email: 'yonas@aquaconnect.com', phoneE164: '+251912345680', nationalId: 'ETH123456789003', role: 'FIELD_OFFICER', fieldOfficerType: 'BILLING_OFFICER', status: 'INACTIVE', woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, createdAt: '2026-02-01T00:00:00.000Z' },
  { id: 'o4', fullName: 'Meron Tadesse', email: 'meron@aquaconnect.com', phoneE164: '+251912345681', nationalId: 'ETH123456789004', role: 'FIELD_OFFICER', fieldOfficerType: 'COMPLAINT_OFFICER', status: 'ACTIVE', woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, createdAt: '2026-02-10T00:00:00.000Z' },
];

export const MOCK_WOREDA_CUSTOMERS = [
  { id: 'c1', fullName: 'Abebe Kebede', email: 'abebe@gmail.com', phoneE164: '+251912345690', nationalId: 'ETH123456789010', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, meter: { id: 'm1', meterNumber: 'MTR-001' }, createdAt: '2026-01-05T00:00:00.000Z' },
  { id: 'c2', fullName: 'Tigist Haile', email: 'tigist@gmail.com', phoneE164: '+251912345691', nationalId: 'ETH123456789011', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'WARNING', emailVerified: true, woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, meter: { id: 'm2', meterNumber: 'MTR-002' }, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'c3', fullName: 'Dawit Alemu', email: 'dawita@gmail.com', phoneE164: '+251912345692', nationalId: 'ETH123456789012', role: 'CUSTOMER', status: 'SUSPENDED', paymentFlag: 'LEGAL_ACTION', emailVerified: true, woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, meter: { id: 'm3', meterNumber: 'MTR-003' }, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'c4', fullName: 'Selam Worku', email: 'selamw@gmail.com', phoneE164: '+251912345693', nationalId: 'ETH123456789013', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, meter: { id: 'm4', meterNumber: 'MTR-004' }, createdAt: '2026-02-01T00:00:00.000Z' },
  { id: 'c5', fullName: 'Biruk Tesfaye', email: 'birukT@gmail.com', phoneE164: '+251912345694', nationalId: 'ETH123456789014', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'CRITICAL', emailVerified: false, woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, meter: null, createdAt: '2026-02-05T00:00:00.000Z' },
  { id: 'c6', fullName: 'Kalkidan Mesfin', email: 'kalkidanm@gmail.com', phoneE164: '+251912345695', nationalId: 'ETH123456789015', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, meter: { id: 'm5', meterNumber: 'MTR-005' }, createdAt: '2026-02-10T00:00:00.000Z' },
];

export const MOCK_BILLING_REPORT = {
  totalBills: 105,
  breakdown: { paid: 82, unpaid: 14, overdue: 6, escalated: 3 },
  totalAmount: 13125,
  collectedAmount: 10250,
  pendingAmount: 2875,
};

export const MOCK_COMPLAINT_REPORT = {
  totalComplaints: 24,
  breakdown: { open: 5, inProgress: 8, resolved: 9, closed: 2 },
  resolutionRate: '45.8%',
};

export const MOCK_CUSTOMER_REPORT = {
  totalCustomers: 6,
  breakdown: { active: 4, suspended: 1, flagged: 3, escalated: 1 },
};