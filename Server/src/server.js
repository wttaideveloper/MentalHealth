require("dotenv").config();
const { connectDb } = require("./config/db");
const { app } = require("./app");
const { cfg } = require("./config/config");

(async function startServer() {
  await connectDb(cfg.MONGO_URI);
  app.listen(cfg.PORT, () => console.log(`✅ Server: http://localhost:${cfg.PORT}`));
})().catch((startupErrorValue) => {
  console.error("❌ Startup error:", startupErrorValue);
  process.exit(1);
});
