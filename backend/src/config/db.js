import mongoose from "mongoose";
import dns from "node:dns";

export const connectDB = async () => {
  try {
    // Force Node.js to use Google/Cloudflare public DNS servers to resolve SRV records
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGODB CONNECTED SUCCESSFULLY!");
  } catch (error) {
    console.error("Error connecting to MONGODB", error);
    process.exit(1); // exit with failure
  }
};
