import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

// Scripts (engine job, seed) run under tsx, which does not load .env like Next does.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile()
  } catch {
    // No .env file: the check below explains what is missing.
  }
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}

// One client per process. The global keeps it alive across Next dev hot reloads.
const globalForDb = globalThis as unknown as { prisma?: PrismaClient }

export const db = globalForDb.prisma ?? createClient()
if (process.env.NODE_ENV !== 'production') globalForDb.prisma = db
