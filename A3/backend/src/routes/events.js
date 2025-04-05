const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticate, requireClearance } = require("../middleware");
const { roles } = require("../config");
const { sendResult } = require("../utils");

router
  .route("/")
  .post(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const {
      name,
      description,
      location,
      startTime,
      endTime,
      points,
      capacity,
    } = req.body;

    if (
      !name ||
      typeof name !== "string" ||
      name.length < 1 ||
      name.length > 100
    ) {
      return sendResult(res, 400, {
        error: "name must be a string between 1-100 characters",
      });
    }

    if (!description || typeof description !== "string") {
      return sendResult(res, 400, { error: "description must be a string" });
    }

    if (!location || typeof location !== "string" || location.length < 1) {
      return sendResult(res, 400, {
        error: "location must be a non-empty string",
      });
    }

    if (!startTime || !endTime) {
      return sendResult(res, 400, {
        error: "startTime and endTime are required",
      });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return sendResult(res, 400, {
        error: "Invalid date format for startTime or endTime",
      });
    }

    startDate.setMilliseconds(0);
    endDate.setMilliseconds(0);
    const now = new Date();
    now.setMilliseconds(0);

    if (
      startDate.getTime() < now.getTime() ||
      endDate.getTime() <= startDate.getTime()
    ) {
      return sendResult(res, 400, { error: "Invalid start or end time" });
    }

    if (
      points !== null &&
      points !== undefined &&
      (typeof points !== "number" || points < 0)
    ) {
      return sendResult(res, 400, {
        error: "points must be a positive number",
      });
    }

    if (
      capacity !== null &&
      capacity !== undefined &&
      (typeof capacity !== "number" || capacity <= 0)
    ) {
      return sendResult(res, 400, {
        error: "capacity must be a positive integer",
      });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startTime: startDate,
        endTime: endDate,
        capacity: capacity !== null && capacity !== undefined ? capacity : null,
        totalPoints: points,
        pointsRemain: points,
        managerId: req.user.id,
        isPublished: false,
        organizers: {
          create: [
            {
              userId: req.user.id,
            },
          ],
        },
      },
      include: {
        organizers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    sendResult(res, 201, {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      capacity: event.capacity,
      registered: 0,
      totalPoints: event.totalPoints,
      pointsRemain: event.pointsRemain,
      pointsAwarded: 0,
      isPublished: false,
      organizers: event.organizers.map((org) => ({
        id: org.user.id,
        utorid: org.user.username,
        name: org.user.name,
      })),
      guests: [],
    });
  })
  .get(authenticate, requireClearance("REGULAR"), async (req, res) => {
    let { name, page, limit, started, ended, registered, isPublished } =
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

    if (name !== null && name !== undefined && typeof name !== "string") {
      return sendResult(res, 400, { error: "name must be a string" });
    }

    if (
      started !== null &&
      started !== undefined &&
      !["true", "false"].includes(started)
    ) {
      return sendResult(res, 400, {
        error: "started must be 'true' or 'false'",
      });
    }

    if (
      ended !== null &&
      ended !== undefined &&
      !["true", "false"].includes(ended)
    ) {
      return sendResult(res, 400, { error: "ended must be 'true' or 'false'" });
    }

    if (
      registered !== null &&
      registered !== undefined &&
      !["true", "false"].includes(registered)
    ) {
      return sendResult(res, 400, {
        error: "registered must be 'true' or 'false'",
      });
    }

    const skip = (page - 1) * limit;
    const query = {};

    if (name) query.name = { contains: name };

    if (roles[req.user.role] >= roles.MANAGER) {
      if (started !== null && started !== undefined) {
        const now = new Date();
        now.setMilliseconds(0);
        query.startTime = started === "true" ? { lte: now } : { gt: now };
      }
      if (ended !== null && ended !== undefined) {
        const now = new Date();
        now.setMilliseconds(0);
        query.endTime = ended === "true" ? { lte: now } : { gt: now };
      }
    } else {
      const now = new Date();
      now.setMilliseconds(0);
      query.endTime = { gt: now };
      if (registered !== null && registered !== undefined) {
        if (registered === "true") {
          query.registrations = {
            some: {
              userId: req.user.id,
            },
          };
        } else if (registered === "false") {
          query.registrations = {
            none: {
              userId: req.user.id,
            },
          };
        }
      }
    }

    if (isPublished !== null && isPublished !== undefined) {
      if (roles[req.user.role] >= roles.MANAGER) {
        query.isPublished = isPublished === "true";
      }
      if (roles[req.user.role] < roles.MANAGER) {
        sendResult(res, 403, {
          error: "Only managers can view unpublished events",
        });
      }
    } else if (roles[req.user.role] < roles.MANAGER) {
      query.isPublished = true;
    }

    const [count, events] = await Promise.all([
      prisma.event.count({ where: query }),
      prisma.event.findMany({
        where:
          roles[req.user.role] >= roles.MANAGER
            ? query
            : {
                OR: [query, { organizers: { some: { userId: req.user.id } } }],
              },
        skip: skip,
        take: limit,
        include: {
          guests: {
            include: {
              user: {
                select: { id: true, username: true, name: true },
              },
            },
          },
          organizers: {
            include: {
              user: {
                select: { id: true, username: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    const results = events.map((event) => {
      const response = {
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        numGuests: event.numGuests,
        isRegistered: event.guests.some(
          (guest) => guest.userId === req.user.id
        ),
      };

      if (
        roles[req.user.role] >= roles.MANAGER ||
        event.organizers.some((org) => org.userId === req.user.id)
      ) {
        response.pointsRemain = event.pointsRemain;
        response.pointsAwarded = event.totalPoints - event.pointsRemain;
        response.isPublished = event.isPublished;
        response.points = event.totalPoints;
        response.guests = event.guests;
        response.organizers = event.organizers;
      }

      return response;
    });

    sendResult(res, 200, { count, results });
  });

router
  .route("/:eventId")
  .get(authenticate, requireClearance("REGULAR"), async (req, res) => {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { guests: true },
        },
        guests: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
        organizers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (
      !event ||
      (event.isPublished === false &&
        req.user.role !== "MANAGER" &&
        event.organizers.filter((org) => org.userId === req.user.id).length ===
          0)
    ) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    const response = {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      capacity: event.capacity,
      organizers: event.organizers.map((org) => ({
        id: org.user.id,
        utorid: org.user.username,
        name: org.user.name,
      })),
      numGuests: event._count.guests,
      isRegistered: event.guests.some((guest) => guest.userId === req.user.id),
    };
    if (
      roles[req.user.role] >= roles.MANAGER ||
      event.organizers.some((org) => org.userId === req.user.id)
    ) {
      response.pointsRemain = event.pointsRemain;
      response.pointsAwarded = event.totalPoints - event.pointsRemain;
      response.isPublished = event.isPublished;
      response.guests = event.guests.map((guest) => ({
        id: guest.userId,
        utorid: guest.user.username,
        name: guest.user.name,
      }));
      response.organizers = event.organizers.map((org) => ({
        id: org.userId,
        utorid: org.user.username,
        name: org.user.name,
      }));
    }

    sendResult(res, 200, response);
  })
  .patch(authenticate, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const {
      name,
      description,
      location,
      startTime,
      endTime,
      points,
      capacity,
      isPublished,
    } = req.body;

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizers: true,
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!event) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    const now = new Date();
    now.setMilliseconds(0);
    const eventStartTime = new Date(event.startTime);
    eventStartTime.setMilliseconds(0);
    const eventEndTime = new Date(event.endTime);
    eventEndTime.setMilliseconds(0);

    if (eventStartTime <= now) {
      if (name !== null && name !== undefined) {
        return sendResult(res, 400, {
          error: "Cannot modify name after event has started",
        });
      }
      if (description !== null && description !== undefined) {
        return sendResult(res, 400, {
          error: "Cannot modify description after event has started",
        });
      }
      if (location !== null && location !== undefined) {
        return sendResult(res, 400, {
          error: "Cannot modify location after event has started",
        });
      }
      if (startTime !== null && startTime !== undefined) {
        return sendResult(res, 400, {
          error: "Cannot modify start time after event has started",
        });
      }
      if (capacity !== null && capacity !== undefined) {
        return sendResult(res, 400, {
          error: "Cannot modify capacity after event has started",
        });
      }
    }

    if (eventEndTime <= now && endTime !== null && endTime !== undefined) {
      return sendResult(res, 400, {
        error: "Cannot modify end time after event has ended",
      });
    }

    const isOrganizer = event.organizers.some(
      (org) => org.userId === req.user.id
    );

    if (req.user.role !== "MANAGER" && !isOrganizer) {
      return sendResult(res, 403, {
        error: "Only managers and organizers can modify events",
      });
    }

    const updateData = {};

    if (name !== null && name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 100) {
        return sendResult(res, 400, {
          error: "name must be a string between 1-100 characters",
        });
      }
      updateData.name = name;
    }

    if (description !== null && description !== undefined) {
      if (typeof description !== "string") {
        return sendResult(res, 400, { error: "description must be a string" });
      }
      updateData.description = description;
    }

    if (location !== null && location !== undefined) {
      if (typeof location !== "string" || location.length < 1) {
        return sendResult(res, 400, {
          error: "location must be a non-empty string",
        });
      }
      updateData.location = location;
    }

    if (startTime !== null && startTime !== undefined) {
      const startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        return sendResult(res, 400, { error: "Invalid startTime format" });
      }
      startDate.setMilliseconds(0);
      const now = new Date();
      now.setMilliseconds(0);
      if (startDate.getTime() <= now.getTime()) {
        return sendResult(res, 400, {
          error: "startTime must be in the future",
        });
      }
      updateData.startTime = startDate;
    }

    if (endTime !== null && endTime !== undefined) {
      const endDate = new Date(endTime);
      if (isNaN(endDate.getTime())) {
        return sendResult(res, 400, { error: "Invalid endTime format" });
      }
      endDate.setMilliseconds(0);
      const startDate = startTime ? new Date(startTime) : event.startTime;
      startDate.setMilliseconds(0);
      if (endDate.getTime() <= startDate.getTime()) {
        return sendResult(res, 400, {
          error: "endTime must be after startTime",
        });
      }
      updateData.endTime = endDate;
    }

    if (points !== null && points !== undefined) {
      if (typeof points !== "number" || points < 0) {
        return sendResult(res, 400, {
          error: "points must be a positive number",
        });
      }

      if (req.user.role !== "MANAGER" && req.user.role !== "SUPERUSER") {
        return sendResult(res, 403, {
          error: "Only managers and superusers can modify points",
        });
      }

      if (roles[req.user.role] >= roles.MANAGER) {
        updateData.totalPoints = points;
        updateData.pointsRemain =
          event.pointsRemain - (event.totalPoints - points);
        if (updateData.pointsRemain < 0) {
          return sendResult(res, 400, {
            error: "Too little points remaining",
          });
        }
      }
    }

    if (isPublished !== null && isPublished !== undefined) {
      if (
        typeof isPublished !== "boolean" ||
        (typeof isPublished === "boolean" && isPublished === false)
      ) {
        return sendResult(res, 400, { error: "published must be true" });
      }

      if (req.user.role !== "MANAGER" && req.user.role !== "SUPERUSER") {
        return sendResult(res, 403, {
          error: "Only managers can publish events",
        });
      }

      if (roles[req.user.role] >= roles.MANAGER) {
        updateData.isPublished = isPublished;
      }
    }

    if (capacity !== null && capacity !== undefined) {
      if (
        typeof capacity !== "number" ||
        capacity <= 0 ||
        !Number.isInteger(capacity)
      ) {
        return sendResult(res, 400, {
          error: "capacity must be a positive integer",
        });
      }
      if (capacity < event._count.guests) {
        return sendResult(res, 400, {
          error: "New capacity cannot be less than current registrations",
        });
      }
      updateData.capacity = capacity;
    }

    if (Object.keys(updateData).length === 0) {
      return sendResult(res, 400, { error: "No valid updates specified" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        _count: {
          select: { guests: true },
        },
      },
    });

    const response = {
      id: updatedEvent.id,
      name: updatedEvent.name,
      location: updatedEvent.location,
    };

    if (updateData.description) response.description = updatedEvent.description;
    if (updateData.startTime)
      response.startTime = updatedEvent.startTime.toISOString();
    if (updateData.endTime)
      response.endTime = updatedEvent.endTime.toISOString();
    if (updateData.totalPoints) {
      response.totalPoints = updatedEvent.totalPoints;
      response.pointsRemain = updatedEvent.pointsRemain;
    }
    if (updateData.capacity) {
      response.capacity = updatedEvent.capacity;
      response.registered = updatedEvent._count.guests;
    }
    if (updateData.isPublished) {
      response.isPublished = updatedEvent.isPublished;
    }
    sendResult(res, 200, response);
  })
  .delete(authenticate, async (req, res) => {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    if (event.isPublished === true) {
      return sendResult(res, 400, {
        error: "Cannot delete a published event",
      });
    }

    //delete all related records
    await prisma.$transaction([
      prisma.rSVP.deleteMany({
        where: { eventId },
      }),
      prisma.organizer.deleteMany({
        where: { eventId },
      }),
      prisma.transaction.deleteMany({
        where: {
          type: "EVENT",
          relatedId: eventId,
        },
      }),
      prisma.event.delete({
        where: { id: eventId },
      }),
    ]);

    sendResult(res, 204);
  });

router
  .route("/:eventId/organizers")
  .post(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const { utorid } = req.body;

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    if (!utorid || typeof utorid !== "string") {
      return sendResult(res, 400, { error: "utorid must be a string" });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    const now = new Date();
    now.setMilliseconds(0);

    if (event.endTime <= now) {
      return sendResult(res, 410, { error: "Event has ended" });
    }

    const user = await prisma.user.findFirst({
      where: { username: utorid },
    });

    if (!user) {
      return sendResult(res, 404, { error: "User not found" });
    }

    const isGuest = await prisma.rSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: user.id,
        },
      },
    });

    if (isGuest) {
      return sendResult(res, 400, {
        error: "User is already registered as a guest",
      });
    }

    await prisma.organizer.create({
      data: {
        eventId: eventId,
        userId: user.id,
      },
    });

    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    sendResult(res, 201, {
      id: updatedEvent.id,
      name: updatedEvent.name,
      location: updatedEvent.location,
      organizers: updatedEvent.organizers.map((org) => ({
        id: org.user.id,
        utorid: org.user.username,
        name: org.user.name,
      })),
    });
  });

