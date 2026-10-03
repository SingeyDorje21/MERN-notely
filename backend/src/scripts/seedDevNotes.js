import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import { DEV_USER } from "../routes/devAuthRoutes.js";

dotenv.config();

/**
 * Fills the local dev account (see devAuthRoutes.js) with generated notes for
 * testing search and sort. Only touches the dev user's notes.
 *
 *   npm run seed:dev               adds 1000 notes
 *   npm run seed:dev -- 250        adds 250 notes
 *   npm run seed:dev -- --reset    deletes the dev user's notes first
 *
 * Search test cases baked into the data:
 *   "zephyr"            rare word, in exactly 5 notes
 *   "C++", "node.js",
 *   "50% off", "(draft)" regex-special characters, must match literally
 *   "strong", "list"    plain words that are also HTML tag/markup names
 */

const args = process.argv.slice(2);
const COUNT = Number(args.find((arg) => /^\d+$/.test(arg))) || 1000;
const RESET = args.includes("--reset");
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Deterministic RNG so every run produces the same notes
let rngState = 42;
const random = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
};
const pick = (list) => list[Math.floor(random() * list.length)];

const TOPICS = [
  { title: ["Sprint retro", "Standup notes", "Planning session", "1:1 with manager"], words: ["blockers", "velocity", "deadline", "roadmap", "backlog", "estimate", "deploy"] },
  { title: ["Recipe", "Meal prep", "Grocery list", "Dinner ideas"], words: ["garlic", "basil", "lentils", "sourdough", "oven", "simmer", "lemon"] },
  { title: ["Book notes", "Reading list", "Article summary", "Podcast takeaways"], words: ["chapter", "author", "argument", "highlight", "quote", "thesis", "memoir"] },
  { title: ["Trip plan", "Packing list", "Itinerary", "Travel budget"], words: ["passport", "hostel", "train", "museum", "flight", "Lisbon", "Kyoto"] },
  { title: ["Workout log", "Running plan", "Gym routine", "Stretching"], words: ["squats", "tempo", "intervals", "recovery", "deadlift", "mileage", "protein"] },
  { title: ["Bug investigation", "Code review", "Refactor ideas", "API design"], words: ["node.js", "mongoose", "endpoint", "regression", "stack trace", "C++", "latency"] },
  { title: ["Budget", "Expenses", "Shopping", "Gift ideas"], words: ["rent", "invoice", "50% off", "subscription", "receipt", "savings", "refund"] },
  { title: ["Journal", "Morning pages", "Weekly review", "Gratitude"], words: ["sleep", "focus", "habits", "weekend", "family", "walk", "calm"] },
];

const SENTENCES = [
  (w) => `Need to follow up on the ${w} before Friday.`,
  (w) => `The ${w} part went better than expected.`,
  (w) => `Remember: ${w} first, everything else after.`,
  (w) => `Still not sure about the ${w}; revisit next week.`,
  (w) => `Quick idea about ${w} that came up today.`,
  (w) => `Compare two options for the ${w} and pick one.`,
];

const ZEPHYR_EVERY = Math.max(1, Math.floor(COUNT / 5));

function makeNote(index, userId) {
  const topic = pick(TOPICS);
  const word = () => pick(topic.words);
  const sentence = () => pick(SENTENCES)(word());
  const draft = random() < 0.1 ? " (draft)" : "";
  const title = `${pick(topic.title)} #${index + 1}${draft}`;

  const blocks = [`<p>${sentence()} ${sentence()}</p>`];
  if (random() < 0.5) blocks.push(`<ul><li><p>${sentence()}</p></li><li><p>${sentence()}</p></li></ul>`);
  if (random() < 0.3) blocks.push(`<p><strong>Important:</strong> ${sentence()}</p>`);
  if (random() < 0.15) blocks.push(`<h2>Next steps</h2><p>Make a list of what's left.</p>`);
  if (random() < 0.1) blocks.push(`<pre><code>${word()} --check</code></pre>`);
  if (index % ZEPHYR_EVERY === 0 && index / ZEPHYR_EVERY < 5) {
    blocks.push(`<p>The zephyr through the window made it hard to concentrate.</p>`);
  }

  const createdAt = new Date(Date.now() - random() * YEAR_MS);
  const updatedAt = new Date(Math.min(Date.now(), createdAt.getTime() + random() * 30 * 24 * 60 * 60 * 1000));
  return { title, content: blocks.join(""), userId, totNotes: 0, createdAt, updatedAt, __v: 0 };
}

async function seed() {
  if (process.env.DEV_LOGIN !== "true") {
    console.error("Refusing to seed: DEV_LOGIN is not 'true' in backend/.env.");
    process.exit(1);
  }

  await connectDB();
  try {
    const user = await User.findOneAndUpdate(
      { googleId: DEV_USER.googleId },
      { $setOnInsert: DEV_USER },
      { upsert: true, new: true }
    );
    const notes = mongoose.connection.db.collection("notes");

    if (RESET) {
      const { deletedCount } = await notes.deleteMany({ userId: user._id });
      console.log(`Deleted ${deletedCount} existing dev note(s).`);
    }

    // Raw driver insert so the generated createdAt/updatedAt are kept as-is
    const docs = Array.from({ length: COUNT }, (_, i) => makeNote(i, user._id));
    await notes.insertMany(docs);

    const total = await notes.countDocuments({ userId: user._id });
    console.log(`Inserted ${COUNT} notes for ${DEV_USER.email}. The dev account now has ${total} notes.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error("Seed error:", error);
  process.exit(1);
});
