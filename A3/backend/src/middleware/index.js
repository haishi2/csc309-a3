const multer = require("multer");
const { roles, rateLimits } = require("../config");
const { sendResult } = require("../utils");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${req.user.utorid}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

const authenticate = (req, res, next) => {
  console.log(`Recieved a request to: ${req.method} ${req.originalUrl}`);
  console.log(`params: ${JSON.stringify(req.body, null, 2)}`);
  console.log(`auth: ${JSON.stringify(req.auth, null, 2)}`);
  console.log(`time: ${new Date().toISOString()}`);
  if (!req.auth) return sendResult(res, 401, { error: "Unauthorized" });

  req.user = {
    id: req.auth.id,
    utorid: req.auth.utorid,
    role: req.auth.role,
    name: req.auth.name,
  };

  next();
};

const requireClearance = (role) => (req, res, next) => {
  if (!req.user) return sendResult(res, 401, { error: "Unauthorized" });
  if (roles[req.user.role] < roles[role.toUpperCase()]) {
    return sendResult(res, 403, { error: "Forbidden" });
  }
  next();
};

function passwordResetRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const lastRequest = rateLimits.requests.get(ip);

  if (lastRequest && now - lastRequest < rateLimits.time) {
    return sendResult(res, 429, {
      error: "Too many requests. Please try again in 60 seconds.",
      retryAfter: Math.ceil((rateLimits.time - (now - lastRequest)) / 1000),
    });
  }

  rateLimits.requests.set(ip, now);
  rateLimits.timers.set(
    ip,
    setTimeout(() => {
      rateLimits.requests.delete(ip);
      rateLimits.timers.delete(ip);
    }, rateLimits.time)
  );

  next();
}

module.exports = {
  upload,
  authenticate,
  requireClearance,
  passwordResetRateLimit,
};
