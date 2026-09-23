const env = require("./config/env");
const app = require("./app");
const connectDatabase = require("./config/database");

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`Home Services API is running on port ${env.PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server failed:", error.code || error.name);
      process.exit(1);
    });
  } catch (error) {
    // Avoid logging connection strings or database credentials.
    console.error("Database startup failed:", error.name);
    console.error("Check MONGODB_URI and confirm MongoDB is reachable.");
    process.exit(1);
  }
}

startServer();