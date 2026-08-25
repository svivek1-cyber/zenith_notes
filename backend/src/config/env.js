const dotenv = require("dotenv");
dotenv.config();

const config = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  groqApiUrl: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
};

if (!config.mongoUri) throw new Error("MONGODB_URI is not defined. Add it to backend/.env.");

module.exports = config;
