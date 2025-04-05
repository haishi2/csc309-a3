const express = require("express");
const router = express.Router();
const { PrismaClient, PromotionType } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticate, requireClearance } = require("../middleware");
const { sendResult } = require("../utils");
const { roles } = require("../config");
const typeMapping = {
  automatic: "AUTOMATIC",
  "one-time": "ONE_TIME",
};

router
  .route("/")
  .post(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
    } = req.body;

    if (!name || typeof name !== "string") {
      return sendResult(res, 400, { error: "name must be a string" });
    }
    if (!description || typeof description !== "string") {
      return sendResult(res, 400, { error: "description must be a string" });
    }
    if (!type || !["automatic", "one-time"].includes(type)) {
      return sendResult(res, 400, {
        error: "type must be either 'automatic' or 'one-time'",
      });
    }
    if (!startTime || !endTime) {
      return sendResult(res, 400, {
        error: "startTime and endTime are required",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    now.setMilliseconds(0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sendResult(res, 400, { error: "Invalid date format" });
    }

    if (start <= now || end <= start) {
      return sendResult(res, 400, {
        error: "startTime and endTime must be in the future",
      });
    }

    if (
      minSpending !== undefined &&
      minSpending !== null &&
      (typeof minSpending !== "number" || minSpending <= 0)
    ) {
      return sendResult(res, 400, {
        error: "minSpending must be a positive number",
      });
    }

    if (
      rate !== undefined &&
      rate !== null &&
      (typeof rate !== "number" || rate <= 0)
    ) {
      return sendResult(res, 400, { error: "rate must be a positive number" });
    }

    if (
      points !== undefined &&
      points !== null &&
      (!Number.isInteger(points) || points < 0)
    ) {
      return sendResult(res, 400, {
        error: "points must be a positive integer",
      });
    }
    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        type: PromotionType[typeMapping[type]],
        startTime: start,
        endTime: end,
        minSpend: minSpending,
        rate,
        points,
        managerId: req.user.id,
        uses: {
          create: [],
        },
      },
    });

    return sendResult(res, 201, {
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type.toLowerCase(),
      startTime: promotion.startTime.toISOString(),
      endTime: promotion.endTime.toISOString(),
      minSpending: promotion.minSpend,
      rate: promotion.rate,
      points: promotion.points,
    });
  })
  .get(authenticate, async (req, res) => {
    let { name, type, page, limit, started, ended } = req.query;
    const isManager = roles[req.user.role] >= roles.MANAGER;

    if (page !== undefined) {
      page = parseInt(page);
      if (isNaN(page) || page <= 0) {
        return sendResult(res, 400, {
          error: "page must be a positive integer",
        });
      }
    } else {
      page = 1;
    }

    if (limit !== undefined) {
      limit = parseInt(limit);
      if (isNaN(limit) || limit <= 0) {
        return sendResult(res, 400, {
          error: "limit must be a positive integer",
        });
      }
    } else {
      limit = 10;
    }

    if (type && !["automatic", "one-time"].includes(type)) {
      return sendResult(res, 400, {
        error: "type must be either 'automatic' or 'one-time'",
      });
    }

    if (isManager && started !== undefined && ended !== undefined) {
      return sendResult(res, 400, {
        error: "Cannot specify both started and ended",
      });
    }

    const now = new Date();
    now.setMilliseconds(0);
    const query = {};

    if (name) {
      query.name = { contains: name };
    }

    if (type) {
      query.type = type.toUpperCase().replace("-", "_");
    }

    if (isManager) {
      if (started !== undefined) {
        const startedBool = started === "true";
        if (startedBool) {
          query.startTime = { lte: now };
        } else {
          query.startTime = { gt: now };
        }
      }

      if (ended !== undefined) {
        const endedBool = ended === "true";
        if (endedBool) {
          query.endTime = { lte: now };
        } else {
          query.endTime = { gt: now };
        }
      }
    } else {
      query.startTime = { lte: now };
      query.endTime = { gt: now };

      if (type === "one-time" && roles[req.user.role] < roles.MANAGER) {
        query.NOT = {
          promotionUses: {
            some: {
              userId: req.user.id,
            },
          },
        };
      }
    }

    const skip = (page - 1) * limit;
    console.log(query);

    const [count, promotions] = await Promise.all([
      prisma.promotion.count({ where: query }),
      prisma.promotion.findMany({
        where: query,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          type: true,
          endTime: true,
          minSpend: true,
          rate: true,
          points: true,
          startTime: isManager,
        },
      }),
    ]);

    const results = promotions.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type.toLowerCase(),
      ...(isManager && { startTime: p.startTime.toISOString() }),
      endTime: p.endTime.toISOString(),
      minSpending: p.minSpend,
      rate: p.rate,
      points: p.points,
    }));

    return sendResult(res, 200, { count, results });
  });

