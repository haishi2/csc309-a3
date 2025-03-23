const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticate, requireClearance } = require("../middleware");
const { sendResult } = require("../utils");

router
  .route("/")
  .post(authenticate, requireClearance("CASHIER"), async (req, res) => {
    const { utorid, type, spent, amount, relatedId, promotionIds, remark } =
      req.body;

    if (!utorid || typeof utorid !== "string") {
      return sendResult(res, 400, { error: "utorid must be a string" });
    }

    if (type === "adjustment") {
      if (req.user.role !== "MANAGER") {
        return sendResult(res, 403, {
          error: "Only managers can make adjustments",
        });
      }

      if (amount === null || amount === undefined || !relatedId) {
        return sendResult(res, 400, { error: "Invalid payload" });
      }

      const relatedTransaction = await prisma.transaction.findUnique({
        where: { id: relatedId },
      });

      if (!relatedTransaction) {
        return sendResult(res, 404, { error: "Transaction not found" });
      }

      const user = await prisma.user.findUnique({
        where: { username: utorid },
      });
      if (!user) return sendResult(res, 404, { error: "User not found" });

      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "ADJUSTMENT",
          points: amount,
          status: "APPROVED",
          relatedId: relatedId,
          remark: remark || "",
          processedBy: req.user.id,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          pointsBalance: {
            increment: amount,
          },
        },
      });

      return sendResult(res, 201, {
        id: transaction.id,
        utorid: user.username,
        amount: amount,
        type: "adjustment",
        relatedId: relatedId,
        remark: remark || "",
        promotionIds: promotionIds || [],
        createdBy: req.user.utorid,
      });
    }

    if (type !== "purchase") {
      return sendResult(res, 400, {
        error: "type must be 'purchase' or 'adjustment'",
      });
    }

    if (
      spent === null ||
      spent === undefined ||
      typeof spent !== "number" ||
      spent < 0
    ) {
      return sendResult(res, 400, {
        error: "spent must be a non-negative number",
      });
    }

    if (promotionIds !== null && promotionIds !== undefined) {
      if (!Array.isArray(promotionIds)) {
        return sendResult(res, 400, { error: "promotionIds must be an array" });
      }
      if (!promotionIds.every((id) => typeof id === "number" && id > 0)) {
        return sendResult(res, 400, {
          error: "all promotion IDs must be positive numbers",
        });
      }
    }

    if (remark !== null && remark !== undefined && typeof remark !== "string") {
      return sendResult(res, 400, { error: "remark must be a string" });
    }

    const user = await prisma.user.findUnique({ where: { username: utorid } });
    if (!user) return sendResult(res, 404, { error: "User not found" });

    const cashier = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    const needsVerification = cashier.isSuspicious;

    let ptsEarned = Math.round(spent * 4);
    let appliedPromotions = [];

    if (promotionIds && promotionIds.length > 0) {
      const promotions = await prisma.promotion.findMany({
        where: {
          id: { in: promotionIds },
        },
      });

      const validPromotions = promotions.filter((p) => {
        const now = new Date();
        now.setMilliseconds(0);
        const startTime = new Date(p.startTime);
        startTime.setMilliseconds(0);
        const endTime = new Date(p.endTime);
        endTime.setMilliseconds(0);
        return startTime <= now && endTime >= now;
      });

      const invalidPromotionIds = promotionIds.filter(
        (id) => !validPromotions.some((p) => p.id === id)
      );
      if (
        validPromotions.length !== promotionIds.length ||
        promotions.length !== promotionIds.length
      ) {
        return sendResult(res, 400, {
          error: `Invalid promotion IDs: ${invalidPromotionIds.join(", ")}`,
        });
      }

      for (const promotion of validPromotions) {
        if (promotion.minSpend && promotion.minSpend > spent) {
          return sendResult(res, 400, {
            error: `Promotion ${promotion.id} minimum spend requirement not met`,
          });
        }

        if (promotion.type === "PERIOD") {
          ptsEarned += Math.round(spent * 100 * (promotion.rate || 0));
          ptsEarned += promotion.points || 0;
          appliedPromotions.push(promotion.id);
        } else if (promotion.type === "ONE_TIME") {
          const used = await prisma.promotionUse.findUnique({
            where: {
              userId_promotionId: {
                userId: user.id,
                promotionId: promotion.id,
              },
            },
          });
          if (!used) {
            ptsEarned += Math.round(spent * 100 * (promotion.rate || 0));
            ptsEarned += promotion.points || 0;
            appliedPromotions.push(promotion.id);
          } else {
            return sendResult(res, 400, {
              error: `One time promotion ${promotion.id} has already been used`,
            });
          }
        }
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "PURCHASE",
        points: ptsEarned,
        status: needsVerification ? "PENDING" : "APPROVED",
        needsVerification: needsVerification,
        spent: spent,
        processedBy: req.user.id,
        remark: remark || "",
      },
    });

    if (appliedPromotions.length > 0) {
      await prisma.promotionUse.createMany({
        data: appliedPromotions.map((promotionId) => ({
          userId: user.id,
          promotionId,
          transactionId: transaction.id,
        })),
      });
    }

    if (!needsVerification) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pointsBalance: {
            increment: ptsEarned,
          },
        },
      });
    }

    const response = {
      id: transaction.id,
      utorid: user.username,
      type: "purchase",
      spent: spent,
      earned: needsVerification ? 0 : ptsEarned,
      remark: remark || "",
      promotionIds: appliedPromotions,
      createdBy: cashier.username,
    };

    return sendResult(res, 201, response);
  })
  .get(authenticate, requireClearance("MANAGER"), async (req, res) => {
    let {
      name,
      createdBy,
      suspicious,
      promotionId,
      type,
      relatedId,
      amount,
      operator,
      page,
      limit,
    } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const query = {};

    if (name) {
      query.OR = [
        { username: { contains: name } },
        { name: { contains: name } },
      ];
    }

    if (createdBy) {
      query.processedBy = createdBy;
    }

    if (suspicious !== null && suspicious !== undefined) {
      query.needsVerification = suspicious;
    }

    if (promotionId) {
      query.promotionUses = {
        some: {
          promotionId: promotionId,
        },
      };
    }

    if (type) {
      query.type = type;
    }

    if (relatedId && type !== "PURCHASE") {
      query.relatedId = relatedId;
    }

    if (relatedId && !type) {
      return sendResult(res, 400, {
        error: "relatedId must be used with type",
      });
    }

    if (amount && !operator) {
      return sendResult(res, 400, {
        error: "amount must be used with operator",
      });
    }

    if (amount && operator) {
      if (operator === "=") {
        query.points = amount;
      } else if (operator === ">") {
        query.points = { gt: amount };
      } else if (operator === "<") {
        query.points = { lt: amount };
      } else if (operator === ">=") {
        query.points = { gte: amount };
      } else if (operator === "<=") {
        query.points = { lte: amount };
      } else {
        return sendResult(res, 400, { error: "Invalid operator" });
      }
    }

    const [count, transactions] = await Promise.all([
      prisma.transaction.count({ where: query }),
      prisma.transaction.findMany({
        where: query,
        skip,
        take: limit,
        include: {
          user: true,
          processor: true,
          promotionUses: true,
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
        result.amount = t.points;
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

    return sendResult(res, 200, { count, results });
  });

router
  .route("/:id")
  .get(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId <= 0) {
      return sendResult(res, 400, { error: "Invalid transaction ID" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parsedId },
      include: {
        user: true,
        processor: true,
        promotionUses: true,
      },
    });
    if (!transaction)
      return sendResult(res, 404, { error: "Transaction not found" });

    const result = {
      id: transaction.id,
      type: transaction.type.toLowerCase(),
      remark: transaction.remark || "",
    };

    if (transaction.type.toUpperCase() === "PURCHASE") {
      result.utorid = transaction.user.username;
      result.amount = transaction.points;
      result.spent = transaction.spent;
      result.promotionIds = transaction.promotionUses.map(
        (pu) => pu.promotionId
      );
      result.suspicious = transaction.needsVerification;
      result.createBy = transaction.processor?.username;
    } else if (transaction.type.toUpperCase() === "ADJUSTMENT") {
      result.utorid = transaction.user.username;
      result.amount = transaction.points;
      result.relatedId = transaction.relatedId;
      result.promotionIds = transaction.promotionUses.map(
        (pu) => pu.promotionId
      );
      result.suspicious = transaction.needsVerification;
      result.createBy = transaction.processor?.username;
    } else if (transaction.type.toUpperCase() === "REDEMPTION") {
      result.utorid = transaction.user.username;
      result.amount = transaction.points;
      result.relatedId = transaction.relatedId;
      result.promotionIds = transaction.promotionUses.map(
        (pu) => pu.promotionId
      );
      result.redeemed = -transaction.points;
      result.createBy = transaction.processor?.username;
    } else if (transaction.type.toUpperCase() === "TRANSFER") {
      result.amount = transaction.points;
      result.relatedId = transaction.relatedId;
      result.createBy = transaction.processor?.username;
    } else if (transaction.type.toUpperCase() === "EVENT") {
      result.awarded = transaction.points;
      result.relatedId = transaction.relatedId;
      result.createdBy = transaction.processor?.username;
    }

    return sendResult(res, 200, result);
  });

router.patch(
  "/:id/suspicious",
  authenticate,
  requireClearance("MANAGER"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return sendResult(res, 400, {
          error: "transaction id must be a positive integer",
        });
      }

      const { suspicious } = req.body;
      if (typeof suspicious !== "boolean") {
        return sendResult(res, 400, { error: "suspicious must be a boolean" });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: true,
          promotionUses: true,
          processor: true,
        },
      });

      if (!transaction) {
        return sendResult(res, 404, { error: "Transaction not found" });
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          needsVerification: suspicious,
        },
        include: {
          promotionUses: {
            include: {
              promotion: true,
            },
          },
          processor: true,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: transaction.userId },
      });

      if (!user) return sendResult(res, 404, { error: "User not found" });

      if (typeof suspicious !== "boolean") {
        return sendResult(res, 400, { error: "suspicious must be a boolean" });
      }

      if (suspicious && !transaction.needsVerification) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            pointsBalance: { increment: -transaction.points },
          },
        });
      } else if (!suspicious && transaction.needsVerification) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            pointsBalance: { increment: transaction.points },
          },
        });
      }

      return sendResult(res, 200, {
        id: updatedTransaction.id,
        utorid: user.username,
        type: updatedTransaction.type,
        spent: updatedTransaction.spent,
        amount: updatedTransaction.points,
        promotionIds: updatedTransaction.promotionUses.map(
          (pu) => pu.promotionId
        ),
        suspicious: suspicious,
        remark: updatedTransaction.remark || "",
        createdBy: updatedTransaction.processor.username,
      });
    } catch (error) {
      return sendResult(res, 500, { error: error.message });
    }
  }
);

