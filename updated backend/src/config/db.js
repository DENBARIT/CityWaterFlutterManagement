import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || typeof databaseUrl !== 'string' || databaseUrl.trim().length === 0) {
  throw new Error(
    'DATABASE_URL is missing. Create updated backend/.env and set a valid Postgres URL.'
  );
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log('Disconnected from the database');
};
