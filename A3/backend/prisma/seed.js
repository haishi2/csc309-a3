"use strict";

const { PrismaClient, Role, TransactionType, TransactionStatus, PromotionType } = require("@prisma/client");
const fs = require('fs');
const path = require('path');

// Create a logger that writes to both console and a log file
const logFilePath = path.join(__dirname, 'seed-log.txt');
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - INFO: ${message}`;
    console.log(logMessage);
    fs.appendFileSync(logFilePath, logMessage + '\n');
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    let logMessage = `${timestamp} - ERROR: ${message}`;
    
    if (error) {
      logMessage += `\n${error.stack || error.message || error}`;
      if (error.meta) {
        logMessage += `\nMeta: ${JSON.stringify(error.meta)}`;
      }
    }
    
    console.error(logMessage);
    fs.appendFileSync(logFilePath, logMessage + '\n');
  }
};

// Create a new log file
fs.writeFileSync(logFilePath, `=== Seed Log Started at ${new Date().toISOString()} ===\n`);

// Initialize Prisma client with query logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log all queries
prisma.$on('query', (e) => {
  logger.log(`Query: ${e.query}`);
  logger.log(`Params: ${e.params}`);
  logger.log(`Duration: ${e.duration}ms`);
});

// Log all errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

// Log info messages
prisma.$on('info', (e) => {
  logger.log(`Prisma Info: ${e.message}`);
});

// Log warning messages
prisma.$on('warn', (e) => {
  logger.log(`Prisma Warning: ${e.message}`);
});

async function seed() {
  logger.log("Starting database seeding...");
  
  try {
    // Clear existing data
    logger.log("Clearing existing data...");
    await prisma.promotionUse.deleteMany({});
    await prisma.promotion.deleteMany({});
    await prisma.rSVP.deleteMany({});
    await prisma.organizer.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.transfer.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.user.deleteMany({});
    
    logger.log("Creating users one by one to identify problematic user...");
    
    // Create users one at a time to identify which one causes problems
    const users = [];
    
    try {
      // Superuser
      logger.log("Creating superuser...");
      const user1 = await prisma.user.create({
        data: {
          username: "sarahlee",
          email: "sarahlee@mail.utoronto.ca",
          password: "123456aA!",
          name: "Sarah Lee",
          isActivated: true,
          role: Role.SUPERUSER,
          verifiedStudent: true,
          pointsBalance: 1000,
          birthday: "1990-01-01"
        }
      });
      users.push(user1);
      logger.log(`Created superuser: ${user1.username}, ID: ${user1.id}`);
    } catch (error) {
      logger.error("Error creating superuser:", error);
      throw error;
    }
    
    try {
      // Manager
      logger.log("Creating manager...");
      const user2 = await prisma.user.create({
        data: {
          username: "mikejohn",
          email: "mikejohn@mail.utoronto.ca",
          password: "123456aA!",
          name: "Mike Johnson",
          isActivated: true,
          role: Role.MANAGER,
          verifiedStudent: true,
          pointsBalance: 500,
          birthday: "1991-01-01"
        }
      });
      users.push(user2);
      logger.log(`Created manager: ${user2.username}, ID: ${user2.id}`);
    } catch (error) {
      logger.error("Error creating manager:", error);
      throw error;
    }
    
    try {
      // Cashier
      logger.log("Creating cashier...");
      const user3 = await prisma.user.create({
        data: {
          username: "amysmith",
          email: "amysmith@mail.utoronto.ca",
          password: "123456aA!",
          name: "Amy Smith",
          isActivated: true,
          role: Role.CASHIER,
          verifiedStudent: true,
          pointsBalance: 300,
          birthday: "1992-01-01"
        }
      });
      users.push(user3);
      logger.log(`Created cashier: ${user3.username}, ID: ${user3.id}`);
    } catch (error) {
      logger.error("Error creating cashier:", error);
      throw error;
    }
    
    // Regular users
    const regularUsers = [
      {
        username: "johndoe1",
        email: "johndoe1@mail.utoronto.ca",
        name: "John Doe",
        birthday: "1993-01-01",
        pointsBalance: 100
      },
      {
        username: "emilywu2",
        email: "emilywu2@mail.utoronto.ca",
        name: "Emily Wu",
        birthday: "1994-01-01",
        pointsBalance: 200
      },
      {
        username: "alexng12",
        email: "alexng12@mail.utoronto.ca",
        name: "Alex Ng",
        birthday: "1995-01-01",
        pointsBalance: 300
      },
      {
        username: "juliakim",
        email: "juliakim@mail.utoronto.ca",
        name: "Julia Kim",
        birthday: "1996-01-01",
        pointsBalance: 400
      },
      {
        username: "ryanpark",
        email: "ryanpark@mail.utoronto.ca",
        name: "Ryan Park",
        birthday: "1997-01-01",
        pointsBalance: 500
      },
      {
        username: "liachen",
        email: "liachen@mail.utoronto.ca",
        name: "Lia Chen",
        birthday: "1998-01-01",
        pointsBalance: 600,
        verifiedStudent: false
      },
      {
        username: "davidlee",
        email: "davidlee@mail.utoronto.ca",
        name: "David Lee",
        birthday: "1999-01-01",
        pointsBalance: 700,
        verifiedStudent: false
      }
    ];
    
    // Create each regular user one at a time and catch errors individually
    for (let i = 0; i < regularUsers.length; i++) {
      const userData = regularUsers[i];
      logger.log(`Creating regular user: ${userData.username}...`);
      try {
        const user = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: "123456aA!",
            name: userData.name,
            isActivated: true,
            role: Role.REGULAR,
            verifiedStudent: userData.verifiedStudent !== false,
            pointsBalance: userData.pointsBalance,
            birthday: userData.birthday
          }
        });
        users.push(user);
        logger.log(`Created regular user: ${user.username}, ID: ${user.id}`);
      } catch (error) {
        logger.error(`Error creating user ${userData.username}:`, error);
        // Continue with other users instead of stopping the whole process
      }
    }
    
    logger.log(`Created ${users.length} users`);
    logger.log(`User IDs: ${users.map(u => u.id).join(', ')}`);
    
    if (users.length < 3) {
      logger.error("Not enough users created. Stopping seed process.");
      return;
    }
    
    // Create events with simplified descriptions
    logger.log("Creating events...");
    const events = [];
    
    for (let i = 0; i < 5; i++) {
      try {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + (i * 7)); // Each event one week apart
        
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 3); // 3 hour events
        
        const totalPoints = 1000;
        
        const managerIndex = i % 2 + 1;
        
        // Only use valid indices
        if (managerIndex < users.length) {
          logger.log(`Creating event with manager ID: ${users[managerIndex].id}`);
          const event = await prisma.event.create({
            data: {
              name: `Event ${i+1}`,
              description: `Description for event ${i+1}`,
              location: `Location ${i+1}`,
              startTime,
              endTime,
              capacity: 50,
              totalPoints,
              pointsRemain: totalPoints,
              isPublished: i < 3, // Some published, some not
              managerId: users[managerIndex].id
            }
          });
          events.push(event);
          logger.log(`Created event: ${event.name}, ID: ${event.id}`);
        } else {
          logger.error(`Skipping event ${i+1} - manager index ${managerIndex} is out of bounds.`);
        }
      } catch (error) {
        logger.error(`Error creating event ${i+1}:`, error);
      }
    }
    
    logger.log(`Created ${events.length} events`);
    
    if (events.length === 0) {
      logger.error("No events created. Stopping seed process.");
      return;
    }
    
    // Create organizers for events
    logger.log("Creating event organizers...");
    const organizers = [];
    
    logger.log(`Available users: ${users.length}, Available events: ${events.length}`);
    logger.log(`User IDs: ${users.map(u => u.id).join(', ')}`);
    
    for (const event of events) {
      // Find regular users starting from index 3 if available
      const regularUserIndices = users.filter((_, idx) => idx >= 3).map((_, idx) => idx + 3);
      logger.log(`Regular user indices available: ${regularUserIndices.join(', ')}`);
      
      // Only use indices that are actually in the users array
      const validUserIndices = regularUserIndices.filter(idx => idx < users.length);
      logger.log(`Valid user indices: ${validUserIndices.join(', ')}`);
      
      // Take at most 2 users if available
      const organizerIndices = validUserIndices.slice(0, 2);
      logger.log(`Using organizer indices: ${organizerIndices.join(', ')}`);
      
      for (const userIndex of organizerIndices) {
        try {
          logger.log(`Creating organizer with event ID: ${event.id}, user ID: ${users[userIndex].id}`);
          const organizer = await prisma.organizer.create({
            data: {
              eventId: event.id,
              userId: users[userIndex].id
            }
          });
          organizers.push(organizer);
          logger.log(`Created organizer for event ${event.id}, user ${users[userIndex].id}`);
        } catch (error) {
          logger.error(`Error creating organizer for event ${event.id}, user index ${userIndex}:`, error);
        }
      }
    }
    
    logger.log(`Created ${organizers.length} event organizers`);
    
    // Create RSVPs
    logger.log("Creating RSVPs...");
    const rsvps = [];
    
    for (const event of events) {
      // Find regular users starting from index 5 if available
      const regularUserIndices = users.filter((_, idx) => idx >= 5).map((_, idx) => idx + 5);
      logger.log(`Regular user indices available for RSVPs: ${regularUserIndices.join(', ')}`);
      
      // Only use indices that are actually in the users array
      const validUserIndices = regularUserIndices.filter(idx => idx < users.length);
      logger.log(`Valid user indices for RSVPs: ${validUserIndices.join(', ')}`);
      
      // Take at most 5 users if available
      const rsvpUserIndices = validUserIndices.slice(0, 5);
      logger.log(`Using RSVP user indices: ${rsvpUserIndices.join(', ')}`);
      
      for (const userIndex of rsvpUserIndices) {
        try {
          logger.log(`Creating RSVP with event ID: ${event.id}, user ID: ${users[userIndex].id}`);
          const rsvp = await prisma.rSVP.create({
            data: {
              eventId: event.id,
              userId: users[userIndex].id,
              confirmed: userIndex % 2 === 0 // Some confirmed, some not
            }
          });
          rsvps.push(rsvp);
          logger.log(`Created RSVP for event ${event.id}, user ${users[userIndex].id}`);
        } catch (error) {
          logger.error(`Error creating RSVP for event ${event.id}, user index ${userIndex}:`, error);
        }
      }
    }
    
    logger.log(`Created ${rsvps.length} RSVPs`);
    
    // Create promotions with simplified data
    logger.log("Creating promotions...");
    const promotions = [];
    
    // Make sure we have a manager to create promotions
    if (users.length > 1) {
      for (let i = 0; i < 5; i++) {
        try {
          const startTime = new Date();
          startTime.setDate(startTime.getDate() - 5 + i); // Spread over time
          
          const endTime = new Date();
          endTime.setDate(endTime.getDate() + 10 + i * 5); // Different end dates
          
          logger.log(`Creating promotion with manager ID: ${users[1].id}`);
          const promotion = await prisma.promotion.create({
            data: {
              name: `Promo ${i+1}`,
              description: `Description for promo ${i+1}`,
              type: i % 2 === 0 ? PromotionType.AUTOMATIC : PromotionType.ONE_TIME,
              startTime,
              endTime,
              minSpend: i * 5 + 10,
              rate: i % 2 === 0 ? 0.1 * (i+1) : null,
              points: i % 2 !== 0 ? 50 * (i+1) : null,
              managerId: users[1].id // Manager creates all promotions
            }
          });
          promotions.push(promotion);
          logger.log(`Created promotion: ${promotion.name}, ID: ${promotion.id}`);
        } catch (error) {
          logger.error(`Error creating promotion ${i+1}:`, error);
        }
      }
    } else {
      logger.error("Cannot create promotions: No manager user available");
    }
    
    logger.log(`Created ${promotions.length} promotions`);
    
    // Create transactions
    logger.log("Creating transactions...");
    
    // Helper to create transactions of each type
    const createTransactionsOfType = async (type, count) => {
      const transactions = [];
      for (let i = 0; i < count; i++) {
        try {
          if (users.length === 0) {
            logger.error(`Cannot create ${type} transaction: No users available`);
            continue;
          }
          
          const userIndex = Math.floor(Math.random() * users.length);
          const userId = users[userIndex].id;
          const points = Math.floor(Math.random() * 100) + 10;
          let data = {
            userId,
            type,
            points: type === TransactionType.REDEMPTION ? -points : points,
            status: [TransactionStatus.PENDING, TransactionStatus.APPROVED, TransactionStatus.REJECTED][Math.floor(Math.random() * 3)],
            needsVerification: Math.random() > 0.5,
            remark: `${type} ${i+1}`,
          };
          
          // For some transactions, add a cashier if available
          if (Math.random() > 0.3 && users.length > 2) {
            data.processedBy = users[2].id; // Cashier
            logger.log(`Adding processor ID: ${users[2].id} to transaction`);
          }
          
          // For PURCHASE, add spent amount
          if (type === TransactionType.PURCHASE) {
            data.spent = points * 0.5;
          }
          
          // Create the transaction
          logger.log(`Creating ${type} transaction for user ID: ${userId}`);
          const transaction = await prisma.transaction.create({ data });
          transactions.push(transaction);
          logger.log(`Created ${type} transaction #${i+1} for user ${userId}, ID: ${transaction.id}`);
          
          // For some transactions, add promotion use if promotions exist
          if (type === TransactionType.PURCHASE && i % 3 === 0 && promotions.length > 0) {
            const promoId = promotions[Math.floor(Math.random() * promotions.length)].id;
            try {
              logger.log(`Creating promotion use with promotion ID: ${promoId}, transaction ID: ${transaction.id}`);
              const promoUse = await prisma.promotionUse.create({
                data: {
                  userId,
                  promotionId: promoId,
                  transactionId: transaction.id
                }
              });
              logger.log(`Created promotion use for transaction ${transaction.id}, promotion ${promoId}`);
            } catch (e) {
              // Skip if unique constraint fails
              logger.error(`Error creating promotion use for transaction ${transaction.id}:`, e);
            }
          }
        } catch (error) {
          logger.error(`Error creating ${type} transaction #${i+1}:`, error);
        }
      }
      return transactions;
    };
    
    // Create 6-7 transactions of each type to get 30+ total
    logger.log("Creating PURCHASE transactions...");
    const purchaseTransactions = await createTransactionsOfType(TransactionType.PURCHASE, 7);
    
    logger.log("Creating ADJUSTMENT transactions...");
    const adjustmentTransactions = await createTransactionsOfType(TransactionType.ADJUSTMENT, 6);
    
    logger.log("Creating REDEMPTION transactions...");
    const redemptionTransactions = await createTransactionsOfType(TransactionType.REDEMPTION, 6);
    
    logger.log("Creating TRANSFER transactions...");
    const transferTransactions = await createTransactionsOfType(TransactionType.TRANSFER, 6);
    
    logger.log("Creating EVENT transactions...");
    const eventTransactions = await createTransactionsOfType(TransactionType.EVENT, 6);
    
    const totalTransactions = purchaseTransactions.length + 
                            adjustmentTransactions.length + 
                            redemptionTransactions.length + 
                            transferTransactions.length +
                            eventTransactions.length;
    
    logger.log(`Created ${totalTransactions} transactions total`);
    
    // Create transfers
    logger.log("Creating transfers...");
    const transfers = [];
    
    if (users.length >= 5) { // Only create transfers if we have enough users
      for (let i = 0; i < 5; i++) {
        try {
          // Calculate indices within the available range
          const maxRegularUserIndex = users.length - 1;
          const minRegularUserIndex = 3; // Start from index 3 (after superuser, manager, cashier)
          
          // Make sure we have regular users to work with
          if (minRegularUserIndex <= maxRegularUserIndex) {
            // Use regular users for transfers, safely within bounds
            const senderIndex = minRegularUserIndex + i % (maxRegularUserIndex - minRegularUserIndex + 1);
            let receiverIndex = minRegularUserIndex + (i + 1) % (maxRegularUserIndex - minRegularUserIndex + 1);
            
            // Make sure sender and receiver are different
            if (receiverIndex === senderIndex) {
              receiverIndex = minRegularUserIndex + (i + 2) % (maxRegularUserIndex - minRegularUserIndex + 1);
            }
            
            logger.log(`Creating transfer from user ID: ${users[senderIndex].id} to user ID: ${users[receiverIndex].id}`);
            const transfer = await prisma.transfer.create({
              data: {
                senderId: users[senderIndex].id,
                receiverId: users[receiverIndex].id,
                points: Math.floor(Math.random() * 50) + 10
              }
            });
            transfers.push(transfer);
            logger.log(`Created transfer from ${users[senderIndex].username} to ${users[receiverIndex].username}, ID: ${transfer.id}`);
          } else {
            logger.error(`Cannot create transfer #${i+1}: Not enough regular users`);
          }
        } catch (error) {
          logger.error(`Error creating transfer #${i+1}:`, error);
        }
      }
    } else {
      logger.error("Cannot create transfers: Not enough users available");
    }
    
    logger.log(`Created ${transfers.length} transfers`);
    
    logger.log("Database seeding completed!");
  } catch (error) {
    logger.error("Error during seeding:", error);
    throw error; // Re-throw to be caught by the outer catch
  }
}

// Run the seed function
seed()
  .catch(e => {
    logger.error("Fatal error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    logger.log("Disconnected from database. Seed process complete.");
  });