router
  .route("/:eventId/organizers/:userId")
  .delete(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const userId = parseInt(req.params.userId);

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    if (isNaN(userId) || userId <= 0) {
      return sendResult(res, 400, {
        error: "userId must be a positive integer",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    const organizer = await prisma.organizer.findFirst({
      where: {
        eventId: eventId,
        userId: userId,
      },
    });

    if (!organizer) {
      return sendResult(res, 404, { error: "Organizer not found" });
    }

    await prisma.organizer.delete({
      where: {
        id: organizer.id,
      },
    });

    sendResult(res, 204);
  });

router.route("/:eventId/guests").post(authenticate, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const { utorid } = req.body;

  if (isNaN(eventId) || eventId <= 0) {
    return sendResult(res, 400, {
      error: "eventId must be a positive integer",
    });
  }

  if (!utorid || typeof utorid !== "string") {
    return sendResult(res, 400, { error: "utorid must be a string" });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizers: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { guests: true },
      },
    },
  });

  if (!event) {
    return sendResult(res, 404, { error: "Event not found" });
  }

  const isOrganizer = event.organizers.some(
    (org) => org.userId === req.user.id
  );
  if (roles[req.user.role] < roles.MANAGER && !isOrganizer) {
    return sendResult(res, 403, { error: "Insufficient permissions" });
  }

  if (!isOrganizer && event.isPublished === false) {
    return sendResult(res, 404, { error: "Event not found" });
  }

  const now = new Date();
  now.setMilliseconds(0);

  if (event.endTime <= now) {
    return sendResult(res, 410, { error: "Event has ended" });
  }

  if (event.capacity && event._count.guests >= event.capacity) {
    return sendResult(res, 410, { error: "Event is full" });
  }

  const user = await prisma.user.findFirst({
    where: { username: utorid },
  });

  if (!user) {
    return sendResult(res, 404, { error: "User not found" });
  }

  const isUserOrganizer = await prisma.organizer.findFirst({
    where: {
      eventId: eventId,
      userId: user.id,
    },
  });

  if (isUserOrganizer) {
    return sendResult(res, 400, { error: "User is already an organizer" });
  }

  await prisma.rSVP.create({
    data: {
      eventId: eventId,
      userId: user.id,
    },
  });

  await prisma.event.update({
    where: { id: eventId },
    data: {
      numGuests: event._count.guests + 1,
    },
  });

  sendResult(res, 201, {
    id: event.id,
    name: event.name,
    location: event.location,
    guestAdded: {
      id: user.id,
      utorid: user.username,
      name: user.name,
    },
    numGuests: event._count.guests + 1,
  });
});

