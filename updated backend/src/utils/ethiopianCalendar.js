const ETHIOPIAN_MONTHS_EN = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Genbot',
  'Sene',
  'Hamle',
  'Nehasse',
  'Pagume',
];

const ETHIOPIAN_MONTHS_AM = [
  'መስከረም',
  'ጥቅምት',
  'ህዳር',
  'ታህሳስ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜ',
];

const ETHIOPIAN_EPOCH = 1723856;

const toJulianDay = (year, month, day) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

export const gregorianToEthiopian = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const jdn = toJulianDay(year, month, day);
  const r = (jdn - ETHIOPIAN_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);

  const ethYear =
    4 * Math.floor((jdn - ETHIOPIAN_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
  };
};

export const formatEthiopianDate = (dateLike, locale = 'en') => {
  const converted = gregorianToEthiopian(dateLike);
  if (!converted) {
    return null;
  }

  const months = locale === 'am' ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN;
  const monthName = months[converted.month - 1] || `Month-${converted.month}`;
  return `${monthName} ${converted.day}, ${converted.year}`;
};

export const formatDualCalendarDate = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const gregorian = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const ethiopianEn = formatEthiopianDate(date, 'en');
  const ethiopianAm = formatEthiopianDate(date, 'am');

  return {
    gregorian,
    ethiopianEn,
    ethiopianAm,
    combined: ethiopianEn ? `${gregorian} / ${ethiopianEn}` : gregorian,
    combinedWithAm: ethiopianAm ? `${gregorian} / ${ethiopianAm}` : gregorian,
  };
};
