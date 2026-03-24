const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  try {
    const [mods, pending, decisions] = await Promise.all([
      prisma.moderator.count(),
      prisma.contentItem.count({ where: { status: 'PENDING' } }),
      prisma.moderationDecision.count(),
    ]);

    console.log(
      JSON.stringify(
        {
          success: true,
          moderators: mods,
          pendingItems: pending,
          moderationDecisions: decisions,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error('Database connectivity failed.');
    if (error instanceof Error) {
      console.error(error.message);
      if (error.code) console.error(`code: ${error.code}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
