const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { JWT_SECRET } = require("../config");
const { validatePassword, sendResult } = require("../utils");
const { passwordResetRateLimit } = require("../middleware");
const { v4: uuidv4 } = require("uuid");

const resetTokens = new Map();
const activationTokens = new Map();

router.post("/tokens", async (req, res) => {
  console.log(`Recieved a request to: ${req.method} ${req.originalUrl}`);
  console.log(`params: ${JSON.stringify(req.body, null, 2)}`);

  const { utorid, password } = req.body;

  if (!utorid || !password) {
    return sendResult(res, 400, { error: "Missing fields" });
  }

  if (typeof utorid !== "string") {
    return sendResult(res, 400, { error: "utorid must be a string" });
  }

  if (typeof password !== "string") {
    return sendResult(res, 400, { error: "password must be a string" });
  }

  const user = await prisma.user.findUnique({ where: { username: utorid } });
  if (!user || user.password !== password) {
    return sendResult(res, 401, { error: "Incorrect credentials" });
  }

  const expiryDate = new Date(Date.now() + 3600 * 1000).toISOString();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
      isActivated: true,
    },
  });

  const token = jwt.sign(
    {
      id: user.id,
      utorid: user.username,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: 3600 }
  );

  return sendResult(res, 200, { token, expiresAt: expiryDate });
});

router.post("/resets", async (req, res) => {
  console.log(`Recieved a request to: ${req.method} ${req.originalUrl}`);
  console.log(`params: ${JSON.stringify(req.body, null, 2)}`);

  const { utorid } = req.body;

  if (!utorid) {
    return sendResult(res, 400, { error: "utorid is required" });
  }

  if (typeof utorid !== "string") {
    return sendResult(res, 400, { error: "utorid must be a string" });
  }

  const user = await prisma.user.findUnique({ where: { username: utorid } });
  if (!user) return sendResult(res, 404, { error: "User not found" });

  const resetToken = uuidv4();
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 60);

  const expiredTime = new Date(Date.now() - 1000);
  for (const [token, data] of resetTokens.entries()) {
    if (data.utorid === utorid) {
      data.expiresAt = expiredTime;
    }
  }
  for (const [token, data] of activationTokens.entries()) {
    if (data.utorid === utorid) {
      data.expiration = expiredTime;
    }
  }
  resetTokens.set(resetToken, {
    utorid,
    expiresAt: expiryDate,
  });

  passwordResetRateLimit(req, res, () => {
    return sendResult(res, 202, { expiresAt: expiryDate, resetToken });
  });
});

router.post("/resets/:resetToken", async (req, res) => {
  console.log(`Recieved a request to: ${req.method} ${req.originalUrl}`);
  console.log(`params: ${JSON.stringify(req.body, null, 2)}`);
  const { resetToken } = req.params;
  const { utorid, password } = req.body;

  if (!utorid || !password) {
    return sendResult(res, 400, { error: "Missing fields" });
  }

  if (typeof utorid !== "string") {
    return sendResult(res, 400, { error: "utorid must be a string" });
  }

  if (typeof password !== "string") {
    return sendResult(res, 400, { error: "password must be a string" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return sendResult(res, 400, { error: passwordError });
  }

  const tokenData =
    resetTokens.get(resetToken) || activationTokens.get(resetToken);
  if (!tokenData) {
    return sendResult(res, 404, { error: "Token not found" });
  }

  if (tokenData.utorid !== utorid) {
    return sendResult(res, 401, {
      error: "Utorid does not match with token utorid",
    });
  }

  if (
    new Date(tokenData.expiresAt || tokenData.expiration) < new Date(Date.now())
  ) {
    resetTokens.delete(resetToken);
    activationTokens.delete(resetToken);
    return sendResult(res, 410, { error: "Token expired" });
  }

  const user = await prisma.user.findUnique({
    where: { username: utorid },
  });

  if (!user) return sendResult(res, 404, { error: "User not found" });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: password,
    },
  });
  resetTokens.delete(resetToken);
  activationTokens.delete(resetToken);

  return sendResult(res, 200, { message: "Password reset successful" });
});

module.exports = {
  router,
  resetTokens,
  activationTokens,
};
