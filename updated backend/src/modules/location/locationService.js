import { prisma } from '../../config/db.js';

export const getSubCities = async () => {
  return prisma.subCity.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};

export const getWoredas = async (subCityId) => {
  const where = {
    deletedAt: null,
    ...(subCityId ? { subCityId } : {}),
  };

  return prisma.woreda.findMany({
    where,
    select: {
      id: true,
      name: true,
      subCityId: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};
