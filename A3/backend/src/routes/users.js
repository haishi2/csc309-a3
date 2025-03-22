const express = require("express");
const router = express.Router();
const { PrismaClient, Role } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const { authenticate, requireClearance, upload } = require("../middleware");
const { activationTokens } = require("./auth");
const { validatePassword, sendResult } = require("../utils");
const { roles } = require("../config");

router
  .route("/")
  .post(authenticate, requireClearance("CASHIER"), async (req, res) => {
    const { utorid, name, email } = req.body;

    if (typeof utorid !== "string" || !/^[a-zA-Z0-9]{8}$/.test(utorid)) {
      return sendResult(res, 400, {
        error: "utorid must be an 8-character alphanumeric string",
      });
    }
    if (typeof name !== "string" || name.length < 1 || name.length > 50) {
      return sendResult(res, 400, {
        error: "name must be a string between 1-50 characters",
      });
    }
    if (typeof email !== "string" || !email.endsWith("@mail.utoronto.ca")) {
      return sendResult(res, 400, {
        error: "email must be a valid University of Toronto email",
      });
    }

    if (!utorid || !name || !email) {
      return sendResult(res, 400, { error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: utorid }, { email: email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === utorid) {
        return sendResult(res, 409, { error: "User already exists" });
      }
      if (existingUser.email === email) {
        return sendResult(res, 409, { error: "Email already in use" });
      }
    }

    const activationToken = uuidv4();
    const expiration = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    activationTokens.set(activationToken, { utorid, expiration });

    const user = await prisma.user.create({
      data: {
        username: utorid,
        name,
        email,
        password: "default",
        isActivated: false,
        role: Role.REGULAR,
        verifiedStudent: false,
        pointsBalance: 0,
      },
    });

    return sendResult(res, 201, {
      id: user.id,
      utorid,
      name,
      email,
      verified: false,
      expiresAt: expiration,
      resetToken: activationToken,
    });
  })
  .get(authenticate, requireClearance("MANAGER"), async (req, res) => {
    let { name, role, verified, activated, page, limit } = req.query;

    if (page !== null && page !== undefined) {
      page = parseInt(page);
      if (isNaN(page) || page <= 0) {
        return sendResult(res, 400, {
          error: "page must be a positive integer",
        });
      }
    } else {
      page = 1;
    }

    if (limit !== null && limit !== undefined) {
      limit = parseInt(limit);
      if (isNaN(limit) || limit <= 0) {
        return sendResult(res, 400, {
          error: "limit must be a positive integer",
        });
      }
    } else {
      limit = 10;
    }

    if (name !== null && name !== undefined && typeof name !== "string") {
      return sendResult(res, 400, { error: "name must be a string" });
    }

    if (
      role !== null &&
      role !== undefined &&
      !["regular", "cashier", "manager", "superuser"].includes(
        role.toLowerCase()
      )
    ) {
      return sendResult(res, 400, { error: "Invalid role value" });
    }

    if (
      verified !== null &&
      verified !== undefined &&
      !["true", "false"].includes(verified)
    ) {
      return sendResult(res, 400, {
        error: "verified must be 'true' or 'false'",
      });
    }

    if (
      activated !== null &&
      activated !== undefined &&
      !["true", "false"].includes(activated)
    ) {
      return sendResult(res, 400, {
        error: "activated must be 'true' or 'false'",
      });
    }

    const skipTo = (page - 1) * limit;
    const query = {};

    if (name) {
      query.OR = [{ username: { equals: name } }, { name: { equals: name } }];
    }

    if (role) {
      query.role = Role[role.toUpperCase()];
    }

    if (verified !== null && verified !== undefined) {
      query.verifiedStudent = verified === "true";
    }

    if (activated !== null && activated !== undefined) {
      query.isActivated = activated === "true";
    }

    const [count, users] = await Promise.all([
      prisma.user.count({
        where: query,
      }),
      prisma.user.findMany({
        where: query,
        skip: skipTo,
        take: limit,
      }),
    ]);

    const results = users.map((user) => ({
      id: user.id,
      utorid: user.username,
      name: user.name,
      email: user.email,
      birthday: user.birthday || null,
      role: user.role.toLowerCase(),
      points: user.pointsBalance,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : "",
      verified: user.verifiedStudent,
      avatarUrl: user.avatarUrl || null,
    }));

    const totalPages = Math.ceil(count / limit);

    return sendResult(res, 200, {
      count,
      results,
      page,
      totalPages,
      limit,
    });
  });

router
  .route("/me")
  .get(authenticate, requireClearance("REGULAR"), async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return sendResult(res, 404, { error: "User not found" });
    return sendResult(res, 200, {
      id: user.id,
      utorid: user.username,
      name: user.name,
      email: user.email,
      birthday: user.birthday || null,
      role: user.role.toLowerCase(),
      points: user.pointsBalance,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : "",
      verified: user.verifiedStudent,
      avatarUrl: user.avatarUrl || null,
      promotions:
        user.promotions && user.promotions.length > 0
          ? user.promotions.map((p) => ({
              id: p.id,
              name: p.name,
              minSpend: p.minSpend || null,
              rate: p.rate || null,
              points: p.points,
            }))
          : [],
    });
  })
  .patch(
    authenticate,
    requireClearance("REGULAR"),
    upload.single("avatar"),
    async (req, res) => {
      const { name, email, birthday } = req.body;

      if (name !== null && name !== undefined) {
        if (typeof name !== "string" || name.length < 1 || name.length > 50) {
          return sendResult(res, 400, {
            error: "name must be a string between 1-50 characters",
          });
        }
      }

      if (email !== null && email !== undefined) {
        if (typeof email !== "string" || !email.endsWith("@mail.utoronto.ca")) {
          return sendResult(res, 400, {
            error: "email must be a valid University of Toronto email",
          });
        }
      }

      if (birthday !== null && birthday !== undefined) {
        if (
          typeof birthday !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(birthday)
        ) {
          return sendResult(res, 400, {
            error: "birthday must be in YYYY-MM-DD format",
          });
        }
        const [yearStr, monthStr, dayStr] = birthday.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const day = parseInt(dayStr);

        if (month < 1 || month > 12 || day < 1 || day > 31) {
          return sendResult(res, 400, { error: "invalid date" });
        }

        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          return sendResult(res, 400, { error: "invalid date" });
        }
      }

      const updateData = {};

      if (name !== null && name !== undefined) updateData.name = name;
      if (email !== null && email !== undefined) updateData.email = email;
      if (birthday !== null && birthday !== undefined)
        updateData.birthday = birthday;

      if (req.file) {
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        updateData.avatarUrl = avatarUrl;
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
      });

      if (Object.keys(updateData).length === 0) {
        return sendResult(res, 400, { error: "No fields to update" });
      }

      return sendResult(res, 200, {
        id: updatedUser.id,
        utorid: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        birthday: updatedUser.birthday || null,
        role: updatedUser.role.toLowerCase(),
        points: updatedUser.pointsBalance,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
          ? updatedUser.lastLogin.toISOString()
          : "",
        verified: updatedUser.verifiedStudent,
        avatarUrl: updatedUser.avatarUrl || null,
      });
    }
  );

