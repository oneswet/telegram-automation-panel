require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { prisma } = require('./lib/prisma');

async function test() {
  console.log('DATABASE_URL is:', process.env.DATABASE_URL);
  try {
    const user = await prisma.user.findFirst();
    console.log('✅ Successfully connected to DB! user:', user?.id);
    process.exit(0);
  } catch (err) {
    if (err instanceof Error) {
      console.error('❌ Test script error:', err.message);
    } else {
      console.error('❌ Test script error:', err);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(()=> {});
  }
}
test();
