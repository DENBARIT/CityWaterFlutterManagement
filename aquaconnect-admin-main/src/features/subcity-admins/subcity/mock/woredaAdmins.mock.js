export const MOCK_WOREDAS = [
  { id: 'w1', name: 'Woreda 01', subCityId: 'sc1' },
  { id: 'w2', name: 'Woreda 02', subCityId: 'sc1' },
  { id: 'w3', name: 'Woreda 03', subCityId: 'sc1' },
];

export const MOCK_WOREDA_ADMINS = [
  { id: 'wa1', fullName: 'Biruk Alemu', email: 'biruk@aquaconnect.com', phoneE164: '+251912345678', nationalId: 'ETH123456789001', role: 'WOREDA_ADMIN', status: 'ACTIVE', woreda: { id: 'w1', name: 'Woreda 01' }, subCity: { id: 'sc1', name: 'Bole' }, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wa2', fullName: 'Hana Girma', email: 'hana@aquaconnect.com', phoneE164: '+251912345679', nationalId: 'ETH123456789002', role: 'WOREDA_ADMIN', status: 'ACTIVE', woreda: { id: 'w2', name: 'Woreda 02' }, subCity: { id: 'sc1', name: 'Bole' }, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'wa3', fullName: 'Yonas Haile', email: 'yonas@aquaconnect.com', phoneE164: '+251912345680', nationalId: 'ETH123456789003', role: 'WOREDA_ADMIN', status: 'INACTIVE', woreda: { id: 'w3', name: 'Woreda 03' }, subCity: { id: 'sc1', name: 'Bole' }, createdAt: '2026-02-01T00:00:00.000Z' },
];