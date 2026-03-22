import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");
    
    const account = await prisma.telegramAccount.findFirst();
    if (!account) throw new Error("No account found");

    console.log("Creating campaign with user ID:", user.id, "and account ID:", account.id);

    const campaign = await prisma.campaign.create({
      data: {
        name: "Test Campaign",
        messageTemplate: "Hello",
        intervalMin: 30,
        intervalMax: 60,
        userId: user.id,
        status: "PENDING",
        accounts: {
          create: [{
            telegramAccountId: account.id,
          }],
        },
      },
    })
    console.log("Success:", campaign.id);
  } catch (error: any) {
    console.error("Failed to create:", error);
  } finally {
    await prisma.$disconnect()
  }
}

main()
