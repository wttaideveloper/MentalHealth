const mongoose = require("mongoose");

async function connectDb(mongoUriValue) {
  if (!mongoUriValue) throw new Error("MONGO_URI missing");
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUriValue);
  console.log("✅ MongoDB connected");
}

module.exports = { connectDb };
