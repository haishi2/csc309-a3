#!/usr/bin/env node
"use strict";

// const port = (() => {
//   const args = process.argv;

//   if (args.length !== 3) {
//     console.error("usage: node index.js port");
//     process.exit(1);
//   }

//   const num = parseInt(args[2], 10);
//   if (isNaN(num)) {
//     console.error("error: argument must be an integer.");
//     process.exit(1);
//   }

//   return num;
// })();

const express = require("express");
const app = express();
const cors = require("cors");
const { expressjwt: expressJwt } = require("express-jwt");
const { cleanupRateLimits, sendResult } = require("./src/utils");
const { JWT_SECRET, rateLimits } = require("./src/config");
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use(
  expressJwt({
    secret: JWT_SECRET,
    algorithms: ["HS256"],
  }).unless({
    path: [
      "/auth/tokens",
      "/auth/resets",
      { url: /^\/auth\/resets\/.*/, methods: ["POST"] },
    ],
  })
);

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return sendResult(res, 401, { error: "Unauthorized" });
  }
  next(err);
});

rateLimits.cleanupInterval = setInterval(cleanupRateLimits, rateLimits.time);

app.use("/auth", require("./src/routes/auth").router);
app.use("/users", require("./src/routes/users"));
app.use("/transactions", require("./src/routes/transactions"));
app.use("/events", require("./src/routes/events"));
app.use("/promotions", require("./src/routes/promotions"));

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", (err) => {
  console.error(`cannot start server: ${err.message}`);
  process.exit(1);
});