router
  .route("/:eventId/guests/me")
  .post(authenticate, requireClearance("REGULAR"), async (req, res) => {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!event || event.isPublished === false) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    const now = new Date();
    now.setMilliseconds(0);

    if (event.endTime <= now) {
      return sendResult(res, 410, { error: "Event has ended" });
    }

    if (event.capacity && event._count.guests >= event.capacity) {
      return sendResult(res, 410, { error: "Event is full" });
    }

    const existingRegistration = await prisma.rSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: req.user.id,
        },
      },
    });

    if (existingRegistration) {
      return sendResult(res, 400, { error: "Already registered" });
    }

    await prisma.rSVP.create({
      data: {
        eventId: eventId,
        userId: req.user.id,
      },
    });
    await prisma.event.update({
      where: { id: eventId },
      data: {
        numGuests: event._count.guests + 1,
      },
    });

    sendResult(res, 201, {
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: {
        id: req.user.id,
        utorid: req.user.utorid,
        name: req.user.name,
      },
      numGuests: event._count.guests + 1,
    });
  })
  .delete(authenticate, requireClearance("REGULAR"), async (req, res) => {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!event) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    const now = new Date();
    now.setMilliseconds(0);

    if (event.endTime <= now) {
      return sendResult(res, 410, { error: "Event has ended" });
    }

    const registration = await prisma.rSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: req.user.id,
        },
      },
    });

    if (!registration) {
      return sendResult(res, 404, { error: "Not registered for this event" });
    }

    await prisma.rSVP.delete({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: req.user.id,
        },
      },
    });

    await prisma.event.update({
      where: { id: eventId },
      data: {
        numGuests: event._count.guests - 1,
      },
    });

    sendResult(res, 204);
  });

