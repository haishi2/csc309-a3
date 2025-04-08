"use strict";

const {
  PrismaClient,
  Role,
  TransactionType,
  TransactionStatus,
  PromotionType,
} = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  console.log("Starting database seeding...");

  console.log("Clearing existing data...");
  await prisma.promotionUse.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.rSVP.deleteMany({});
  await prisma.organizer.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.transfer.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Creating users...");
  // Create 10 users with different roles
  const users = await Promise.all([
    // Superuser
    prisma.user.create({
      data: {
        username: "sarahlee",
        email: "sarahlee@mail.utoronto.ca",
        password: "123456aA!",
        name: "Sarah Lee",
        isActivated: true,
        role: Role.SUPERUSER,
        verifiedStudent: true,
        pointsBalance: 1000,
        birthday: "1990-01-01T00:00:00.000Z",
      },
    }),
    // Manager
    prisma.user.create({
      data: {
        username: "mikejohn",
        email: "mikejohn@mail.utoronto.ca",
        password: "123456aA!",
        name: "Mike Johnson",
        isActivated: true,
        role: Role.MANAGER,
        verifiedStudent: true,
        pointsBalance: 500,
        birthday: "1991-01-01T00:00:00.000Z",
      },
    }),
    // Cashier
    prisma.user.create({
      data: {
        username: "amysmith",
        email: "amysmith@mail.utoronto.ca",
        password: "123456aA!",
        name: "Amy Smith",
        isActivated: true,
        role: Role.CASHIER,
        verifiedStudent: true,
        pointsBalance: 300,
        birthday: "1992-01-01T00:00:00.000Z",
      },
    }),
    // Regular users
    prisma.user.create({
      data: {
        username: "johndoe1",
        email: "johndoe1@mail.utoronto.ca",
        password: "123456aA!",
        name: "John Doe",
        isActivated: true,
        role: Role.REGULAR,
        verifiedStudent: true,
        pointsBalance: 100,
        birthday: "1993-01-01T00:00:00.000Z",
      },
    }),
    prisma.user.create({
      data: {
        username: "emilywu2",
        email: "emilywu2@mail.utoronto.ca",
        password: "123456aA!",
        name: "Emily Wu",
        isActivated: true,
        role: Role.REGULAR,
        verifiedStudent: true,
        pointsBalance: 200,
        birthday: "1994-01-01T00:00:00.000Z",
      },
    }),
    prisma.user.create({
      data: {
        username: "alexng12",
        email: "alexng12@mail.utoronto.ca",
        password: "123456aA!",
        name: "Alex Ng",
        isActivated: true,
        role: Role.REGULAR,
        verifiedStudent: true,
        pointsBalance: 300,
        birthday: "1995-01-01T00:00:00.000Z",
      },
    }),
    prisma.user.create({
      data: {
        username: "juliakim",
        email: "juliakim@mail.utoronto.ca",
        password: "123456aA!",
        name: "Julia Kim",
        isActivated: true,
        role: Role.REGULAR,
        verifiedStudent: true,
        pointsBalance: 400,
        birthday: "1996-01-01T00:00:00.000Z",
      },
    }),
    prisma.user.create({
      data: {
        username: "ryanpark",
        email: "ryanpark@mail.utoronto.ca",
        password: "123456aA!",
        name: "Ryan Park",
        isActivated: true,
        role: Role.REGULAR,
        verifiedStudent: true,
        pointsBalance: 500,
        birthday: "1997-01-01T00:00:00.000Z",
      },
    }),
    prisma.user.create({
      data: {
        username: "liachen1",
        email: "liachen1@mail.utoronto.ca",
        password: "123456aA!",
        name: "Lia Chen",
        isActivated: true,
        role: Role.REGULAR,
        verifiedStudent: false,
        pointsBalance: 600,
        birthday: "1998-01-01T00:00:00.000Z",
      },
    }),
    prisma.user.create({
      data: {
        username: "davidlee",
        email: "davidlee@mail.utoronto.ca",
        password: "123456aA!",
        name: "David Lee",
        isActivated: true,
        role: Role.REGULAR,
        verifiedStudent: false,
        pointsBalance: 700,
        birthday: "1999-01-01T00:00:00.000Z",
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create events
  console.log("Creating events...");
  const events = await Promise.all(
    Array.from({ length: 5 }, (_, i) => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + i * 7); // Each event one week apart

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 3); // 3 hour events

      const totalPoints = 1000;

      return prisma.event.create({
        data: {
          name: `Sample Event ${i + 1}`,
          description: `This is a description for sample event ${i + 1}`,
          location: `Location ${i + 1}`,
          startTime,
          endTime,
          capacity: 50,
          totalPoints,
          pointsRemain: totalPoints,
          isPublished: i < 3, // Some published, some not
          managerId: users[(i % 2) + 1].id, // Assign to manager or cashier
        },
      });
    })
  );

  console.log(`Created ${events.length} events`);

  // Create organizers for events
  console.log("Creating event organizers...");
  const organizers = await Promise.all(
    events.flatMap((event) =>
      // Add 2 random regular users as organizers for each event
      [3, 4].map((userIndex) =>
        prisma.organizer.create({
          data: {
            eventId: event.id,
            userId: users[userIndex].id,
          },
        })
      )
    )
  );

  console.log(`Created ${organizers.length} event organizers`);

  // Create RSVPs
  console.log("Creating RSVPs...");
  const rsvps = await Promise.all(
    events.flatMap((event) =>
      // Add some regular users as attendees
      [5, 6, 7, 8, 9].map((userIndex) =>
        prisma.rSVP.create({
          data: {
            eventId: event.id,
            userId: users[userIndex].id,
            confirmed: userIndex % 2 === 0, // Some confirmed, some not
          },
        })
      )
    )
  );

  console.log(`Created ${rsvps.length} RSVPs`);

  // Create promotions
  console.log("Creating promotions...");
  const promotions = await Promise.all(
    Array.from({ length: 5 }, (_, i) => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 5 + i); // Spread over time

      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 10 + i * 5); // Different end dates

      return prisma.promotion.create({
        data: {
          name: `Promotion ${i + 1}`,
          description: `Description for promotion ${i + 1}`,
          type: i % 2 === 0 ? PromotionType.AUTOMATIC : PromotionType.ONE_TIME,
          startTime,
          endTime,
          minSpend: i * 5 + 10,
          rate: i % 2 === 0 ? 0.1 * (i + 1) : null,
          points: i % 2 !== 0 ? 50 * (i + 1) : null,
          managerId: users[1].id, // Manager creates all promotions
        },
      });
    })
  );

  console.log(`Created ${promotions.length} promotions`);

  // Create transactions
  console.log("Creating transactions...");

  // Helper to create transactions of each type
  const createTransactionsOfType = async (type, count, options = {}) => {
    const transactions = [];
    for (let i = 0; i < count; i++) {
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const points = Math.floor(Math.random() * 100) + 10;
      let data = {
        userId,
        type,
        points: type === TransactionType.REDEMPTION ? -points : points,
        status: [
          TransactionStatus.PENDING,
          TransactionStatus.APPROVED,
          TransactionStatus.REJECTED,
        ][Math.floor(Math.random() * 3)],
        needsVerification: Math.random() > 0.5,
        remark: `${type} transaction ${i + 1}`,
      };

      // For some transactions, add a cashier
      if (Math.random() > 0.3) {
        data.processedBy = users[2].id; // Cashier
      }

      // For PURCHASE, add spent amount
      if (type === TransactionType.PURCHASE) {
        data.spent = points * 0.5;
      }

      // Create the transaction
      const transaction = await prisma.transaction.create({ data });
      transactions.push(transaction);

      // For some transactions, add promotion use
      if (type === TransactionType.PURCHASE && i % 3 === 0) {
        const promoId =
          promotions[Math.floor(Math.random() * promotions.length)].id;
        try {
          await prisma.promotionUse.create({
            data: {
              userId,
              promotionId: promoId,
              transactionId: transaction.id,
            },
          });
        } catch (e) {
          // Skip if unique constraint fails
          console.log("Skipping duplicate promotion use");
        }
      }
    }
    return transactions;
  };

  // Create 6-7 transactions of each type to get 30+ total
  const purchaseTransactions = await createTransactionsOfType(
    TransactionType.PURCHASE,
    7
  );
  const adjustmentTransactions = await createTransactionsOfType(
    TransactionType.ADJUSTMENT,
    6
  );
  const redemptionTransactions = await createTransactionsOfType(
    TransactionType.REDEMPTION,
    6
  );
  const transferTransactions = await createTransactionsOfType(
    TransactionType.TRANSFER,
    6
  );
  const eventTransactions = await createTransactionsOfType(
    TransactionType.EVENT,
    6
  );

  const totalTransactions =
    purchaseTransactions.length +
    adjustmentTransactions.length +
    redemptionTransactions.length +
    transferTransactions.length +
    eventTransactions.length;

  console.log(`Created ${totalTransactions} transactions`);

  // Create transfers
  console.log("Creating transfers...");
  const transfers = await Promise.all(
    Array.from({ length: 5 }, async (_, i) => {
      const senderIndex = 3 + (i % 7); // Use regular users
      const receiverIndex = ((senderIndex + 1) % 7) + 3; // Different regular user

      const transfer = await prisma.transfer.create({
        data: {
          senderId: users[senderIndex].id,
          receiverId: users[receiverIndex].id,
          points: Math.floor(Math.random() * 50) + 10,
        },
      });

      return transfer;
    })
  );

  console.log(`Created ${transfers.length} transfers`);

  console.log("Database seeding completed!");
}

// Run the seed function
seed()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