router.patch(
  "/:transactionId/processed",
  authenticate,
  requireClearance("CASHIER"),
  async (req, res) => {
    const transactionId = parseInt(req.params.transactionId);
    const { processed } = req.body;

    if (isNaN(transactionId) || transactionId <= 0) {
      return sendResult(res, 400, {
        error: "transactionId must be a positive integer",
      });
    }

    if (processed !== true) {
      return sendResult(res, 400, { error: "processed can only be true" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      return sendResult(res, 404, { error: "Transaction not found" });
    }

    if (transaction.type !== "REDEMPTION") {
      return sendResult(res, 400, {
        error: "Only redemption transactions can be processed",
      });
    }

    if (transaction.processedBy !== null) {
      return sendResult(res, 400, {
        error: "Transaction has already been processed",
      });
    }

    const [updatedTransaction] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: {
          processedBy: req.user.id,
          status: "APPROVED",
        },
        include: {
          user: true,
        },
      }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: {
          pointsBalance: {
            decrement: transaction.points,
          },
        },
      }),
    ]);

    sendResult(res, 200, {
      id: updatedTransaction.id,
      utorid: updatedTransaction.user.username,
      type: "redemption",
      processedBy: req.user.utorid,
      redeemed: transaction.points,
      remark: transaction.remark || "",
      createdBy: updatedTransaction.user.username,
    });
  }
);

module.exports = router;
