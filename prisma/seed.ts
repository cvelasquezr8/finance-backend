import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await argon2.hash('Admin123!')
  await prisma.user.upsert({
    where: { email: 'admin@financeapp.com' },
    update: {},
    create: {
      email: 'admin@financeapp.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      alias: 'admin',
      role: 'ADMIN',
      status: 'active',
      mustChangePassword: false,
    },
  })

  const userHash = await argon2.hash('User123!')
  await prisma.user.upsert({
    where: { email: 'ana.garcia@example.com' },
    update: {},
    create: {
      email: 'ana.garcia@example.com',
      passwordHash: userHash,
      firstName: 'Ana',
      lastName: 'García',
      alias: 'ana',
      role: 'USER',
      status: 'active',
      mustChangePassword: false,
    },
  })

  console.log('Seed complete: admin@financeapp.com / Admin123!, ana.garcia@example.com / User123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
