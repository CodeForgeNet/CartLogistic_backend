// /Users/karansingh/Desktop/GreenCart Logistics/backend/config/config.js
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

module.exports = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "yourjwtsecretkey",
  jwtExpire: process.env.JWT_EXPIRE || "24h",
  bcryptSalt: parseInt(process.env.BCRYPT_SALT || "10"),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",
};
