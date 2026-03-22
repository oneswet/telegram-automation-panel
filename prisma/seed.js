const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('lonake300@@', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'bogos300@gmail.com' },
    update: {
      password: password,
    },
    create: {
      email: 'bogos300@gmail.com',
      name: 'Demo Admin',
      password: password,
      role: 'ADMIN',
    },
  })

  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
