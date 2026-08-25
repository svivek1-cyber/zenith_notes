const express = require("express");
const cors = require("cors");
const config = require("./config/env");
const { createAuthRoutes } = require("./routes/auth.routes");
const { createNoteRoutes } = require("./routes/note.routes");

function createApp(collections) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(createAuthRoutes(collections));
  app.use(createNoteRoutes(collections));
  app.get("/", (req, res) => res.send("Your server is running...."));
  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    res.status(500).json({ message: "Internal server error" });
  });
  return app;
}
module.exports = { createApp };
