"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSuperUser() {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error("Usage: node prisma/createsu.js utorid email password");
    process.exit(1);
  }

  const [utorid, email, password] = args;

  try {
    const existingSuperUser = await prisma.user.findUnique({
      where: { username: utorid },
    });
    if (existingSuperUser) {
      console.error(`User with utorid "${utorid}" already exists.`);
      process.exit(1);
    }

    const superuser = await prisma.user.create({
      data: {
        username: utorid,
        name: utorid,
        email: email,
        password: password,
        isActivated: true,
        verifiedStudent: true,
        role: "SUPERUSER",
        verifiedStudent: true,
        pointsBalance: 0,
      },
    });
  } catch (error) {
    console.error("Error creating superuser:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperUser();
