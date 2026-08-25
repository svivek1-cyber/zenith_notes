const { ObjectId } = require("mongodb");
const { FolderSchema, NoteSchema, TaskSchema } = require("../schemas");
const { saveVersion, trimVersions } = require("../services/version.service");
const { analyzeNote } = require("../services/ai.service");

const validId = (value) => ObjectId.isValid(value);

function createNotesController(collections) {
  const ownedNote = (id, ownerId) => collections.notes.findOne({ _id: new ObjectId(id), ownerId });
  const ownedFolder = (id, ownerId) => collections.folders.findOne({ _id: new ObjectId(id), ownerId });
  return {
    listFolders: async (req, res) => res.json({ folders: await collections.folders.find({ ownerId: req.user._id }).sort({ createdAt: 1 }).toArray() }),
    createFolder: async (req, res) => {
      const parsed = FolderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
      const existing = await collections.folders.findOne({ ownerId: req.user._id, name: parsed.data.name });
      if (existing) return res.status(409).json({ message: "A project with this name already exists" });
      const folder = { ...parsed.data, ownerId: req.user._id, createdAt: new Date() };
      const result = await collections.folders.insertOne(folder);
      res.status(201).json({ folder: { ...folder, _id: result.insertedId } });
    },
    removeFolder: async (req, res) => {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid project id" });
      const folderId = new ObjectId(req.params.id);
      const result = await collections.folders.deleteOne({ _id: folderId, ownerId: req.user._id });
      if (!result.deletedCount) return res.status(404).json({ message: "Project not found" });
      await collections.notes.updateMany({ folderId: req.params.id, ownerId: req.user._id }, { $unset: { folderId: "" } });
      res.status(204).send();
    },
    list: async (req, res) => res.json({ notes: await collections.notes.find({ ownerId: req.user._id, deletedAt: { $exists: false } }).sort({ updatedAt: -1 }).toArray() }),
    listBin: async (req, res) => res.json({ notes: await collections.notes.find({ ownerId: req.user._id, deletedAt: { $exists: true } }).sort({ deletedAt: -1 }).toArray() }),
    create: async (req, res) => {
      const parsed = NoteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
      if (parsed.data.folderId && (!validId(parsed.data.folderId) || !await ownedFolder(parsed.data.folderId, req.user._id))) return res.status(400).json({ message: "Invalid project" });
      const now = new Date(); const note = { ...parsed.data, ownerId: req.user._id, createdAt: now, updatedAt: now };
      const result = await collections.notes.insertOne(note); res.status(201).json({ note: { ...note, _id: result.insertedId } });
    },
    update: async (req, res) => {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid note id" });
      const parsed = NoteSchema.partial().safeParse(req.body); if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
      const current = await collections.notes.findOne({ _id: new ObjectId(req.params.id), ownerId: req.user._id, deletedAt: { $exists: false } }); if (!current) return res.status(404).json({ message: "Note not found" });
      if (parsed.data.folderId && (!validId(parsed.data.folderId) || !await ownedFolder(parsed.data.folderId, req.user._id))) return res.status(400).json({ message: "Invalid project" });
      const changed = Object.keys(parsed.data).some((key) => parsed.data[key] !== current[key]);
      if (!changed) return res.json({ note: current });
      const contentChanged = (parsed.data.title !== undefined && parsed.data.title !== current.title) || (parsed.data.body !== undefined && parsed.data.body !== current.body);
      if (contentChanged) await saveVersion(collections.versions, current, req.user._id);
      const result = await collections.notes.findOneAndUpdate({ _id: current._id, ownerId: req.user._id }, { $set: { ...parsed.data, updatedAt: new Date() } }, { returnDocument: "after" });
      res.json({ note: result });
    },
    remove: async (req, res) => {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid note id" });
      const noteId = new ObjectId(req.params.id);
      const result = await collections.notes.updateOne({ _id: noteId, ownerId: req.user._id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date(), isPinned: false } });
      if (!result.deletedCount) return res.status(404).json({ message: "Note not found" });
      res.status(204).send();
    },
    restoreNote: async (req, res) => {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid note id" });
      const result = await collections.notes.findOneAndUpdate({ _id: new ObjectId(req.params.id), ownerId: req.user._id, deletedAt: { $exists: true } }, { $unset: { deletedAt: "" }, $set: { updatedAt: new Date() } }, { returnDocument: "after" });
      if (!result) return res.status(404).json({ message: "Note not found in Bin" });
      res.json({ note: result });
    },
    permanentlyDeleteNote: async (req, res) => {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid note id" });
      const noteId = new ObjectId(req.params.id);
      const result = await collections.notes.deleteOne({ _id: noteId, ownerId: req.user._id, deletedAt: { $exists: true } });
      if (!result.deletedCount) return res.status(404).json({ message: "Note not found in Bin" });
      await collections.tasks.deleteMany({ noteId, ownerId: req.user._id });
      await collections.versions.deleteMany({ noteId, ownerId: req.user._id });
      res.status(204).send();
    },
    emptyBin: async (req, res) => {
      const deletedNotes = await collections.notes.find({ ownerId: req.user._id, deletedAt: { $exists: true } }).project({ _id: 1 }).toArray();
      if (deletedNotes.length) {
        const noteIds = deletedNotes.map((note) => note._id);
        await collections.tasks.deleteMany({ noteId: { $in: noteIds }, ownerId: req.user._id });
        await collections.versions.deleteMany({ noteId: { $in: noteIds }, ownerId: req.user._id });
        await collections.notes.deleteMany({ _id: { $in: noteIds }, ownerId: req.user._id });
      }
      res.status(204).send();
    },
    versions: async (req, res) => {
      if (!validId(req.params.noteId)) return res.status(400).json({ message: "Invalid note id" });
      if (!await ownedNote(req.params.noteId, req.user._id)) return res.status(404).json({ message: "Note not found" });
      res.json({ versions: await collections.versions.find({ noteId: new ObjectId(req.params.noteId), ownerId: req.user._id }).sort({ createdAt: -1 }).limit(10).toArray() });
    },
    restore: async (req, res) => {
      if (!validId(req.params.noteId) || !validId(req.params.versionId)) return res.status(400).json({ message: "Invalid version id" });
      const note = await ownedNote(req.params.noteId, req.user._id); const version = await collections.versions.findOne({ _id: new ObjectId(req.params.versionId), noteId: note?._id, ownerId: req.user._id });
      if (!note) return res.status(404).json({ message: "Note not found" }); if (!version) return res.status(404).json({ message: "Version not found" });
      await saveVersion(collections.versions, note, req.user._id); const restored = await collections.notes.findOneAndUpdate({ _id: note._id, ownerId: req.user._id }, { $set: { title: version.title, body: version.body, updatedAt: new Date() } }, { returnDocument: "after" });
      res.json({ note: restored });
    },
    analyze: async (req, res) => {
      if (!validId(req.params.noteId)) return res.status(400).json({ message: "Invalid note id" });
      const note = await ownedNote(req.params.noteId, req.user._id); if (!note) return res.status(404).json({ message: "Note not found" });
      try { res.json(await analyzeNote(note.body)); } catch (error) { res.status(error.status || 500).json({ message: error.message || "Unable to analyze note" }); }
    },
    listTasks: async (req, res) => {
      if (!validId(req.params.noteId) || !await ownedNote(req.params.noteId, req.user._id)) return res.status(404).json({ message: "Note not found" });
      res.json({ tasks: await collections.tasks.find({ noteId: new ObjectId(req.params.noteId), ownerId: req.user._id }).sort({ createdAt: -1 }).toArray() });
    },
    createTask: async (req, res) => {
      if (!validId(req.params.noteId) || !await ownedNote(req.params.noteId, req.user._id)) return res.status(404).json({ message: "Note not found" });
      const parsed = TaskSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
      const now = new Date(); const task = { ...parsed.data, noteId: new ObjectId(req.params.noteId), ownerId: req.user._id, createdAt: now, updatedAt: now }; const result = await collections.tasks.insertOne(task);
      res.status(201).json({ task: { ...task, _id: result.insertedId } });
    },
    updateTask: async (req, res) => {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid task id" }); const parsed = TaskSchema.partial().safeParse(req.body); if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
      const result = await collections.tasks.findOneAndUpdate({ _id: new ObjectId(req.params.id), ownerId: req.user._id }, { $set: { ...parsed.data, updatedAt: new Date() } }, { returnDocument: "after" }); if (!result) return res.status(404).json({ message: "Task not found" }); res.json({ task: result });
    },
    removeTask: async (req, res) => { if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid task id" }); const result = await collections.tasks.deleteOne({ _id: new ObjectId(req.params.id), ownerId: req.user._id }); if (!result.deletedCount) return res.status(404).json({ message: "Task not found" }); res.status(204).send(); },
  };
}

module.exports = { createNotesController };
