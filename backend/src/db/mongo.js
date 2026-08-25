const { MongoClient, ServerApiVersion } = require("mongodb");
const config = require("../config/env");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const client = new MongoClient(config.mongoUri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function connectDatabase() {
  await client.connect();
  const db = client.db("notesDB");
  const collections = {
    users: db.collection("users"),
    folders: db.collection("folders"),
    notes: db.collection("notes"),
    tasks: db.collection("tasks"),
    versions: db.collection("note_versions"),
  };

  await collections.users.createIndex({ email: 1 }, { unique: true });
  await collections.folders.createIndex({ ownerId: 1, createdAt: 1 });
  await collections.notes.createIndex({ ownerId: 1, updatedAt: -1 });
  await collections.tasks.createIndex({ ownerId: 1, noteId: 1, createdAt: -1 });
  await collections.versions.createIndex({ ownerId: 1, noteId: 1, createdAt: -1 });
  await db.command({ ping: 1 });
  console.log("Connected to MongoDB");
  return collections;
}

module.exports = { client, connectDatabase };