router
  .route("/:eventId/guests/:userId")
  .delete(authenticate, requireClearance("MANAGER"), async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const userId = parseInt(req.params.userId);

    if (isNaN(eventId) || eventId <= 0) {
      return sendResult(res, 400, {
        error: "eventId must be a positive integer",
      });
    }

    if (isNaN(userId) || userId <= 0) {
      return sendResult(res, 400, {
        error: "userId must be a positive integer",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!event) {
      return sendResult(res, 404, { error: "Event not found" });
    }

    const registration = await prisma.rSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
    });

    if (!registration) {
      return sendResult(res, 404, { error: "Guest not found" });
    }

    await prisma.rSVP.delete({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
    });

    await prisma.event.update({
      where: { id: eventId },
      data: {
        numGuests: event._count.guests - 1,
      },
    });

    sendResult(res, 204);
  });

router.route("/:eventId/transactions").post(authenticate, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const { type, utorid, amount } = req.body;

  if (isNaN(eventId) || eventId <= 0) {
    return sendResult(res, 400, {
      error: "eventId must be a positive integer",
    });
  }

  if (type !== "event") {
    return sendResult(res, 400, { error: "type must be 'event'" });
  }

  if (
    !amount ||
    typeof amount !== "number" ||
    amount <= 0 ||
    !Number.isInteger(amount)
  ) {
    return sendResult(res, 400, { error: "amount must be a positive integer" });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizers: true,
      guests: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!event) {
    return sendResult(res, 404, { error: "Event not found" });
  }

  const isOrganizer = event.organizers.some(
    (org) => org.userId === req.user.id
  );
  if (roles[req.user.role] < roles.MANAGER && !isOrganizer) {
    return sendResult(res, 403, { error: "Insufficient permissions" });
  }

  if (event.pointsRemain < amount) {
    return sendResult(res, 400, { error: "Insufficient points remaining" });
  }

  if (utorid) {
    if (typeof utorid !== "string") {
      return sendResult(res, 400, { error: "utorid must be a string" });
    }

    const guest = event.guests.find((g) => g.user.username === utorid);
    if (!guest) {
      return sendResult(res, 400, { error: "User is not on the guest list" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: guest.userId,
        type: "EVENT",
        points: amount,
        status: "APPROVED",
        relatedId: eventId,
        remark: event.name,
        processedBy: req.user.id,
      },
      include: {
        user: true,
      },
    });

    await prisma.event.update({
      where: { id: eventId },
      data: {
        pointsRemain: event.pointsRemain - amount,
        pointsAwarded: event.pointsAwarded + amount,
      },
    });

    await prisma.user.update({
      where: { id: guest.userId },
      data: {
        pointsBalance: {
          increment: amount,
        },
      },
    });

    sendResult(res, 201, {
      id: transaction.id,
      recipient: transaction.user.username,
      awarded: amount,
      type: "event",
      relatedId: eventId,
      remark: event.name,
      createdBy: req.user.utorid,
    });
  } else {
    const totalPointsNeeded = amount * event.guests.length;
    if (event.pointsRemain < totalPointsNeeded) {
      return sendResult(res, 400, { error: "Insufficient points remaining" });
    }

    const transactions = await Promise.all(
      event.guests.map(async (guest) => {
        const transaction = await prisma.transaction.create({
          data: {
            userId: guest.userId,
            type: "EVENT",
            points: amount,
            status: "APPROVED",
            relatedId: eventId,
            remark: event.name,
            processedBy: req.user.id,
          },
          include: {
            user: true,
          },
        });

        await prisma.user.update({
          where: { id: guest.userId },
          data: {
            pointsBalance: {
              increment: amount,
            },
          },
        });

        return {
          id: transaction.id,
          recipient: transaction.user.username,
          utorid: transaction.user.username,
          awarded: amount,
          amount: amount,
          type: "event",
          relatedId: eventId,
          remark: event.name,
          promotionIds: [],
          suspicious: false,
          createdBy: req.user.utorid,
        };
      })
    );

    await prisma.event.update({
      where: { id: eventId },
      data: {
        pointsRemain: event.pointsRemain - totalPointsNeeded,
        pointsAwarded: event.pointsAwarded + totalPointsNeeded,
      },
    });

    sendResult(res, 201, transactions);
  }
});

module.exports = router;
