const { rateLimits } = require("../config");

function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, timestamp] of rateLimits.requests.entries()) {
    if (now - timestamp >= rateLimits.time) {
      rateLimits.requests.delete(ip);
      if (rateLimits.timers.has(ip)) {
        clearTimeout(rateLimits.timers.get(ip));
        rateLimits.timers.delete(ip);
      }
    }
  }
}

function validatePassword(password) {
  const minLength = 8;
  const maxLength = 20;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength || password.length > maxLength) {
    return "Password must be between 8 and 20 characters";
  }
  if (!hasUpperCase) {
    return "Password must contain at least one uppercase letter";
  }
  if (!hasLowerCase) {
    return "Password must contain at least one lowercase letter";
  }
  if (!hasNumbers) {
    return "Password must contain at least one number";
  }
  if (!hasSpecialChar) {
    return "Password must contain at least one special character";
  }

  return null;
}

const sendResult = (res, status, data) => {
  const isError = status >= 400;
  const logMessage = isError
    ? `Error ${status}: ${
        typeof data === "string" ? data : data.error || JSON.stringify(data)
      }`
    : `Success ${status}: ${JSON.stringify(data)}`;

  if (isError) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }

  res.status(status).json(data);
};

module.exports = {
  cleanupRateLimits,
  validatePassword,
  sendResult,
};
