import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * One-off migration script: deletes all notes that have no userId.
 * Run this ONCE before deploying the auth changes:
 *   node backend/src/scripts/migrateNotes.js
 */
async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await mongoose.connection.db
      .collection("notes")
      .deleteMany({ userId: { $exists: false } });

    console.log(`Deleted ${result.deletedCount} note(s) without a userId.`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrate();
