const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { connectDb } = require("./config/db");
const { createApp } = require("./app");
const { cfg } = require("./config/config");

(async function startServer() {
  console.log("Debug - MONGO_URI:", cfg.MONGO_URI ? "Found" : "Missing");
  
  try {
    await connectDb(cfg.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.log("⚠️  MongoDB not available, running without database");
    console.error("MongoDB Error:", err.message);
  }
  
  const app = await createApp();
  
  app.listen(cfg.PORT, () => {
    console.log(`✅ Server running on: http://localhost:${cfg.PORT}`);
    if (cfg.NODE_ENV === "development") {
      console.log(`🔥 Vite dev server ready`);
      console.log(`📱 Frontend: http://localhost:${cfg.PORT}`);
    }
  });
})().catch((startupErrorValue) => {
  console.error("❌ Startup error:", startupErrorValue);
  process.exit(1);
});
