const mongoose = require("mongoose");

async function connectDb(mongoUriValue) {
  if (!mongoUriValue) throw new Error("MONGO_URI missing");
  console.log("Attempting MongoDB connection...");
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUriValue, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log("✅ MongoDB connected");
}

module.exports = { connectDb };
