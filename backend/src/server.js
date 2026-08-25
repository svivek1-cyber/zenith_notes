const config = require("./config/env");
const { client, connectDatabase } = require("./db/mongo");
const { createApp } = require("./app");

async function start() {
  const collections = await connectDatabase();
  const app = createApp(collections);
  app.listen(config.port, () => console.log(`Notes API listening on port ${config.port}`));
}

start().catch((error) => { console.error("Application startup failed:", error); process.exitCode = 1; });

async function shutdown(signal) {
  console.log(`${signal} received, closing MongoDB connection`);
  await client.close();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
