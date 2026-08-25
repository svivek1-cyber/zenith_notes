const express = require("express");
const { createAuthController } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

function createAuthRoutes(collections) {
  const router = express.Router(); const controller = createAuthController(collections);
  router.post("/signup", controller.signup); router.post("/login", controller.login); router.post("/logout", controller.logout); router.get("/me", requireAuth(collections), controller.me);
  return router;
}
module.exports = { createAuthRoutes };
