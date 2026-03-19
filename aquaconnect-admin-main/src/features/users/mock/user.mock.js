export const MOCK_SUBCITIES = [
  { id: 'sc1', name: 'Bole' },
  { id: 'sc2', name: 'Kirkos' },
  { id: 'sc3', name: 'Yeka' },
  { id: 'sc4', name: 'Arada' },
  { id: 'sc5', name: 'Lideta' },
];

export const MOCK_WOREDAS = [
  { id: 'w1', name: 'Woreda 01', subCityId: 'sc1' },
  { id: 'w2', name: 'Woreda 02', subCityId: 'sc1' },
  { id: 'w3', name: 'Woreda 03', subCityId: 'sc2' },
  { id: 'w4', name: 'Woreda 04', subCityId: 'sc2' },
  { id: 'w5', name: 'Woreda 05', subCityId: 'sc3' },
  { id: 'w6', name: 'Woreda 06', subCityId: 'sc3' },
  { id: 'w7', name: 'Woreda 07', subCityId: 'sc4' },
  { id: 'w8', name: 'Woreda 08', subCityId: 'sc5' },
];

export const MOCK_USERS = [
  { id: 'u1', fullName: 'Abebe Kebede', email: 'abebe@gmail.com', phoneE164: '+251912345678', nationalId: 'ETH123456789001', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, subCity: { id: 'sc1', name: 'Bole' }, woreda: { id: 'w1', name: 'Woreda 01' }, meter: { id: 'm1', meterNumber: 'MTR-001' }, createdAt: '2026-01-05T00:00:00.000Z' },
  { id: 'u2', fullName: 'Tigist Haile', email: 'tigist@gmail.com', phoneE164: '+251912345679', nationalId: 'ETH123456789002', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'WARNING', emailVerified: true, subCity: { id: 'sc1', name: 'Bole' }, woreda: { id: 'w2', name: 'Woreda 02' }, meter: { id: 'm2', meterNumber: 'MTR-002' }, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'u3', fullName: 'Dawit Bekele', email: 'dawit@gmail.com', phoneE164: '+251912345680', nationalId: 'ETH123456789003', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, subCity: { id: 'sc2', name: 'Kirkos' }, woreda: { id: 'w3', name: 'Woreda 03' }, meter: { id: 'm3', meterNumber: 'MTR-003' }, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'u4', fullName: 'Meron Tadesse', email: 'meron@gmail.com', phoneE164: '+251912345681', nationalId: 'ETH123456789004', role: 'CUSTOMER', status: 'SUSPENDED', paymentFlag: 'LEGAL_ACTION', emailVerified: true, subCity: { id: 'sc2', name: 'Kirkos' }, woreda: { id: 'w4', name: 'Woreda 04' }, meter: null, createdAt: '2026-01-20T00:00:00.000Z' },
  { id: 'u5', fullName: 'Yonas Girma', email: 'yonas@gmail.com', phoneE164: '+251912345682', nationalId: 'ETH123456789005', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'CRITICAL', emailVerified: false, subCity: { id: 'sc3', name: 'Yeka' }, woreda: { id: 'w5', name: 'Woreda 05' }, meter: { id: 'm4', meterNumber: 'MTR-004' }, createdAt: '2026-02-01T00:00:00.000Z' },
  { id: 'u6', fullName: 'Hana Worku', email: 'hana@gmail.com', phoneE164: '+251912345683', nationalId: 'ETH123456789006', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, subCity: { id: 'sc3', name: 'Yeka' }, woreda: { id: 'w6', name: 'Woreda 06' }, meter: { id: 'm5', meterNumber: 'MTR-005' }, createdAt: '2026-02-05T00:00:00.000Z' },
  { id: 'u7', fullName: 'Biruk Alemu', email: 'biruk@gmail.com', phoneE164: '+251912345684', nationalId: 'ETH123456789007', role: 'CUSTOMER', status: 'INACTIVE', paymentFlag: 'NONE', emailVerified: true, subCity: { id: 'sc4', name: 'Arada' }, woreda: { id: 'w7', name: 'Woreda 07' }, meter: { id: 'm6', meterNumber: 'MTR-006' }, createdAt: '2026-02-10T00:00:00.000Z' },
  { id: 'u8', fullName: 'Selam Tesfaye', email: 'selam@gmail.com', phoneE164: '+251912345685', nationalId: 'ETH123456789008', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'WARNING', emailVerified: true, subCity: { id: 'sc5', name: 'Lideta' }, woreda: { id: 'w8', name: 'Woreda 08' }, meter: { id: 'm7', meterNumber: 'MTR-007' }, createdAt: '2026-02-15T00:00:00.000Z' },
  { id: 'u9', fullName: 'Kalkidan Mekonnen', email: 'kalkidan@gmail.com', phoneE164: '+251912345686', nationalId: 'ETH123456789009', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, subCity: { id: 'sc1', name: 'Bole' }, woreda: { id: 'w1', name: 'Woreda 01' }, meter: { id: 'm8', meterNumber: 'MTR-008' }, createdAt: '2026-02-20T00:00:00.000Z' },
  { id: 'u10', fullName: 'Eyob Teshome', email: 'eyob@gmail.com', phoneE164: '+251912345687', nationalId: 'ETH123456789010', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: false, subCity: { id: 'sc2', name: 'Kirkos' }, woreda: { id: 'w3', name: 'Woreda 03' }, meter: null, createdAt: '2026-03-01T00:00:00.000Z' },
  { id: 'u11', fullName: 'Alem Bekele', email: 'alem@gmail.com', phoneE164: '+251912345688', nationalId: 'ETH123456789011', role: 'CUSTOMER', status: 'ACTIVE', paymentFlag: 'NONE', emailVerified: true, subCity: { id: 'sc4', name: 'Arada' }, woreda: { id: 'w7', name: 'Woreda 07' }, meter: { id: 'm9', meterNumber: 'MTR-009' }, createdAt: '2026-03-05T00:00:00.000Z' },
  { id: 'u12', fullName: 'Rahel Desta', email: 'rahel@gmail.com', phoneE164: '+251912345689', nationalId: 'ETH123456789012', role: 'CUSTOMER', status: 'SUSPENDED', paymentFlag: 'LEGAL_ACTION', emailVerified: true, subCity: { id: 'sc5', name: 'Lideta' }, woreda: { id: 'w8', name: 'Woreda 08' }, meter: { id: 'm10', meterNumber: 'MTR-010' }, createdAt: '2026-03-08T00:00:00.000Z' },
];