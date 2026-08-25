const { z } = require("zod");

const UserSchema = z.object({
  firstName: z.string().min(1).regex(/^[a-zA-Z._ -]+$/),
  lastName: z.string().min(1).regex(/^[a-zA-Z._ -]+$/).optional(),
  profileImage: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

const FolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().trim().max(30).optional(),
});

const NoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(500000),
  folderId: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  isPinned: z.boolean().default(false),
  status: z.enum(["Draft", "Published"]).default("Draft"),
});

const TaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  completed: z.boolean().default(false),
  dueDate: z.string().datetime().nullable().optional(),
});

module.exports = { UserSchema, FolderSchema, NoteSchema, TaskSchema };
