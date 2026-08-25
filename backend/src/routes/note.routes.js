const express = require("express");
const { createNotesController } = require("../controllers/notes.controller");
const { requireAuth } = require("../middleware/auth");

function createNoteRoutes(collections) {
  const router = express.Router();
  const controller = createNotesController(collections);
  const auth = requireAuth(collections);
  router.get("/folders", auth, controller.listFolders);
  router.post("/folders", auth, controller.createFolder);
  router.delete("/folders/:id", auth, controller.removeFolder);
  router.get("/notes", auth, controller.list);
  router.get("/bin", auth, controller.listBin);
  router.post("/notes", auth, controller.create);
  router.patch("/notes/:id", auth, controller.update);
  router.delete("/notes/:id", auth, controller.remove);
  router.post("/bin/folders/:id/restore", auth, controller.restoreFolder);
  router.delete("/bin/folders/:id", auth, controller.permanentlyDeleteFolder);
  router.post("/bin/:id/restore", auth, controller.restoreNote);
  router.delete("/bin", auth, controller.emptyBin);
  router.delete("/bin/:id", auth, controller.permanentlyDeleteNote);
  router.get("/notes/:noteId/versions", auth, controller.versions);
  router.post(
    "/notes/:noteId/versions/:versionId/restore",
    auth,
    controller.restore,
  );
  router.post("/notes/:noteId/analyze", auth, controller.analyze);
  router.get("/notes/:noteId/tasks", auth, controller.listTasks);
  router.post("/notes/:noteId/tasks", auth, controller.createTask);
  router.patch("/tasks/:id", auth, controller.updateTask);
  router.delete("/tasks/:id", auth, controller.removeTask);
  return router;
}
module.exports = { createNoteRoutes };
