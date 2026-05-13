const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('adminpassword', 10);

  // Original Admin (preserve existing logic)
  const originalAdmin = await prisma.user.upsert({
    where: { email: 'admin@monster.com' },
    update: {
      password: adminPassword,
      role: 'admin',
      is_approved: true,
    },
    create: {
      email: 'admin@monster.com',
      name: 'Admin Monster',
      password: adminPassword,
      role: 'admin',
      is_approved: true,
    },
  });

  // Test Admin (for E2E tests)
  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password,
      role: 'admin',
      is_approved: true,
    },
    create: {
      email: 'admin@example.com',
      name: 'Test Admin',
      password,
      role: 'admin',
      is_approved: true,
    },
  });

  // Test User (for E2E tests)
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password,
      role: 'user',
      is_approved: true,
    },
    create: {
      email: 'user@example.com',
      name: 'Test User',
      password,
      role: 'user',
      is_approved: true,
    },
  });

  // Seed Master Assessors for E2E tests
  const seedAssessor1 = await prisma.masterAssessor.upsert({
    where: { id: 'seed-assessor-1' },
    update: {},
    create: {
      id: 'seed-assessor-1',
      name: 'Assessor One',
      email: 'assessor1@example.com',
    },
  });

  const seedAssessor2 = await prisma.masterAssessor.upsert({
    where: { id: 'seed-assessor-2' },
    update: {},
    create: {
      id: 'seed-assessor-2',
      name: 'Assessor Two',
      email: 'assessor2@example.com',
    },
  });

  const seedAssessor3 = await prisma.masterAssessor.upsert({
    where: { id: 'seed-assessor-3' },
    update: {},
    create: {
      id: 'seed-assessor-3',
      name: 'Assessor Three',
      email: 'assessor3@example.com',
    },
  });

  // Seed Project for E2E tests
  const seedProject1 = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Seed Project Alpha',
      description: 'A seeded project for E2E testing',
      status: 'active',
    },
  });

  // Seed Batch for the project
  const seedBatch1 = await prisma.batch.upsert({
    where: { id: 'seed-batch-1' },
    update: {},
    create: {
      id: 'seed-batch-1',
      name: 'Batch 1',
      projectId: 'seed-project-1',
    },
  });

  // Seed Participants
  const seedParticipant1 = await prisma.participant.upsert({
    where: { id: 'seed-participant-1' },
    update: {},
    create: {
      id: 'seed-participant-1',
      name: 'Participant One',
      email: 'participant1@example.com',
      batchId: 'seed-batch-1',
    },
  });

  const seedParticipant2 = await prisma.participant.upsert({
    where: { id: 'seed-participant-2' },
    update: {},
    create: {
      id: 'seed-participant-2',
      name: 'Participant Two',
      email: 'participant2@example.com',
      batchId: 'seed-batch-1',
    },
  });

  // Seed Participant 3 (no invitation - for bulk send test)
  const seedParticipant3 = await prisma.participant.upsert({
    where: { id: 'seed-participant-3' },
    update: {},
    create: {
      id: 'seed-participant-3',
      name: 'Participant Three',
      email: 'participant3@example.com',
      batchId: 'seed-batch-1',
    },
  });

  // Seed Invitation (sent, not expired)
  const seedInvitation1 = await prisma.invitation.upsert({
    where: { id: 'seed-invitation-1' },
    update: {},
    create: {
      id: 'seed-invitation-1',
      participantId: 'seed-participant-1',
      status: 'sent',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed Invitation (expired)
  const seedInvitation2 = await prisma.invitation.upsert({
    where: { id: 'seed-invitation-2' },
    update: {},
    create: {
      id: 'seed-invitation-2',
      participantId: 'seed-participant-2',
      status: 'expired',
      sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed Participant 4 (with expired invitation - for invitation-expiry API test)
  const seedParticipant4 = await prisma.participant.upsert({
    where: { id: 'seed-participant-4' },
    update: {},
    create: {
      id: 'seed-participant-4',
      name: 'Participant Four',
      email: 'participant4@example.com',
      batchId: 'seed-batch-1',
    },
  });

  // Seed Invitation 4 (expired - for invitation-expiry API test)
  const seedInvitation4 = await prisma.invitation.upsert({
    where: { id: 'seed-invitation-4' },
    update: {},
    create: {
      id: 'seed-invitation-4',
      participantId: 'seed-participant-4',
      status: 'expired',
      sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed Project Event
  const seedEvent1 = await prisma.projectEvent.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      projectId: 'seed-project-1',
      type: 'submit_project',
      payload: JSON.stringify({ message: 'Project submitted' }),
    },
  });

  console.log({
    originalAdmin, testAdmin, testUser,
    seedAssessor1, seedAssessor2, seedAssessor3,
    seedProject1, seedBatch1,
    seedParticipant1, seedParticipant2, seedParticipant3, seedParticipant4,
    seedInvitation1, seedInvitation2, seedInvitation4,
    seedEvent1,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
