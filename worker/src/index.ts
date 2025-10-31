import "dotenv/config";
import { findPendingJob, processJob } from "./job-processor";

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "30000", 10);

let isRunning = false;
let shutdownRequested = false;

async function poll() {
  if (shutdownRequested) {
    return;
  }

  if (isRunning) {
    return;
  }

  const jobId = await findPendingJob();

  if (jobId) {
    isRunning = true;
    try {
      await processJob(jobId);
    } catch (error) {
      console.error("Error processing job:", error);
    } finally {
      isRunning = false;
    }
  }

  // Schedule next poll
  setTimeout(poll, POLL_INTERVAL_MS);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  shutdownRequested = true;
  // Give current job time to finish
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  shutdownRequested = true;
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

console.log("Book generation worker started");
console.log(`Polling interval: ${POLL_INTERVAL_MS}ms`);
console.log(
  `Fallback model (only used if job.model is missing): ${process.env.MODEL || "openai/gpt-4o-mini"}`
);
console.log("Note: Models are specified per job in the database");

// Start polling
poll();
