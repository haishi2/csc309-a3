const JWT_SECRET = "123456abcdef";

const roles = {
  REGULAR: 1,
  CASHIER: 2,
  MANAGER: 3,
  SUPERUSER: 4,
};

const rateLimits = {
  time: 60000,
  requests: new Map(),
  timers: new Map(),
  cleanupInterval: null,
};

module.exports = {
  JWT_SECRET,
  roles,
  rateLimits,
};