router.patch(
  "/me/password",
  authenticate,
  requireClearance("REGULAR"),
  async (req, res) => {
    const { old, new: newPassword } = req.body;

    if (old === null || newPassword === null) {
      return sendResult(res, 400, { error: "Missing fields" });
    }

    if (typeof old !== "string") {
      return sendResult(res, 400, { error: "old password must be a string" });
    }

    if (typeof newPassword !== "string") {
      return sendResult(res, 400, { error: "new password must be a string" });
    }

    if (!old || !newPassword) {
      return sendResult(res, 400, { error: "Passwords cannot be empty" });
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      return sendResult(res, 400, { error: validationError });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.password !== old) {
      return sendResult(res, 403, { error: "Incorrect current password" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: newPassword },
    });

    return sendResult(res, 200, { message: "Password updated successfully" });
  }
);

router
  .route("/:userId")
  .get(authenticate, requireClearance("CASHIER"), async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId) || userId <= 0)
      return sendResult(res, 400, { error: "Invalid user id" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        promotionUses: {
          select: { promotionId: true },
        },
      },
    });

    if (!user) return sendResult(res, 404, { error: "User not found" });

    const now = new Date();
    const availablePromotions = await prisma.promotion.findMany({
      where: {
        type: "ONE_TIME",
        startTime: { lte: now },
        endTime: { gt: now },
        id: {
          notIn: user.promotionUses.map((use) => use.promotionId),
        },
      },
    });

    if (roles[req.user.role] >= roles["MANAGER"]) {
      return sendResult(res, 200, {
        id: user.id,
        utorid: user.username,
        name: user.name,
        email: user.email,
        birthday: user.birthday || null,
        role: user.role.toLowerCase(),
        points: user.pointsBalance,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : "",
        verified: user.verifiedStudent,
        avatarUrl: user.avatarUrl || null,
        promotions: availablePromotions.map((promotion) => ({
          id: promotion.id,
          name: promotion.name,
          description: promotion.description || null,
          minSpend: promotion.minSpend || null,
          rate: promotion.rate || null,
          points: promotion.points,
        })),
      });
    } else if (roles[req.user.role] >= roles["CASHIER"]) {
      return sendResult(res, 200, {
        id: user.id,
        utorid: user.username,
        name: user.name,
        points: user.pointsBalance,
        verified: user.verifiedStudent,
        promotions: availablePromotions.map((promotion) => ({
          id: promotion.id,
          name: promotion.name,
          minSpend: promotion.minSpend || null,
          rate: promotion.rate || null,
          points: promotion.points,
        })),
      });
    }
  })
  .patch(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId) || userId <= 0)
      return sendResult(res, 400, { error: "Invalid user id" });

    const { email, verified, suspicious, role } = req.body;
    const updateData = {};

    if (email !== null && email !== undefined) {
      if (typeof email !== "string" || !email.endsWith("@mail.utoronto.ca")) {
        return sendResult(res, 400, {
          error: "email must be a valid University of Toronto email",
        });
      }
      updateData.email = email;
    }

    if (verified !== null && verified !== undefined) {
      if (typeof verified !== "boolean") {
        return sendResult(res, 400, { error: "verified must be a boolean" });
      }
      if (verified !== true) {
        return sendResult(res, 400, {
          error: "verified can only be true",
        });
      }
      updateData.verifiedStudent = verified;
    }
    if (suspicious !== null && suspicious !== undefined) {
      if (typeof suspicious !== "boolean") {
        return sendResult(res, 400, { error: "suspicious must be a boolean" });
      }
    }

    if (role !== null && role !== undefined) {
      if (typeof role !== "string") {
        return sendResult(res, 400, { error: "role must be a string" });
      }
      const validRoles = ["regular", "cashier", "manager", "superuser"];
      if (!validRoles.includes(role)) {
        return sendResult(res, 400, { error: "Invalid role value" });
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendResult(res, 404, { error: "User not found" });

    if (email !== null && email !== undefined) updateData.email = email;
    if (verified !== null && verified !== undefined)
      updateData.verifiedStudent = verified;
    if (suspicious !== null && suspicious !== undefined)
      updateData.isSuspicious = suspicious;

    if (role !== null && role !== undefined) {
      if (req.user.role === "SUPERUSER") {
        updateData.role = Role[role.toUpperCase()];
      } else if (req.user.role === "MANAGER") {
        if (role === "superuser" || role === "manager") {
          return sendResult(res, 403, {
            error: "Managers cannot update these roles",
          });
        }
        updateData.role = Role[role.toUpperCase()];
      }
      if (user.role !== Role.CASHIER && role.toUpperCase() === "CASHIER") {
        updateData.isSuspicious = false;
      }
    }

    const response = {
      id: user.id,
      utorid: user.username,
      name: user.name,
    };

    if (Object.keys(updateData).length === 0) {
      return sendResult(res, 400, { error: "No fields to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (email !== null && email !== undefined)
      response.email = updatedUser.email;
    if (verified !== null && verified !== undefined)
      response.verified = updatedUser.verifiedStudent;
    if (suspicious !== null && suspicious !== undefined)
      response.suspicious = updatedUser.isSuspicious;
    if (role !== null && role !== undefined)
      response.role = updatedUser.role.toLowerCase();

    return sendResult(res, 200, response);
  });

router
  .route("/me/transactions")
  .post(authenticate, requireClearance("REGULAR"), async (req, res) => {
    const { type, amount, remark } = req.body;

    if (type !== "redemption") {
      return sendResult(res, 400, { error: "type must be 'redemption'" });
    }

    if (
      !amount ||
      typeof amount !== "number" ||
      amount <= 0 ||
      !Number.isInteger(amount)
    ) {
      return sendResult(res, 400, {
        error: "amount must be a positive integer",
      });
    }

    if (remark !== null && remark !== undefined && typeof remark !== "string") {
      return sendResult(res, 400, { error: "remark must be a string" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.verifiedStudent) {
      return sendResult(res, 403, { error: "User must be verified" });
    }

    if (user.pointsBalance < amount) {
      return sendResult(res, 400, { error: "Insufficient points balance" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        type: "REDEMPTION",
        points: amount,
        status: "PENDING",
        remark: remark || "",
      },
      include: {
        user: true,
      },
    });

    sendResult(res, 201, {
      id: transaction.id,
      utorid: transaction.user.username,
      type: "redemption",
      processedBy: null,
      amount: amount,
      remark: remark || "",
      createdBy: transaction.user.username,
    });
  })
  .get(authenticate, requireClearance("REGULAR"), async (req, res) => {
    let { type, relatedId, promotionId, amount, operator, page, limit } =
      req.query;

    if (page !== null && page !== undefined) {
      page = parseInt(page);
      if (isNaN(page) || page <= 0) {
        return sendResult(res, 400, {
          error: "page must be a positive integer",
        });
      }
    } else {
      page = 1;
    }

    if (limit !== null && limit !== undefined) {
      limit = parseInt(limit);
      if (isNaN(limit) || limit <= 0) {
        return sendResult(res, 400, {
          error: "limit must be a positive integer",
        });
      }
    } else {
      limit = 10;
    }

    const query = {
      userId: req.user.id,
    };

    if (type) {
      query.type = type.toUpperCase();
    }

    if (relatedId) {
      if (!type) {
        return sendResult(res, 400, {
          error: "relatedId must be used with type",
        });
      }
      query.relatedId = parseInt(relatedId);
    }

    if (promotionId) {
      query.promotionUses = {
        some: {
          promotionId: parseInt(promotionId),
        },
      };
    }

    if (amount) {
      if (!operator) {
        return sendResult(res, 400, {
          error: "amount must be used with operator",
        });
      }

      amount = parseInt(amount);
      if (isNaN(amount)) {
        return sendResult(res, 400, { error: "amount must be a number" });
      }

      if (operator === "gte") {
        query.points = { gte: amount };
      } else if (operator === "lte") {
        query.points = { lte: amount };
      } else {
        return sendResult(res, 400, {
          error: "operator must be 'gte' or 'lte'",
        });
      }
    }

    const skip = (page - 1) * limit;

    const [count, transactions] = await Promise.all([
      prisma.transaction.count({ where: query }),
      prisma.transaction.findMany({
        where: query,
        skip,
        take: limit,
        include: {
          processor: true,
          promotionUses: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
    ]);

    const results = transactions.map((t) => {
      const result = {
        id: t.id,
        type: t.type.toLowerCase(),
        remark: t.remark || "",
      };

      if (t.type.toUpperCase() === "PURCHASE") {
        result.utorid = t.user.username;
        result.amount = t.spent;
        result.spent = t.spent;
        result.promotionIds = t.promotionUses.map((pu) => pu.promotionId);
        result.suspicious = t.needsVerification;
        result.createBy = t.processor?.username;
      } else if (t.type.toUpperCase() === "ADJUSTMENT") {
        result.utorid = t.user.username;
        result.amount = t.points;
        result.relatedId = t.relatedId;
        result.promotionIds = t.promotionUses.map((pu) => pu.promotionId);
        result.suspicious = t.needsVerification;
        result.createBy = t.processor?.username;
      } else if (t.type.toUpperCase() === "REDEMPTION") {
        result.utorid = t.user.username;
        result.amount = t.points;
        result.relatedId = t.relatedId;
        result.promotionIds = t.promotionUses.map((pu) => pu.promotionId);
        result.redeemed = -t.points;
        result.createBy = t.processor?.username;
      } else if (t.type.toUpperCase() === "TRANSFER") {
        result.amount = t.points;
        result.relatedId = t.relatedId;
      } else if (t.type.toUpperCase() === "EVENT") {
        result.awarded = t.points;
        result.relatedId = t.relatedId;
        result.createdBy = t.processor?.username;
      }

      return result;
    });

    sendResult(res, 200, { count, results });
  });

router
  .route("/:userId/transactions")
  .post(authenticate, requireClearance("REGULAR"), async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { type, amount, remark } = req.body;

    if (isNaN(userId) || userId <= 0) {
      return sendResult(res, 400, { error: "Invalid user id" });
    }

    if (type !== "transfer") {
      return sendResult(res, 400, { error: "type must be 'transfer'" });
    }

    if (
      !amount ||
      typeof amount !== "number" ||
      amount <= 0 ||
      !Number.isInteger(amount)
    ) {
      return sendResult(res, 400, {
        error: "amount must be a positive integer",
      });
    }

    if (remark !== null && remark !== undefined && typeof remark !== "string") {
      return sendResult(res, 400, { error: "remark must be a string" });
    }

    const sender = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!sender.verifiedStudent) {
      return sendResult(res, 403, { error: "Sender must be verified" });
    }

    if (sender.pointsBalance < amount) {
      return sendResult(res, 400, { error: "Insufficient points balance" });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!recipient) {
      return sendResult(res, 404, { error: "Recipient not found" });
    }

    const [transfer, senderTransaction, recipientTransaction] =
      await prisma.$transaction([
        prisma.transfer.create({
          data: {
            senderId: req.user.id,
            receiverId: userId,
            points: amount,
          },
        }),
        prisma.transaction.create({
          data: {
            userId: req.user.id,
            type: "TRANSFER",
            points: -amount,
            status: "APPROVED",
            relatedId: userId,
            remark: remark || "",
          },
          include: {
            user: true,
          },
        }),
        prisma.transaction.create({
          data: {
            userId: userId,
            type: "TRANSFER",
            points: amount,
            status: "APPROVED",
            relatedId: req.user.id,
            remark: remark || "",
          },
        }),
        prisma.user.update({
          where: { id: req.user.id },
          data: {
            pointsBalance: {
              decrement: amount,
            },
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            pointsBalance: {
              increment: amount,
            },
          },
        }),
      ]);

    sendResult(res, 201, {
      id: senderTransaction.id,
      sender: senderTransaction.user.username,
      recipient: recipient.username,
      type: "transfer",
      sent: amount,
      remark: remark || "",
      createdBy: senderTransaction.user.username,
    });
  });

module.exports = router;