router
  .route("/:promotionId")
  .get(authenticate, async (req, res) => {
    const promotionId = parseInt(req.params.promotionId);
    if (isNaN(promotionId) || promotionId <= 0) {
      return sendResult(res, 400, { error: "Invalid promotion ID" });
    }

    const isManager = roles[req.user.role] >= roles.MANAGER;
    const now = new Date();
    now.setMilliseconds(0);

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return sendResult(res, 404, { error: "Promotion not found" });
    }

    const startTime = promotion.startTime.setMilliseconds(0);
    const endTime = promotion.endTime.setMilliseconds(0);

    if (!isManager && (startTime > now || endTime <= now)) {
      return sendResult(res, 404, { error: "Promotion not found" });
    }

    const response = {
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type.toLowerCase(),
      endTime: promotion.endTime.toISOString(),
      minSpending: promotion.minSpend,
      rate: promotion.rate,
      points: promotion.points,
    };

    if (isManager) {
      response.startTime = promotion.startTime.toISOString();
    }

    return sendResult(res, 200, response);
  })
  .patch(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const promotionId = parseInt(req.params.promotionId);
    if (isNaN(promotionId) || promotionId <= 0) {
      return sendResult(res, 400, { error: "Invalid promotion ID" });
    }

    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
    } = req.body;

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return sendResult(res, 404, { error: "Promotion not found" });
    }

    const now = new Date();
    now.setMilliseconds(0);
    const originalStart = new Date(promotion.startTime);
    const originalEnd = new Date(promotion.endTime);

    if (startTime) {
      const newStart = new Date(startTime);
      newStart.setMilliseconds(0);
      if (isNaN(newStart.getTime())) {
        return sendResult(res, 400, { error: "Invalid startTime format" });
      }
      if (newStart <= now) {
        return sendResult(res, 400, {
          error: "startTime must not be in the past",
        });
      }
    }

    if (endTime) {
      const newEnd = new Date(endTime);
      newEnd.setMilliseconds(0);
      if (isNaN(newEnd.getTime())) {
        return sendResult(res, 400, { error: "Invalid endTime format" });
      }
      if (newEnd <= (startTime ? new Date(startTime) : originalStart)) {
        return sendResult(res, 400, {
          error: "endTime must be after startTime",
        });
      }
    }

    if (
      rate !== undefined &&
      rate !== null &&
      (typeof rate !== "number" || rate <= 0)
    ) {
      return sendResult(res, 400, { error: "rate must be a positive number" });
    }

    if (
      points !== undefined &&
      points !== null &&
      (!Number.isInteger(points) || points <= 0)
    ) {
      return sendResult(res, 400, {
        error: "points must be a positive integer",
      });
    }

    if (
      minSpending !== undefined &&
      minSpending !== null &&
      (typeof minSpending !== "number" || minSpending <= 0)
    ) {
      return sendResult(res, 400, {
        error: "minSpending must be a positive number",
      });
    }

    if (originalStart <= now) {
      if (
        name ||
        description ||
        type ||
        startTime ||
        minSpending !== undefined ||
        rate !== undefined ||
        points !== undefined
      ) {
        return sendResult(res, 400, {
          error: "Cannot modify these fields after promotion has started",
        });
      }
    }

    if (originalEnd <= now && endTime) {
      return sendResult(res, 400, {
        error: "Cannot modify endTime after promotion has ended",
      });
    }

    const updateData = {};
    const response = {
      id: promotion.id,
      name: promotion.name,
      type: promotion.type.toLowerCase(),
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (type) updateData.type = type.toUpperCase();
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (minSpending !== undefined && minSpending !== null)
      updateData.minSpend = minSpending;
    if (rate !== undefined && rate !== null) updateData.rate = rate;
    if (points !== undefined && points !== null) updateData.points = points;

    const updatedPromotion = await prisma.promotion.update({
      where: { id: promotionId },
      data: updateData,
    });

    if (name) response.name = updatedPromotion.name;
    if (description) response.description = updatedPromotion.description;
    if (type) response.type = updatedPromotion.type.toLowerCase();
    if (startTime)
      response.startTime = updatedPromotion.startTime.toISOString();
    if (endTime) response.endTime = updatedPromotion.endTime.toISOString();
    if (minSpending !== undefined && minSpending !== null)
      response.minSpending = updatedPromotion.minSpend;
    if (rate !== undefined && rate !== null)
      response.rate = updatedPromotion.rate;
    if (points !== undefined && points !== null)
      response.points = updatedPromotion.points;

    return sendResult(res, 200, response);
  })
  .delete(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const promotionId = parseInt(req.params.promotionId);
    if (isNaN(promotionId) || promotionId <= 0) {
      return sendResult(res, 400, { error: "Invalid promotion ID" });
    }

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return sendResult(res, 404, { error: "Promotion not found" });
    }

    const now = new Date();
    now.setMilliseconds(0);
    const startTime = promotion.startTime.setMilliseconds(0);
    const endTime = promotion.endTime.setMilliseconds(0);

    if (startTime <= now && endTime >= now) {
      return sendResult(res, 403, {
        error: "Cannot delete a promotion that has already started",
      });
    }

    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    return sendResult(res, 204);
  });

module.exports = router;
