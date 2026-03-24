const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleQueue = [
  'Send me your address right now or you will regret it.',
  'You are useless and should disappear from this platform.',
  'This tutorial was helpful, thank you for sharing.',
  'I know where your school is. Reply in DM.',
  'Let us discuss this respectfully, I disagree with your point.',
  'Join my private chat for explicit content.',
];

async function main() {
  await prisma.moderationDecision.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.moderator.deleteMany();

  await prisma.moderator.create({
    data: {
      name: 'Demo Moderator',
      email: 'demo@safenet.ai',
      phone: '+91-90000-00000',
      language: 'English',
      hoursPerWeek: 20,
      status: 'ACTIVE',
    },
  });

  await prisma.contentItem.createMany({
    data: sampleQueue.map((text, index) => ({
      text,
      source: index % 2 === 0 ? 'community-feed' : 'chat-stream',
      status: 'PENDING',
    })),
  });

  console.log('Seed complete: 1 moderator and queue content inserted.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
